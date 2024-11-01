const request = require('supertest');
const express = require('express');
const historyRoutes = require('../routes/historyRoutes');
const Match = require('../models/Match');
const jwt = require('jsonwebtoken');

jest.mock('../models/Match');
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn().mockReturnValue({ id: 'user123' }),
}));

const app = express();
app.use(express.json());
app.use('/history', historyRoutes);

describe('History Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /history', () => {
    it('should return 401 if the authorization header is missing', async () => {
      const res = await request(app).get('/history');
      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({ message: 'Unauthorized, token missing' });
    });

    it('should return 401 if the authorization token is invalid', async () => {
      jwt.verify.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      const res = await request(app)
        .get('/history')
        .set('Authorization', 'Bearer invalidToken');

      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({ message: 'Unauthorized, token invalid' });
    });

    it('should return an empty array if no matches are found for the user', async () => {
      Match.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]), // Simulates no matches found
      });

      const res = await request(app)
        .get('/history')
        .set('Authorization', 'Bearer validToken');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should fetch and map volunteer history when matches are found', async () => {
      const mockMatches = [
        {
          _id: '1',
          userId: 'user123',
          eventId: {
            eventName: 'Test Event',
            eventDescription: 'Event description',
            location: 'Test Location',
            requiredSkills: ['Skill1', 'Skill2'],
            urgency: 'High',
            eventDate: new Date('2024-10-20'),
          },
          matchedOn: new Date('2024-09-01'),
        },
      ];
      Match.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockMatches),
      });

      const res = await request(app)
        .get('/history')
        .set('Authorization', 'Bearer validToken');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([
        {
          eventName: 'Test Event',
          eventDescription: 'Event description',
          location: 'Test Location',
          requiredSkills: ['Skill1', 'Skill2'],
          urgency: 'High',
          eventDate: new Date('2024-10-20').toISOString(),
          participationStatus: 'Matched',
          matchedOn: new Date('2024-09-01').toISOString(),
        },
      ]);
    });

    it('should apply default values when eventId fields are null', async () => {
      const mockMatches = [
        {
          _id: '1',
          userId: 'user123',
          eventId: {
            eventName: null,
            eventDescription: null,
            location: null,
            requiredSkills: null,
            urgency: null,
            eventDate: null,
          },
          matchedOn: new Date('2024-10-01'),
        },
      ];
      Match.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockMatches),
      });

      const res = await request(app)
        .get('/history')
        .set('Authorization', 'Bearer validToken');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([
        {
          eventName: 'Unknown Event',
          eventDescription: 'No description provided',
          location: 'Not specified',
          requiredSkills: [],
          urgency: 'Low',
          eventDate: expect.any(String), // Default date
          participationStatus: 'Matched',
          matchedOn: new Date('2024-10-01').toISOString(),
        },
      ]);
    });

    it('should return 500 if there is an error while fetching matches', async () => {
      Match.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      const res = await request(app)
        .get('/history')
        .set('Authorization', 'Bearer validToken');

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ message: 'Server error' });
    });
  });
});
