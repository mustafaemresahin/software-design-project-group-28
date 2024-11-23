const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Match = require('../models/Match');

// Create a new event
router.post('/create', async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).send({ message: "Event created successfully", data: event });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get all events
router.get('/all', async (req, res) => {
  try {
    const events = await Event.find({});
    res.status(200).send(events);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get('/all-with-volunteer-count', async (req, res) => {
  try {
    const events = await Event.find({});
    const eventData = await Promise.all(
      events.map(async (event) => {
        const volunteers = await Match.find({ eventId: event._id })
          .populate('userId', 'name email') // Populate volunteer details
          .select('userId'); // Only include user details

        const volunteerCount = volunteers.length;

        return {
          ...event.toObject(),
          volunteerCount,
          volunteers: volunteers.map((v) => ({
            name: v.userId.name,
            email: v.userId.email,
          })),
        };
      })
    );
    res.status(200).json(eventData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events', error });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) {
        return res.status(404).send({ message: 'Event not found' });
      }
      res.status(200).send(event);
    } catch (error) {
      res.status(500).send({ message: 'Error fetching event', error });
    }
  });
  
  // Update event by ID
  router.put('/update/:id', async (req, res) => {
    try {
      const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!event) {
        return res.status(404).send({ message: 'Event not found' });
      }
      res.status(200).send({ message: 'Event updated successfully', event });
    } catch (error) {
      res.status(500).send({ message: 'Error updating event', error });
    }
  });

  // Delete event by ID
router.delete('/delete/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).send({ message: 'Event not found' });
    }

    await event.deleteOne(); // Trigger the middleware
    res.status(200).send({ message: 'Event and associated data deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).send({ message: 'Error deleting event and associated data', error });
  }
});


module.exports = router;
