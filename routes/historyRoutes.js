const express = require('express');
const router = express.Router();
const Match = require('../models/Match');

// Route to fetch volunteer history for a specific user
router.get('/', async (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    console.log(`Fetching volunteer history for user ID: ${userId}`);

    // Fetch matches for the given user ID
    const matches = await Match.find({ userId, eventId: { $ne: null } }).populate('eventId').exec();
    console.log('Matches found:', matches);

    if (!matches.length) {
      return res.status(200).json([]); // Return empty array if no matches found
    }

    const history = matches.map((match) => ({
      eventName: match.eventId?.eventName || 'Unknown Event',
      eventDescription: match.eventId?.eventDescription || 'No description provided',
      location: match.eventId?.location || 'Not specified',
      requiredSkills: match.eventId?.requiredSkills || [],
      urgency: match.eventId?.urgency || 'Low',
      eventDate: match.eventId?.eventDate || new Date().toISOString(),
      participationStatus: match.participationStatus || 'Pending',
      matchedOn: match.matchedOn,
    }));

    res.status(200).json(history);
  } catch (err) {
    console.error('Error fetching volunteer history:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
