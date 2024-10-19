const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const Notifs = require('../models/Notifs'); // Import Notification model
const User = require('../models/User');
const Profile = require('../models/Profile');
const Event = require('../models/Event');

// Route to assign a match (Assign volunteer to event)
router.post('/assign', async (req, res) => {
  const { userId, eventId } = req.body;

  try {
    // Check if the user is already assigned to the event
    const existingMatch = await Match.findOne({ userId, eventId });
    
    if (existingMatch) {
      return res.status(400).json({ message: 'User is already assigned to this event.' });
    }

    // If not assigned, proceed to create a new match
    const newMatch = new Match({ userId, eventId });
    await newMatch.save();

    // Find event and user details to create the notification
    const event = await Event.findById(eventId);
    const user = await User.findById(userId);

    if (!event || !user) {
      return res.status(404).json({ message: 'Event or user not found.' });
    }

    // Create a new notification for the user about the event match
    const newNotification = new Notifs({
      title: 'You Have Been Matched To An Event!',
      event: event._id,
      eventName: event.eventName,
      eventDescription: event.eventDescription,
      location: event.location,
      eventDate: event.eventDate,
      user: user._id,  // Associate this notification with the matched user
    });

    await newNotification.save();  // Save the notification to the database

    res.status(201).json(newMatch);
  } catch (error) {
    console.error('Error assigning volunteer and creating notification:', error);
    res.status(500).json({ message: 'Error assigning volunteer.' });
  }
});

// Route to get all matches
router.get('/matched', async (req, res) => {
  try {
    const matches = await Match.find({})
      .populate('userId', 'name')  // Populate the user's name from the User model
      .populate('eventId', 'eventName eventDate');  // Populate the event details from the Event model

    res.status(200).json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ message: 'Error fetching matches' });
  }
});

// Route to match volunteers based on skills and availability for a selected event
router.post('/match', async (req, res) => {
  const { eventId } = req.body;

  try {
    // Find event details based on eventId
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Find profiles that match the required skills for the event
    const matchedProfiles = await Profile.find({ 
      skills: { $in: event.requiredSkills }  // Match profiles based on required skills for the event
    }).populate('user'); // Populate the user data in the profile

    if (matchedProfiles.length === 0) {
      return res.status(404).json({ message: 'No matching volunteers found' });
    }

    res.status(200).json(matchedProfiles);
  } catch (error) {
    console.error('Error matching volunteers:', error);
    res.status(500).json({ message: 'Error matching volunteers' });
  }
});

module.exports = router;
