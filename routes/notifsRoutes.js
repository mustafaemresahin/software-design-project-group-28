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

//creates notification for upcoming events
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
            // Check if a notification with the specific title 'Upcoming Event Alert!' already exists for this event
            const existingNotification = await Notifs.findOne({ event: event._id, title: 'Upcoming Event Alert!' });

            if (!existingNotification) {
                // If no such notification exists, create a new one
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
                // If the notification with the title exists, return null
                console.log(`'Upcoming Event Alert!' notification already exists for event: ${event.eventName}`);
                return null;
            }
        }));

        // Filter out null values (for events where a notification already existed)
        const createdNotifications = notifications.filter(notification => notification !== null);

        console.log(`Notifications created successfully for upcoming events: ${createdNotifications.length}`);
    } catch (error) {
        console.error('Error creating notifications for upcoming events:', error.message);
    }
});

//creates notification for deleted events
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

/*
//creates notification for matched events
router.post('/matched', async (req, res) => {
    const { eventId, userId } = req.body;  // Get event ID and single user ID from request body

    try {
        const event = await Event.findById(eventId);

        // Check if the event exists
        if (!event) {
            return res.status(404).json({ message: 'Event not found.' });
        }

        // Create a notification for the user
        const notification = {
            user: userId,  // Associate the notification with the user ID
            event: event._id,
            eventName: event.eventName,
            eventDescription: event.eventDescription,
            location: event.location,
            eventDate: event.eventDate,
        };

        // Save the notification for the user
        const savedNotification = await Notifs.create(notification);

        res.status(201).json({ message: 'Notification created successfully.', savedNotification });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while creating the notification.', error: error.message });
    }
});
*/


// API endpoint to get notifications to show on frontend
router.get('/all', async (req, res) => {
    try {
        const notifications = await Notifs.find().sort({ createdAt: -1 }); // Get notifications sorted by creation date
        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while fetching notifications.', error: error.message });
    }
});



module.exports = router;
