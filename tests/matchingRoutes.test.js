const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const matchingRoutes = require('../routes/matchingRoutes');
const Match = require('../models/Match');
const Notifs = require('../models/Notifs');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Event = require('../models/Event');

// Mock Mongoose models
jest.mock('../models/Match');
jest.mock('../models/Notifs');
jest.mock('../models/User');
jest.mock('../models/Profile');
jest.mock('../models/Event');

// Initialize Express app
const app = express();
app.use(express.json());
app.use('/matching', matchingRoutes);

describe('Matching Routes', () => {
  const validUserId = new mongoose.Types.ObjectId().toString();
  const validEventId = new mongoose.Types.ObjectId().toString();
  const normalizedDate = new Date();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test GET /all
  describe('GET /all', () => {
    it('should return all matches with populated user and event data', async () => {
      Match.find.mockImplementation(() => ({
        populate: jest.fn().mockImplementation(() => ({
          populate: jest.fn().mockResolvedValue([
            {
              userId: { name: 'User 1', email: 'user1@example.com' },
              eventId: { eventName: 'Event 1', eventDate: new Date(), location: 'Location 1' },
            },
          ]),
        })),
      }));

      const response = await request(app).get('/matching/all');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        {
          userName: 'User 1',
          userEmail: 'user1@example.com',
          eventName: 'Event 1',
          eventDate: expect.any(String),
          eventLocation: 'Location 1',
        },
      ]);
    });

    it('should return an empty array if no matches exist', async () => {
      Match.find.mockImplementation(() => ({
        populate: jest.fn().mockImplementation(() => ({
          populate: jest.fn().mockResolvedValue([]),
        })),
      }));

      const response = await request(app).get('/matching/all');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return 500 if Match.find fails', async () => {
      Match.find.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/matching/all');
      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Error fetching matches');
    });
  });

  // Test POST /assign
  describe('POST /assign', () => {
    it('should assign users to an event successfully', async () => {
      Event.findById.mockResolvedValue({
        _id: validEventId,
        eventName: 'Test Event',
        eventDescription: 'Test Description',
        location: 'Test Location',
        eventDate: new Date(),
      });
      User.find.mockResolvedValue([{ _id: validUserId, name: 'Test User' }]);
      Match.find.mockResolvedValue([]);
      Match.insertMany.mockResolvedValue([]);
      Notifs.insertMany.mockResolvedValue([]);

      const response = await request(app).post('/matching/assign').send({
        userId: validUserId,
        eventId: validEventId,
        action: 'assign',
      });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Users assigned to event successfully.');
    });

    it('should handle assigning users who are already matched', async () => {
      Match.find.mockResolvedValue([{ userId: validUserId }]); // Simulate existing match

      const response = await request(app).post('/matching/assign').send({
        userId: validUserId,
        eventId: validEventId,
        action: 'assign',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('All users are already assigned to this event.');
    });

    it('should return 400 if eventId is missing', async () => {
      const response = await request(app).post('/matching/assign').send({
        userId: validUserId,
        action: 'assign',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('eventId is required.');
    });

    it('should return 400 if action is invalid', async () => {
      const response = await request(app).post('/matching/assign').send({
        userId: validUserId,
        eventId: validEventId,
        action: 'invalid',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid action. Use 'assign' or 'unassign'.");
    });

    it('should handle unassigning users from an event', async () => {
      Event.findById.mockResolvedValue({ _id: validEventId });
      Match.deleteMany.mockResolvedValue({ deletedCount: 1 });
      Notifs.create.mockResolvedValue({});

      const response = await request(app).post('/matching/assign').send({
        userId: validUserId,
        eventId: validEventId,
        action: 'unassign',
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Users unassigned from event successfully and notifications created.');
    });

    it('should handle unassigning all users when userId is omitted', async () => {
      Event.findById.mockResolvedValue({ _id: validEventId });
      Match.deleteMany.mockResolvedValue({ deletedCount: 5 });

      const response = await request(app).post('/matching/assign').send({
        eventId: validEventId,
        action: 'unassign',
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('All users unassigned from event successfully.');
    });

    it('should return 500 if Match.insertMany fails during assignment', async () => {
      Event.findById.mockResolvedValue({ _id: validEventId });
      Match.insertMany.mockRejectedValue(new Error('Database error'));

      const response = await request(app).post('/matching/assign').send({
        userId: validUserId,
        eventId: validEventId,
        action: 'assign',
      });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Error processing request.');
    });

    it('should return 500 if Match.deleteMany fails during unassignment', async () => {
      Match.deleteMany.mockRejectedValue(new Error('Database error'));

      const response = await request(app).post('/matching/assign').send({
        eventId: validEventId,
        action: 'unassign',
      });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Error processing request.');
    });
  });

  // Test POST /match
  describe('POST /match', () => {
    it('should match volunteers based on skills and availability', async () => {
      Event.findById.mockResolvedValue({
        _id: validEventId,
        requiredSkills: ['Skill 1'],
        eventDate: normalizedDate,
      });

      Profile.find.mockResolvedValue([
        {
          user: { _id: validUserId, name: 'User 1' },
          skills: ['Skill 1'],
          availability: [normalizedDate],
        },
      ]);

      const response = await request(app).post('/matching/match').send({ eventId: validEventId });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        {
          user: { _id: validUserId, name: 'User 1' },
          skills: ['Skill 1'],
          availability: [normalizedDate],
        },
      ]);
    });

    it('should return 400 if eventId is missing', async () => {
      const response = await request(app).post('/matching/match').send({});
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('eventId is required.');
    });

    it('should return 404 if event is not found', async () => {
      Event.findById.mockResolvedValue(null);

      const response = await request(app).post('/matching/match').send({ eventId: validEventId });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Event not found.');
    });

    it('should handle no matching profiles', async () => {
      Event.findById.mockResolvedValue({
        _id: validEventId,
        requiredSkills: ['Skill 1'],
        eventDate: normalizedDate,
      });
      Profile.find.mockResolvedValue([]);

      const response = await request(app).post('/matching/match').send({ eventId: validEventId });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return 500 if Profile.find fails', async () => {
      Profile.find.mockRejectedValue(new Error('Database error'));

      const response = await request(app).post('/matching/match').send({ eventId: validEventId });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Error matching volunteers.');
    });
  });

  // Test GET /volunteer-details
  describe('GET /volunteer-details', () => {
    it('should return volunteer-event details', async () => {
      Match.aggregate.mockResolvedValue([
        {
          userName: 'User 1',
          userEmail: 'user1@example.com',
          eventName: 'Event 1',
          eventDate: normalizedDate,
          eventLocation: 'Location 1',
        },
      ]);

      const response = await request(app).get('/matching/volunteer-details');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        {
          userName: 'User 1',
          userEmail: 'user1@example.com',
          eventName: 'Event 1',
          eventDate: expect.any(String),
          eventLocation: 'Location 1',
        },
      ]);
    });

    it('should return 500 if Match.aggregate fails', async () => {
      Match.aggregate.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/matching/volunteer-details');
      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Error fetching volunteer details.');
    });
  });
});
