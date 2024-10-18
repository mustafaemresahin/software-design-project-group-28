const express = require('express');
const router = express.Router();
const Notifs = require('../models/Notifs');
const Event = require('../models/Event');  // Import the Event model
const cron = require('node-cron'); // Import node-cron
const moment = require('moment');

// Route to create a notification for a given event
router.post('/create', async (req, res) => {
  const { eventId, notifType, userId } = req.body;  // Now also capturing userId
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
      user: userId // Now we assign the notification to a specific user
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

        // Find all upcoming events within the next 24 hours
        const upcomingEvents = await Event.find({
            eventDate: {
                $gte: currentDate.toDate(),
                $lte: nextDayDate.toDate(),
            },
        });

        // Process each event and check if a notification with the title 'Upcoming Event Alert!' exists before creating one
        const notifications = await Promise.all(upcomingEvents.map(async (event) => {
            const existingNotification = await Notifs.findOne({ event: event._id, title: 'Upcoming Event Alert!' });

            if (!existingNotification) {
                const notification = {
                    title: 'Upcoming Event Alert!',
                    event: event._id,
                    eventName: event.eventName,
                    eventDescription: event.eventDescription,
                    location: event.location,
                    eventDate: event.eventDate,
                };

                return await Notifs.create(notification);
            } else {
                console.log(`'Upcoming Event Alert!' notification already exists for event: ${event.eventName}`);
                return null;
            }
        }));

        const createdNotifications = notifications.filter(notification => notification !== null);
        console.log(`Notifications created successfully for upcoming events: ${createdNotifications.length}`);
    } catch (error) {
        console.error('Error creating notifications for upcoming events:', error.message);
    }
});

// Route to create a notification for event cancellation
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
        const savedNotification = await Notifs.create(notification);
        res.status(201).json({ message: 'Notification created successfully.', savedNotification });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while creating the notification.', error: error.message });
    }
});

// Route to create a notification when a user is matched to an event (for multiple users)
router.post('/matched', async (req, res) => {
    const { eventId, userIds } = req.body;  // Get event ID and an array of user IDs from request body

    try {
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: 'Event not found.' });
        }

        // Iterate over each user ID and create a notification for each
        const notifications = await Promise.all(userIds.map(async (userId) => {
            const notification = {
                user: userId,  // Associate the notification with the user ID
                event: event._id,
                eventName: event.eventName,
                eventDescription: event.eventDescription,
                location: event.location,
                eventDate: event.eventDate,
                title: 'You Have Been Matched To An Event!'
            };

            return await Notifs.create(notification);
        }));

        res.status(201).json({ message: 'Notifications created successfully for matched users.', notifications });
    } catch (error) {
        console.error('Error creating notifications for matched users:', error);
        res.status(500).json({ message: 'An error occurred while creating the notifications.', error: error.message });
    }
});

// API endpoint to get notifications to show on frontend
router.get('/all', async (req, res) => {
    try {
        const { userId } = req.query;
        let notifications = [];
        
        if (userId) {
            notifications = await Notifs.find({ user: userId }).sort({ createdAt: -1 }); // Filter by user ID
        } else {
            notifications = await Notifs.find().sort({ createdAt: -1 }); // Get all notifications if no userId is provided
        }
        
        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while fetching notifications.', error: error.message });
    }
});

module.exports = router;
