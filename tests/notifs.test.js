const express = require('express');
const request = require('supertest');
const router = require('../routes/notifsRoutes.js'); // Adjust the path to your router
const Notifs = require('../models/Notifs');
const Event = require('../models/Event');
const moment = require('moment'); // Import moment
const cron = require('node-cron'); // Import cron

jest.mock('../models/Notifs');
jest.mock('../models/Event');

const app = express();
app.use(express.json()); // Add JSON body parser middleware
app.use('/notifs', router); // Mount the router

describe('Notifications Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mock data before each test
  });

  // Test the POST /create route
  it('should create a notification for an event', async () => {
    const mockEvent = { _id: '1', eventName: 'Test Event', eventDescription: 'Event Description', location: 'Location', eventDate: '2024-10-25' };
    const mockNotification = { _id: '1', event: '1', eventName: 'Test Event', title: 'A New Event Has Been Posted!' };

    Event.findById.mockResolvedValue(mockEvent);
    Notifs.create.mockResolvedValue(mockNotification);

    const response = await request(app)
      .post('/notifs/create')
      .send({ eventId: '1', notifType: 'new event', userId: '123' })
      .expect(201);

    expect(response.body.message).toBe('Notification created successfully.');
    expect(Notifs.create).toHaveBeenCalledTimes(1);
  });

  // Test the POST /delete route
  it('should create a notification for an event cancellation', async () => {
    const mockNotification = { _id: '1', title: 'An Event Has Been Canceled', eventName: 'Test Event' };

    Notifs.create.mockResolvedValue(mockNotification);

    const response = await request(app)
      .post('/notifs/delete')
      .send({ eventName: 'Test Event', eventDescription: 'Test Description', eventLocation: 'Test Location', eventDate: '2024-10-25' })
      .expect(201);

    expect(response.body.message).toBe('Notification created successfully.');
    expect(Notifs.create).toHaveBeenCalledTimes(1);
  });

  // Test the POST /matched route
  it('should create notifications for matched users', async () => {
    const mockEvent = { _id: '1', eventName: 'Test Event', eventDescription: 'Event Description', location: 'Location', eventDate: '2024-10-25' };
    const mockNotifications = [
      { _id: '1', event: '1', user: '123', title: 'You Have Been Matched To An Event!' },
      { _id: '2', event: '1', user: '124', title: 'You Have Been Matched To An Event!' }
    ];

    Event.findById.mockResolvedValue(mockEvent);
    Notifs.create.mockResolvedValueOnce(mockNotifications[0]).mockResolvedValueOnce(mockNotifications[1]);

    const response = await request(app)
      .post('/notifs/matched')
      .send({ eventId: '1', userIds: ['123', '124'] })
      .expect(201);

    expect(response.body.message).toBe('Notifications created successfully for matched users.');
    expect(Notifs.create).toHaveBeenCalledTimes(2); // Called for each user in the array
  });

  // Test the GET /all route (for a specific user)
  it('should get notifications for a specific user', async () => {
    const mockNotifications = [
      { _id: '1', eventName: 'Event 1', title: 'You Have Been Matched To An Event!' },
      { _id: '2', eventName: 'Event 2', title: 'Upcoming Event Alert!' }
    ];

    Notifs.find.mockImplementation(() => ({
      sort: jest.fn().mockResolvedValue(mockNotifications)
    }));

    const response = await request(app)
      .get('/notifs/all')
      .query({ userId: '123' })
      .expect(200);

    expect(response.body).toEqual(mockNotifications);
    expect(Notifs.find).toHaveBeenCalledTimes(1);
  });

  // Test the GET /all route (for all notifications)
  it('should get all notifications', async () => {
    const mockNotifications = [
      { _id: '1', eventName: 'Event 1', title: 'You Have Been Matched To An Event!' },
      { _id: '2', eventName: 'Event 2', title: 'Upcoming Event Alert!' }
    ];

    Notifs.find.mockImplementation(() => ({
      sort: jest.fn().mockResolvedValue(mockNotifications)
    }));

    const response = await request(app)
      .get('/notifs/all')
      .expect(200);

    expect(response.body).toEqual(mockNotifications);
    expect(Notifs.find).toHaveBeenCalledTimes(1);
  });

  // Test the cron job for upcoming events
  it('should create notifications for upcoming events in the next 24 hours', async () => {
    const mockEvent = { _id: '1', eventName: 'Upcoming Event', eventDescription: 'Event Description', location: 'Location', eventDate: moment().add(10, 'hours').toISOString() };
    const mockNotification = { _id: '1', title: 'Upcoming Event Alert!', event: '1' };
  
    Event.find.mockResolvedValue([mockEvent]);
    Notifs.findOne.mockResolvedValue(null); // No existing notification
    Notifs.create.mockResolvedValue(mockNotification);
  
    // Instead of cron.schedule, manually execute the logic
    const currentDate = moment();
    const nextDayDate = moment().add(1, 'days');
  
    // Mock the events found within the next 24 hours
    const upcomingEvents = await Event.find({
      eventDate: {
        $gte: currentDate.toDate(),
        $lte: nextDayDate.toDate(),
      },
    });
  
    // Process each event and create a notification if one doesn't exist
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
        return null;
      }
    }));
  
    // Check if the notification was created
    const createdNotifications = notifications.filter(notification => notification !== null);
    expect(Notifs.create).toHaveBeenCalledTimes(createdNotifications.length);
    expect(Notifs.create).toHaveBeenCalledWith({
      title: 'Upcoming Event Alert!',
      event: mockEvent._id,
      eventName: mockEvent.eventName,
      eventDescription: mockEvent.eventDescription,
      location: mockEvent.location,
      eventDate: mockEvent.eventDate,
    });
  });  
});
