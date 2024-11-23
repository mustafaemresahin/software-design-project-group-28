const request = require('supertest');
const express = require('express');
const Notifs = require('../models/Notifs');
const Event = require('../models/Event');
const router = require('../routes/notifsRoutes');
const mongoose = require('mongoose');
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

  // POST /create route tests
  describe('POST /create', () => {
    it('should create a notification for a valid new event', async () => {
      const mockEvent = { _id: '1', eventName: 'Test Event', eventDescription: 'Test Desc' };
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

    it('should return 500 on server error', async () => {
      Event.findById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/notifs/create')
        .send({ eventId: '1', notifType: 'new event', userId: '123' });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('An error occurred while creating the notification.');
    });
  });

  // POST /delete route tests
  describe('POST /delete', () => {
    it('should create a cancellation notification', async () => {
      const mockNotification = { _id: '1', title: 'An Event Has Been Canceled' };

      Notifs.create.mockResolvedValue(mockNotification);

      const response = await request(app)
        .post('/notifs/delete')
        .send({
          eventName: 'Test Event',
          eventDescription: 'Test Description',
          eventLocation: 'Test Location',
          eventDate: '2024-10-25',
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Notification created successfully.');
      expect(Notifs.create).toHaveBeenCalledTimes(1);
    });

    it('should return 400 for missing event details', async () => {
      const response = await request(app).post('/notifs/delete').send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Event name is required.');
      expect(Notifs.create).not.toHaveBeenCalled();
    });

    it('should return 500 on server error', async () => {
      Notifs.create.mockRejectedValue(new Error('Database error'));

      const response = await request(app).post('/notifs/delete').send({
        eventName: 'Test Event',
        eventDescription: 'Test Description',
        eventLocation: 'Test Location',
        eventDate: '2024-10-25',
      });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('An error occurred while creating the notification.');
    });
  });

  // POST /matched route tests
  describe('POST /matched', () => {
    it('should create notifications for matched users', async () => {
      const mockEvent = { _id: '1', eventName: 'Test Event' };
      const mockNotifications = [
        { _id: '1', event: '1', user: '123', title: 'You Have Been Matched To An Event!' },
        { _id: '2', event: '1', user: '124', title: 'You Have Been Matched To An Event!' },
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

    it('should return 404 if the event is not found', async () => {
      Event.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/notifs/matched')
        .send({ eventId: '999', userIds: ['123', '124'] });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Event not found.');
    });

    it('should return 500 on server error', async () => {
      Event.findById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/notifs/matched')
        .send({ eventId: '1', userIds: ['123', '124'] });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('An error occurred while creating the notifications.');
    });
  });

  // GET /all route tests
  describe('GET /all', () => {
    it('should retrieve notifications for a specific user', async () => {
      const mockNotifications = [{ _id: '1', title: 'Matched Event', user: '123' }];

      Notifs.find.mockResolvedValue(mockNotifications);

      const response = await request(app).get('/notifs/all').query({ userId: '123' });

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

    it('should return 500 on server error', async () => {
      Notifs.find.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/notifs/all');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('An error occurred while fetching notifications.');
    });
  });
});
