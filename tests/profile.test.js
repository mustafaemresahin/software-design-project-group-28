const request = require('supertest');
const express = require('express');
const router = require('../routes/profileRoutes'); // Adjust the path to your router
const User = require('../models/User');
const Profile = require('../models/Profile');

// Mock the User and Profile models
jest.mock('../models/User');
jest.mock('../models/Profile');

const app = express();
app.use(express.json());
app.use('/profile', router);

describe('Profile Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear all mocks before each test
  });

  // Test the POST / route for creating/updating a profile
  describe('POST /', () => {
    it('should create a new profile if one does not exist', async () => {
      const mockUser = { _id: 'user123', name: 'John Doe' };
      const mockProfile = {
        user: mockUser._id,
        fullName: 'John Doe',
        address1: '123 Street',
        city: 'CityName',
        state: 'StateName',
        zip: '12345',
        skills: ['JavaScript'],
        preferences: 'Morning shifts',
        availability: [new Date('2024-10-20').toISOString()], // Normalize date
      };

      // Mock User.findById to return the user
      User.findById.mockResolvedValue(mockUser);

      // Mock Profile.findOne to return null (no profile exists)
      Profile.findOne.mockResolvedValue(null);

      // Mock Profile.save to save a new profile
      Profile.prototype.save.mockResolvedValue(mockProfile);

      const response = await request(app)
        .post('/profile')
        .send({
          userId: 'user123',
          fullName: 'John Doe',
          address1: '123 Street',
          city: 'CityName',
          state: 'StateName',
          zip: '12345',
          skills: ['JavaScript'],
          preferences: 'Morning shifts',
          availability: ['2024-10-20'], // String format date
        })
        .expect(201);

      expect(response.body).toEqual({
        message: 'Profile created successfully',
        profile: mockProfile,
      });

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(Profile.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(Profile.prototype.save).toHaveBeenCalledTimes(1);
    });

    // Other test cases remain the same
  });
});
