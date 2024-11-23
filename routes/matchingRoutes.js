// routes/matching.js

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Match = require('../models/Match');         // Mongoose model for matches
const Notifs = require('../models/Notifs');       // Mongoose model for notifications
const User = require('../models/User');           // Mongoose model for users
const Profile = require('../models/Profile');     // Mongoose model for profiles
const Event = require('../models/Event');         // Mongoose model for events

// Utility function to normalize dates (adds 1 day and sets to midnight UTC)
const normalizeDate = (date) => {
  const d = new Date(date);
  d.setDate(d.getDate() + 1); // Add 1 day to the date
  d.setHours(0, 0, 0, 0);     // Normalize to midnight UTC
  return d;
};

// Get all matches with volunteer and event details
router.get('/all', async (req, res) => {
  try {
    const matches = await Match.find()
      .populate('userId', 'name email')
      .populate('eventId', 'eventName eventDate location');

    const matchData = matches.map((match) => ({
      userName: match.userId?.name || 'N/A',
      userEmail: match.userId?.email || 'N/A',
      eventName: match.eventId?.eventName || 'N/A',
      eventDate: match.eventId?.eventDate || 'N/A',
      eventLocation: match.eventId?.location || 'N/A',
    }));

    res.status(200).json(matchData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching matches', error });
  }
});

/**
 * @route   POST /matching/assign
 * @desc    Assign or Unassign one or multiple volunteers to/from an event
 * @access  Protected (Implement authentication as needed)
 * @body    { userId: String | Array of Strings, eventId: String, action: 'assign' | 'unassign' }
 */
router.post('/assign', async (req, res) => {
  console.log('Received /assign request:', req.body);
  
  let { userId, eventId, action } = req.body;

  try {
    // Validate the 'action' parameter
    if (!['assign', 'unassign'].includes(action)) {
      return res.status(400).json({ message: "Invalid action. Use 'assign' or 'unassign'." });
    }

    // Validate presence of eventId
    if (!eventId) {
      return res.status(400).json({ message: 'eventId is required.' });
    }

    // Normalize userId to array for uniform processing
    let userIds = [];
    if (Array.isArray(userId)) {
      userIds = userId;
    } else if (typeof userId === 'string') {
      userIds = [userId];
    } else if (userId === undefined || userId === null) {
      userIds = [];
    } else {
      return res.status(400).json({ message: 'userId must be a string, an array of strings, or omitted.' });
    }

    // Validate that eventId is a valid ObjectId string
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid eventId format.' });
    }

    // Convert eventId to ObjectId using 'new'
    const eventObjectId = new mongoose.Types.ObjectId(eventId);

    if (action === 'assign') {
      // Ensure that userIds are provided for assignment
      if (userIds.length === 0) {
        return res.status(400).json({ message: 'At least one userId must be provided for assignment.' });
      }

      // Validate that all userIds are valid ObjectId strings
      for (let id of userIds) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({ message: `Invalid userId format: ${id}` });
        }
      }

      // Convert userIds to ObjectId using 'new'
      const userObjectIds = userIds.map(id => new mongoose.Types.ObjectId(id));

      // Fetch the event details
      const event = await Event.findById(eventObjectId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found.' });
      }

      // Fetch user details
      const users = await User.find({ _id: { $in: userObjectIds } });
      if (users.length !== userIds.length) {
        return res.status(404).json({ message: 'One or more users not found.' });
      }

      // Check for existing matches to prevent duplicate assignments
      const existingMatches = await Match.find({
        userId: { $in: userObjectIds },
        eventId: eventObjectId,
      }).select('userId');

      const existingUserIds = existingMatches.map(match => match.userId.toString());

      // Filter out users who are already assigned
      const newUserIds = userIds.filter(id => !existingUserIds.includes(id));

      if (newUserIds.length === 0) {
        return res.status(400).json({ message: 'All users are already assigned to this event.' });
      }

      // Create new matches for users not already assigned
      const newMatches = newUserIds.map(userId => ({
        userId: new mongoose.Types.ObjectId(userId),
        eventId: eventObjectId,
      }));

      await Match.insertMany(newMatches);

      // Create notifications for each newly assigned user
      const notifications = newUserIds.map(userId => {
        const user = users.find(u => u._id.toString() === userId);
        return {
          title: 'You Have Been Matched To An Event!',
          event: event._id,
          eventName: event.eventName,
          eventDescription: event.eventDescription,
          location: event.location,
          eventDate: event.eventDate,
          user: user._id,  // Associate this notification with the matched user
        };
      });

      await Notifs.insertMany(notifications);

      res.status(201).json({
        message: 'Users assigned to event successfully.',
        newMatches,
      });
    } else if (action === 'unassign') {
      if (userIds.length > 0) {
        // Unassign specific volunteers from the event
        for (let id of userIds) {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: `Invalid userId format: ${id}` });
          }
        }
    
        const userObjectIds = userIds.map((id) => new mongoose.Types.ObjectId(id));
    
        // Find and remove the matches
        const deletedMatches = await Match.deleteMany({
          userId: { $in: userObjectIds },
          eventId: eventObjectId,
        });
    
        if (deletedMatches.deletedCount === 0) {
          return res.status(404).json({ message: 'No matches found to unassign.' });
        }
    
        // Create notifications for unassigned users
        const event = await Event.findById(eventObjectId);
        if (!event) {
          return res.status(404).json({ message: 'Event not found.' });
        }
    
        const notifications = await Promise.all(
          userObjectIds.map(async (userId) => {
            const notification = {
              user: userId,
              event: event._id,
              eventName: event.eventName,
              eventDescription: event.eventDescription,
              location: event.location,
              eventDate: event.eventDate,
              title: 'You Have Been Unassigned From An Event',
            };
    
            return await Notifs.create(notification);
          })
        );
    
        res.status(200).json({
          message: 'Users unassigned from event successfully and notifications created.',
          deletedCount: deletedMatches.deletedCount,
          notifications,
        });
      } else {
        // Unassign all volunteers from the event
        const deletedMatches = await Match.deleteMany({
          eventId: eventObjectId,
        });
    
        if (deletedMatches.deletedCount === 0) {
          return res.status(404).json({ message: 'No matches found to unassign.' });
        }
    
        res.status(200).json({
          message: 'All users unassigned from event successfully.',
          deletedCount: deletedMatches.deletedCount,
        });
      }
    }
  } catch (error) {
    console.error('Error assigning/unassigning volunteer:', error);
    res.status(500).json({ message: 'Error processing request.' });
  }
});

/**
 * @route   GET /matching/matched
 * @desc    Get all volunteer-event matches
 * @access  Protected (Implement authentication as needed)
 */
router.get('/matched', async (req, res) => {
  try {
    const matches = await Match.find({})
      .populate('userId', 'name')                   // Populate the user's name from the User model
      .populate('eventId', 'eventName eventDate');  // Populate the event details from the Event model

    res.status(200).json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ message: 'Error fetching matches.' });
  }
});

router.get('/volunteer-details', async (req, res) => {
  try {
    // Aggregate volunteer-event data
    const volunteerDetails = await Match.aggregate([
      {
        $lookup: {
          from: 'users', // The name of the User collection
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      {
        $lookup: {
          from: 'events', // The name of the Event collection
          localField: 'eventId',
          foreignField: '_id',
          as: 'eventDetails',
        },
      },
      {
        $unwind: '$userDetails', // Ensure userDetails is not an array
      },
      {
        $unwind: '$eventDetails', // Ensure eventDetails is not an array
      },
      {
        $project: {
          _id: 0, // Exclude the Match ID
          userName: '$userDetails.name',
          userEmail: '$userDetails.email',
          eventName: '$eventDetails.eventName',
          eventDate: '$eventDetails.eventDate',
          eventLocation: '$eventDetails.location',
        },
      },
    ]);

    res.status(200).json(volunteerDetails);
  } catch (error) {
    console.error('Error fetching volunteer details:', error);
    res.status(500).json({ message: 'Error fetching volunteer details.' });
  }
});

/**
 * @route   POST /matching/match
 * @desc    Match volunteers based on skills and availability for a selected event
 * @access  Protected (Implement authentication as needed)
 * @body    { eventId: String }
 */
router.post('/match', async (req, res) => {
  const { eventId } = req.body;

  try {
    // Validate presence of eventId
    if (!eventId) {
      return res.status(400).json({ message: 'eventId is required.' });
    }

    // Validate that eventId is a valid ObjectId string
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid eventId format.' });
    }

    // Find event details based on eventId
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Normalize eventDate to ensure time zones don't interfere
    const normalizedEventDate = normalizeDate(event.eventDate);
    console.log(`Normalized Event Date: ${normalizedEventDate}`);

    // Retrieve all profiles and log their availability
    const allProfiles = await Profile.find().populate('user');
    console.log('Profiles and their normalized availability:');
    allProfiles.forEach((profile) => {
      const normalizedAvailability = profile.availability.map(normalizeDate);
      console.log(`User: ${profile.fullName || 'Unknown'}, Availability: ${normalizedAvailability}`);
    });

    // Find profiles that match required skills and availability
    const matchedProfiles = await Profile.find({
      skills: { $in: event.requiredSkills },                      // Match profiles based on required skills
      availability: { $elemMatch: { $eq: normalizedEventDate } }, // Match normalized event date in availability
    }).populate('user'); // Populate user details for each profile

    console.log(`Number of matched profiles: ${matchedProfiles.length}`);
    matchedProfiles.forEach(profile => {
      console.log(`Matched User: ${profile.fullName}, Skills: ${profile.skills}, Availability: ${profile.availability}`);
    });

    res.status(200).json(matchedProfiles);
  } catch (error) {
    console.error('Error matching volunteers:', error);
    res.status(500).json({ message: 'Error matching volunteers.' });
  }
});

module.exports = router;
