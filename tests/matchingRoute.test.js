const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose'); // Import mongoose to generate ObjectIds
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

jest.mock('../models/Event', () => {
  const MockEvent = jest.fn();
  MockEvent.findById = jest.fn();
  return MockEvent;
});

const Event = require('../models/Event');

jest.mock('../models/User', () => {
  const MockUser = jest.fn();
  MockUser.findById = jest.fn();
  return MockUser;
});

const User = require('../models/User');

jest.mock('../models/Notifs', () => {
  const MockNotifs = jest.fn();
  MockNotifs.prototype.save = jest.fn();
  return MockNotifs;
});

const Notifs = require('../models/Notifs');

describe('Volunteer Matching API', () => {
  beforeAll(async () => {
    // Setup mock data or any necessary configurations here
  });

  afterAll(async () => {
    // Cleanup any mock data if necessary
  });

 it('should assign a volunteer to an event', async () => {
  console.log('Mocking Match.findOne and Match.prototype.save');

  // Mock the Match.findOne to simulate no existing match found
  Match.findOne.mockResolvedValue(null);

  const validUserId = new mongoose.Types.ObjectId().toString();
  const validEventId = new mongoose.Types.ObjectId().toString();

  // Mock Event.findById to return a valid event object with necessary fields
  const mockEvent = {
    _id: validEventId,
    eventName: 'Test Event',
    eventDescription: 'Description of Test Event', // Include additional fields if needed
    eventDate: new Date(),
    location: 'Test Location', // Include all fields that are referenced in the route handler
  };

  Event.findById.mockResolvedValue(mockEvent);

  // Mock User.findById to return a valid user object
  const mockUser = {
    _id: validUserId,
    name: 'Test User',
  };

  User.findById.mockResolvedValue(mockUser);

  // Mock the constructor of Match to return an instance with a save method
  Match.mockImplementation(function (data) {
    return {
      ...data,
      save: jest.fn().mockResolvedValue({
        ...data,
        _id: new mongoose.Types.ObjectId().toString(), // Add an ID field
        matchedOn: new Date().toISOString(),
      }),
    };
  });

  // Mock Notifs model and save method
  Notifs.mockImplementation(function (data) {
    return {
      ...data,
      save: jest.fn().mockResolvedValue({
        ...data,
        _id: new mongoose.Types.ObjectId().toString(), // Add an ID field
      }),
    };
  });

  const response = await request(app)
    .post('/matching/assign')
    .send({ userId: validUserId, eventId: validEventId });

  console.log('Response:', response.body);

  if (response.status !== 201) {
    console.error('Failed to assign volunteer:', response.body);
  }

  // Check if the response status is correct
  expect(response.status).toBe(201);
  // Check if the response body contains the correct properties
  expect(response.body).toHaveProperty('userId', validUserId);
  expect(response.body).toHaveProperty('eventId', validEventId);
}, 15000);



  it('should not assign the same volunteer twice to the same event', async () => {
    const validUserId = new mongoose.Types.ObjectId().toString();
    const validEventId = new mongoose.Types.ObjectId().toString();

    const mockMatch = { userId: validUserId, eventId: validEventId };
    Match.findOne.mockResolvedValue(mockMatch); // Mock existing match

    const response = await request(app)
      .post('/matching/assign')
      .send({ userId: validUserId, eventId: validEventId });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('User is already assigned to this event.');
  });

  it('should fetch all matches with populated event and user data', async () => {
    console.log('Mocking Match.find and populate');

    const validUserId = new mongoose.Types.ObjectId().toString();
    const validEventId = new mongoose.Types.ObjectId().toString();

    Match.find.mockImplementation(() => ({
      populate: jest.fn().mockImplementation(() => ({
        populate: jest.fn().mockResolvedValue([
          {
            userId: { _id: validUserId, name: 'Test User' },
            eventId: {
              _id: validEventId,
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
        userId: { _id: validUserId, name: 'Test User' },
        eventId: {
          _id: validEventId,
          eventName: 'Test Event',
          eventDate: expect.any(String),
        },
      },
    ]);
  });

  it('should match all volunteers based on skills and availability', async () => {
    const validVolunteerId = new mongoose.Types.ObjectId().toString();

    Profile.find.mockImplementation(() => ({
      populate: jest.fn().mockResolvedValue([
        {
          user: { _id: validVolunteerId, name: 'Test Volunteer' },
          skills: ['Food Preparation & Serving'],
        },
      ]),
    }));

    const response = await request(app).post('/matching/match');

    console.log('Response:', response.body);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        user: { _id: expect.any(String), name: 'Test Volunteer' },
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
    expect(response.body).toEqual({ message: 'Error matching volunteers' }); // Adjusted to match the actual response message
  });
});
