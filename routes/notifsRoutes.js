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

    if (notifType == 'new event') {
        // Create the notification object
        const notification = {
            title: 'A new event has been posted!',
            event: event._id,
            eventName: event.eventName,
            eventDescription: event.eventDescription,
            location: event.location,
            eventDate: event.eventDate,
            //user: user  // Assuming the user is passed along in the request
        };

        // Save the notification to the database
        const savedNotification = await Notifs.create(notification);
        res.status(201).json({ message: 'Notification created successfully.', savedNotification });
    }

    if (notifType == 'updated event') {
        // Create the notification object
        const notification = {
            title: 'An event has been updated',
            eventName: event.eventName,
            event: event._id,
            eventDescription: event.eventDescription,
            location: event.location,
            eventDate: event.eventDate,
            //user: user  // Assuming the user is passed along in the request
        };

        // Save the notification to the database
        const savedNotification = await Notifs.create(notification);
        res.status(201).json({ message: 'Notification created successfully.', savedNotification });
    }

    if (notifType == 'matched event') {
        // Create the notification object
        const notification = {
            title: 'You have been matched to an event!',
            event: event._id,
            eventName: event.eventName,
            eventDescription: event.eventDescription,
            location: event.location,
            eventDate: event.eventDate,
            //user: user  // Assuming the user is passed along in the request
        };

        // Save the notification to the database
        const savedNotification = await Notifs.create(notification);
        res.status(201).json({ message: 'Notification created successfully.', savedNotification });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while creating the notification.', error: error.message });
  }
});

// Scheduled task to check for events happening within a day
cron.schedule('0 0 * * *', async () => { // This runs every day at midnight
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

router.post('/delete', async (req, res) => {
    const { eventDetails } = req.body;
    try {
        const notification = {
            title: 'An event has been canceled',
            eventName: req.body.eventName,
            eventDescription: req.body.eventDescription,
            location: req.body.eventLocation,
            eventDate: req.body.eventDate
            //user: user  // Assuming the user is passed along in the request
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
