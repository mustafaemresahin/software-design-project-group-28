const request = require('supertest');
const express = require('express');
const router = require('../routes/profileRoutes'); 
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

  // Test for creating a new profile
  describe('POST / (Create/Update Profile)', () => {
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
        availability: [new Date('2024-10-20').toISOString()],
        save: jest.fn().mockResolvedValue(true)  // Mocking save function
      };

      User.findById.mockResolvedValue(mockUser);
      Profile.findOne.mockResolvedValue(null);
      Profile.mockImplementation(() => mockProfile); // Return mockProfile on new Profile()

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
          availability: ['2024-10-20'],
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: 'Profile created successfully',
        profile: mockProfile,
      });
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(Profile.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(mockProfile.save).toHaveBeenCalledTimes(1);
    });

    it('should update the profile if one already exists', async () => {
      const mockUser = { _id: 'user123', name: 'John Doe' };
      const existingProfile = {
        user: mockUser._id,
        fullName: 'John Doe',
        address1: '123 Street',
        city: 'CityName',
        state: 'StateName',
        zip: '12345',
        skills: ['JavaScript'],
        preferences: 'Morning shifts',
        availability: [new Date('2024-10-20').toISOString()],
        save: jest.fn().mockResolvedValue(true)  // Mocking save function
      };

      User.findById.mockResolvedValue(mockUser);
      Profile.findOne.mockResolvedValue(existingProfile);

      const response = await request(app)
        .post('/profile')
        .send({
          userId: 'user123',
          fullName: 'John Updated',
          address1: '123 Street',
          city: 'CityName',
          state: 'StateName',
          zip: '12345',
          skills: ['JavaScript'],
          preferences: 'Morning shifts',
          availability: ['2024-10-20'],
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(Profile.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(existingProfile.save).toHaveBeenCalledTimes(1);
    });

    it('should return 404 if user does not exist', async () => {
      User.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/profile')
        .send({ userId: 'nonexistent-user' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
      expect(User.findById).toHaveBeenCalledWith('nonexistent-user');
      expect(Profile.findOne).not.toHaveBeenCalled();
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/profile')
        .send({ userId: 'user123' }); // Missing required fields

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Required fields are missing');
      expect(Profile.findOne).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      User.findById.mockRejectedValue(new Error('Database error'));

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
          availability: ['2024-10-20'],
        });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('An error occurred while processing the profile.');
    });
  });

  // Test GET /profile route
  describe('GET /:userId', () => {
    it('should retrieve a profile by user ID', async () => {
      const mockProfile = {
        user: 'user123',
        fullName: 'John Doe',
        address1: '123 Street',
        city: 'CityName',
        state: 'StateName',
        zip: '12345',
        skills: ['JavaScript'],
        preferences: 'Morning shifts',
        availability: [new Date('2024-10-20').toISOString()],
      };

      Profile.findOne.mockResolvedValue(mockProfile);

      const response = await request(app)
        .get('/profile/user123')
        .expect(200);

      expect(response.body).toEqual(mockProfile);
      expect(Profile.findOne).toHaveBeenCalledWith({ user: 'user123' });
    });

    it('should return 404 if profile is not found', async () => {
      Profile.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/profile/nonexistent-user')
        .expect(404);

      expect(response.body.message).toBe('Profile not found');
      expect(Profile.findOne).toHaveBeenCalledWith({ user: 'nonexistent-user' });
    });
  });
});
