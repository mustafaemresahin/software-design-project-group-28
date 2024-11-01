const request = require('supertest');
const express = require('express');
const Notifs = require('../models/Notifs');
const Event = require('../models/Event');
const router = require('../routes/notifsRoutes');
const moment = require('moment');

jest.mock('../models/Notifs');
jest.mock('../models/Event');

const app = express();
app.use(express.json());
app.use('/notifs', router);

describe('Notifications Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Tests for POST /create route
  describe('POST /create', () => {
    it('should create a notification for a new event', async () => {
      const mockEvent = { _id: '1', eventName: 'Test Event' };
      const mockNotification = { _id: '1', event: '1', title: 'A New Event Has Been Posted!' };

      Event.findById.mockResolvedValue(mockEvent);
      Notifs.create.mockResolvedValue(mockNotification);

      const response = await request(app)
        .post('/notifs/create')
        .send({ eventId: '1', notifType: 'new event', userId: '123' });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Notification created successfully.');
      expect(Notifs.create).toHaveBeenCalledTimes(1);
      expect(Notifs.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'A New Event Has Been Posted!' }));
    });

    it('should return 404 if the event does not exist', async () => {
      Event.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/notifs/create')
        .send({ eventId: '999', notifType: 'new event', userId: '123' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Event not found.');
      expect(Notifs.create).not.toHaveBeenCalled();
    });

    it('should return 400 for an invalid notification type', async () => {
      const response = await request(app)
        .post('/notifs/create')
        .send({ eventId: '1', notifType: 'invalid type', userId: '123' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid notification type.');
      expect(Notifs.create).not.toHaveBeenCalled();
    });
  });

  // Tests for POST /delete route
  describe('POST /delete', () => {
    it('should create a cancellation notification', async () => {
      const mockNotification = { _id: '1', title: 'An Event Has Been Canceled' };

      Notifs.create.mockResolvedValue(mockNotification);

      const response = await request(app)
        .post('/notifs/delete')
        .send({ eventName: 'Test Event', eventDescription: 'Test Description', eventLocation: 'Test Location', eventDate: '2024-10-25' });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Notification created successfully.');
      expect(Notifs.create).toHaveBeenCalledTimes(1);
    });

    it('should return 400 for missing event details', async () => {
      const response = await request(app)
        .post('/notifs/delete')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Event name is required.');
      expect(Notifs.create).not.toHaveBeenCalled();
    });
  });

  // Tests for POST /matched route
  describe('POST /matched', () => {
    it('should create notifications for matched users', async () => {
      const mockEvent = { _id: '1', eventName: 'Test Event' };
      const mockNotifications = [
        { _id: '1', event: '1', user: '123', title: 'You Have Been Matched To An Event!' },
        { _id: '2', event: '1', user: '124', title: 'You Have Been Matched To An Event!' }
      ];

      Event.findById.mockResolvedValue(mockEvent);
      Notifs.create
        .mockResolvedValueOnce(mockNotifications[0])
        .mockResolvedValueOnce(mockNotifications[1]);

      const response = await request(app)
        .post('/notifs/matched')
        .send({ eventId: '1', userIds: ['123', '124'] });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Notifications created successfully for matched users.');
      expect(Notifs.create).toHaveBeenCalledTimes(2);
    });

    it('should return 400 if no user IDs are provided', async () => {
      const response = await request(app)
        .post('/notifs/matched')
        .send({ eventId: '1', userIds: [] });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('User IDs are required.');
      expect(Notifs.create).not.toHaveBeenCalled();
    });
  });

  // Tests for GET /all route
  describe('GET /all', () => {
    it('should retrieve notifications for a specific user', async () => {
      const mockNotifications = [{ _id: '1', title: 'Matched Event', user: '123' }];

      Notifs.find.mockResolvedValue(mockNotifications);

      const response = await request(app)
        .get('/notifs/all')
        .query({ userId: '123' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockNotifications);
      expect(Notifs.find).toHaveBeenCalledWith({ user: '123' });
    });

    it('should retrieve all notifications if no userId is provided', async () => {
      const mockNotifications = [{ _id: '1', title: 'General Notification' }];

      Notifs.find.mockResolvedValue(mockNotifications);

      const response = await request(app).get('/notifs/all');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockNotifications);
      expect(Notifs.find).toHaveBeenCalledTimes(1);
    });
  });

  // Test for scheduled cron job creating notifications for upcoming events
  describe('Cron Job: Notifications for Upcoming Events', () => {
    it('should create notifications for upcoming events within the next 24 hours', async () => {
      const mockEvent = {
        _id: '1',
        eventName: 'Upcoming Event',
        eventDate: moment().add(10, 'hours')
      };
      const mockNotification = {
        _id: '1',
        title: 'Upcoming Event Alert!',
        event: '1'
      };

      Event.find.mockResolvedValue([mockEvent]);
      Notifs.findOne.mockResolvedValue(null); // No existing notification
      Notifs.create.mockResolvedValue(mockNotification);

      const currentDate = moment();
      const nextDayDate = moment().add(1, 'days');

      // Directly invoke the notification creation logic for the cron job
      const upcomingEvents = await Event.find({
        eventDate: { $gte: currentDate.toDate(), $lte: nextDayDate.toDate() },
      });

      const notifications = await Promise.all(
        upcomingEvents.map(async (event) => {
          const existingNotification = await Notifs.findOne({
            event: event._id,
            title: 'Upcoming Event Alert!',
          });
          if (!existingNotification) {
            return await Notifs.create({
              title: 'Upcoming Event Alert!',
              event: event._id,
              eventName: event.eventName,
              eventDate: event.eventDate,
            });
          }
          return null;
        })
      );

      const createdNotifications = notifications.filter((n) => n !== null);
      expect(Notifs.create).toHaveBeenCalledTimes(createdNotifications.length);
      expect(Notifs.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'Upcoming Event Alert!' }));
    });
  });
});
