const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
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
    res.status(201).json(newMatch);
  } catch (error) {
    console.error('Error assigning volunteer:', error);
    res.status(500).json({ message: 'Error assigning volunteer' });
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

// Match volunteers based on skills and availability for a selected event
router.post('/match', async (req, res) => {
  try {
    // Return all profiles, populating the user details
    const profiles = await Profile.find({}).populate('user');
    
    if (profiles.length === 0) {
      return res.status(200).json({ message: 'No volunteers found' });
    }

    res.status(200).json(profiles); // Return all volunteers
  } catch (error) {
    res.status(500).json({ message: 'Error finding volunteers', error });
  }
});

module.exports = router;