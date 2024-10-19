const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const jwt = require('jsonwebtoken');

// Middleware to ensure the user is logged in
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized, token missing' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log('User authenticated, ID:', decoded.id);
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized, token invalid' });
  }
};

// Route to fetch volunteer history for the logged-in user
router.get('/', authenticateUser, async (req, res) => {
  const userId = req.user.id;

  try {
    console.log('Fetching matches for user ID:', userId);

    // Find matches for the logged-in user, and skip those with a null eventId
    const matches = await Match.find({ userId, eventId: { $ne: null } }).populate('eventId').exec();
    console.log('Matches found:', matches);

    if (!matches.length) {
      return res.status(200).json([]); // Return an empty array if no matches found
    }

    const history = matches.map(match => {
     // if (!match.eventId) {
       // return null;
     // }

     return {
      eventName: match.eventId?.eventName || 'Unknown Event',
      eventDescription: match.eventId?.eventDescription || 'No description provided',
      location: match.eventId?.location || 'Not specified',
      requiredSkills: match.eventId?.requiredSkills || [],
      urgency: match.eventId?.urgency || 'Low',
      eventDate: match.eventId?.eventDate || new Date().toISOString(),
      participationStatus: 'Matched',
      matchedOn: match.matchedOn,
    };
  }).filter(item => item !== null);

    res.json(history);
  } catch (err) {
    console.error('Error fetching volunteer history:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
