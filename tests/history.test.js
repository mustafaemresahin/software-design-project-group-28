const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const Match = require('../models/Match');
const historyRoutes = require('../routes/historyRoutes');

// Create an Express app for testing
const app = express();
app.use(express.json());
app.use('/api/history', historyRoutes);

// Mocking JWT verification
jest.mock('jsonwebtoken');
// Mocking Match model methods
jest.mock('../models/Match');

describe('GET /api/history', () => {
  // Test for a successful response with populated data
  it('should return a list of volunteer history for a logged-in user', async () => {
    // Mock the decoded user ID from the token
    const mockUserId = 'mockUserId123';
    jwt.verify.mockImplementation(() => ({ id: mockUserId }));

    // Mock the Match.find() method to return some sample data
    const mockMatches = [
      {
        eventId: {
          eventName: 'Community Cleanup',
          eventDescription: 'Cleaning the local park',
          location: 'Central Park',
          requiredSkills: ['Cleaning', 'Teamwork'],
          urgency: 'High',
          eventDate: '2024-10-20T12:00:00Z'
        },
        matchedOn: '2024-10-10T12:00:00Z'
      }
    ];
    Match.find.mockResolvedValue(mockMatches);

    // Perform the request
    const response = await request(app)
      .get('/api/history')
      .set('Authorization', 'Bearer mockToken123');

    // Assertions
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([
      {
        eventName: 'Community Cleanup',
        eventDescription: 'Cleaning the local park',
        location: 'Central Park',
        requiredSkills: ['Cleaning', 'Teamwork'],
        urgency: 'High',
        eventDate: '2024-10-20T12:00:00Z',
        participationStatus: 'Matched',
        matchedOn: '2024-10-10T12:00:00Z'
      }
    ]);
  });

  // Test for an empty volunteer history response
  it('should return an empty array if no matches are found', async () => {
    // Mock the decoded user ID from the token
    const mockUserId = 'mockUserId123';
    jwt.verify.mockImplementation(() => ({ id: mockUserId }));

    // Mock Match.find() to return an empty array
    Match.find.mockResolvedValue([]);

    // Perform the request
    const response = await request(app)
      .get('/api/history')
      .set('Authorization', 'Bearer mockToken123');

    // Assertions
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });

  // Test for unauthorized response
  it('should return 401 if the token is missing or invalid', async () => {
    // Mock the JWT verification to throw an error
    jwt.verify.mockImplementation(() => {
      throw new Error('Unauthorized');
    });

    // Perform the request without an Authorization header
    const response = await request(app).get('/api/history');

    // Assertions
    expect(response.statusCode).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized, token invalid' });
  });

  // Test for server error
  it('should return 500 if there is a server error', async () => {
    // Mock the decoded user ID from the token
    const mockUserId = 'mockUserId123';
    jwt.verify.mockImplementation(() => ({ id: mockUserId }));

    // Mock Match.find() to throw an error
    Match.find.mockImplementation(() => {
      throw new Error('Database error');
    });

    // Perform the request
    const response = await request(app)
      .get('/api/history')
      .set('Authorization', 'Bearer mockToken123');

    // Assertions
    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({ message: 'Server error' });
  });
});
