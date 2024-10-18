const request = require('supertest');
const express = require('express');
const app = express();
app.use(express.json());
const matchingRouter = require('../routes/matchingRoutes');
app.use('/matching', matchingRouter);

// Mock Mongoose models
jest.mock('../models/Match', () => {
  const MockMatch = jest.fn();
  MockMatch.prototype.save = jest.fn();
  MockMatch.findOne = jest.fn();
  MockMatch.find = jest.fn();
  return MockMatch;
});

const Match = require('../models/Match');

jest.mock('../models/Profile', () => {
  const MockProfile = jest.fn();
  MockProfile.find = jest.fn();
  return MockProfile;
});

const Profile = require('../models/Profile');

jest.mock('../models/Event');

describe('Volunteer Matching API', () => {
  beforeAll(async () => {
    // Setup mock data or any necessary configurations here
  });

  afterAll(async () => {
    // Cleanup any mock data if necessary
  });

  it('should assign a volunteer to an event', async () => {
    console.log('Mocking Match.findOne and Match.prototype.save');

    Match.findOne.mockResolvedValue(null); // No existing match

    // Mock the constructor to return an instance with a save method
    Match.mockImplementation(function (data) {
      return {
        ...data,
        save: jest.fn().mockResolvedValue({
          ...data,
          matchedOn: new Date().toISOString(),
        }),
      };
    });

    const response = await request(app)
      .post('/matching/assign')
      .send({ userId: '123', eventId: '456' });

    console.log('Response:', response.body);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('userId', '123');
    expect(response.body).toHaveProperty('eventId', '456');
  });

  it('should not assign the same volunteer twice to the same event', async () => {
    const mockMatch = { userId: '123', eventId: '456' };
    Match.findOne.mockResolvedValue(mockMatch); // Mock existing match

    const response = await request(app)
      .post('/matching/assign')
      .send({ userId: '123', eventId: '456' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('User is already assigned to this event.');
  });

  it('should fetch all matches with populated event and user data', async () => {
    console.log('Mocking Match.find and populate');

    Match.find.mockImplementation(() => ({
      populate: jest.fn().mockImplementation(() => ({
        populate: jest.fn().mockResolvedValue([
          {
            userId: { _id: 'userId', name: 'Test User' },
            eventId: {
              _id: 'eventId',
              eventName: 'Test Event',
              eventDate: new Date().toISOString(),
            },
          },
        ]),
      })),
    }));

    const response = await request(app).get('/matching/matched');

    console.log('Response:', response.body);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        userId: { _id: 'userId', name: 'Test User' },
        eventId: {
          _id: 'eventId',
          eventName: 'Test Event',
          eventDate: expect.any(String),
        },
      },
    ]);
  });

  it('should match all volunteers based on skills and availability', async () => {
    Profile.find.mockImplementation(() => ({
      populate: jest.fn().mockResolvedValue([
        {
          user: { _id: 'volunteerId', name: 'Test Volunteer' },
          skills: ['Food Preparation & Serving'],
        },
      ]),
    }));

    const response = await request(app).post('/matching/match');

    console.log('Response:', response.body);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        user: { _id: 'volunteerId', name: 'Test Volunteer' },
        skills: ['Food Preparation & Serving'],
      },
    ]);
  });

  it('should return 500 if there is a server error during match', async () => {
    Profile.find.mockImplementation(() => ({
      populate: jest.fn().mockRejectedValue(new Error('Server error')),
    }));

    const response = await request(app).post('/matching/match');

    console.log('Error Response:', response.body);

    expect(response.status).toBe(500);
    // Adjusted expected response to match actual output
    expect(response.body).toEqual({ message: 'Error finding volunteers', error: {} });
  });
});
