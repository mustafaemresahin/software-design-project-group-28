const express = require('express');
const router = express.Router();
const Notifs = require('../models/Notifs');
const Event = require('../models/Event');  // Import the Event model
const cron = require('node-cron'); // Import node-cron
const moment = require('moment');

// Route to create a notification for a given event
router.post('/create', async (req, res) => {
  const { eventId, notifType } = req.body;  // Get event ID and user info from request body
  try {
    // Find the event based on eventId
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const notification = {
      event: event._id,
      eventName: event.eventName,
      eventDescription: event.eventDescription,
      location: event.location,
      eventDate: event.eventDate,
    };

    switch (notifType) {
      case 'new event':
        notification.title = 'A New Event Has Been Posted!';
        break;
      case 'updated event':
        notification.title = 'An Event Has Been Updated';
        break;
      case 'matched event':
        notification.title = 'You Have Been Matched To An Event!';
        break;
      default:
        return res.status(400).json({ message: 'Invalid notification type.' });
    }

    // Save the notification to the database
    const savedNotification = await Notifs.create(notification);
    res.status(201).json({ message: 'Notification created successfully.', savedNotification });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while creating the notification.', error: error.message });
  }
});

// Scheduled task to check for events happening within a day every 5 minutes
cron.schedule('*/5 * * * *', async () => { // This runs every 5 minutes
    try {
        const currentDate = moment();
        const nextDayDate = moment().add(1, 'days');

        const upcomingEvents = await Event.find({
            eventDate: {
                $gte: currentDate.toDate(),
                $lte: nextDayDate.toDate(),
            },
        });

        const notifications = await Promise.all(upcomingEvents.map(async (event) => {
            const notification = {
                title: 'Upcoming Event Alert!',
                event: event._id,
                eventName: event.eventName,
                eventDescription: event.eventDescription,
                location: event.location,
                eventDate: event.eventDate,
            };

            return await Notifs.create(notification);
        }));

        console.log(`Notifications created successfully for upcoming events: ${notifications.length}`);
    } catch (error) {
        console.error('Error creating notifications for upcoming events:', error.message);
    }
});

// API endpoint to get notifications
router.get('/all', async (req, res) => {
    try {
        const notifications = await Notifs.find().sort({ createdAt: -1 }); // Get notifications sorted by creation date
        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while fetching notifications.', error: error.message });
    }
});

router.post('/delete', async (req, res) => {
    const { eventDetails } = req.body;
    try {
        const notification = {
            title: 'An Event Has Been Canceled',
            eventName: req.body.eventName,
            eventDescription: req.body.eventDescription,
            location: req.body.eventLocation,
            eventDate: req.body.eventDate
        };
        // Save the notification to the database
        const savedNotification = await Notifs.create(notification);
        res.status(201).json({ message: 'Notification created successfully.', savedNotification });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while creating the notification.', error: error.message });
    }
});

module.exports = router;
