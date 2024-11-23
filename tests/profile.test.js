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
    jest.clearAllMocks(); // Clear mocks to avoid interference between tests
  });

  describe('POST / (Create/Update Profile)', () => {
    it('should create a new profile if one does not exist', async () => {
      const mockUser = { _id: 'user123', name: 'John Doe' };
      const mockProfile = {
        user: mockUser._id,
        fullName: 'John Doe',
        address1: '123 Main St',
        city: 'Houston',
        state: 'TX',
        zip: '77001',
        skills: ['JavaScript'],
        preferences: 'Remote work',
        availability: [new Date('2024-10-20').toISOString()],
        save: jest.fn().mockResolvedValue(true),
      };

      User.findById.mockResolvedValue(mockUser);
      Profile.findOne.mockResolvedValue(null);
      Profile.mockImplementation(() => mockProfile);

      const response = await request(app)
        .post('/profile')
        .send({
          userId: 'user123',
          fullName: 'John Doe',
          address1: '123 Main St',
          city: 'Houston',
          state: 'TX',
          zip: '77001',
          skills: ['JavaScript'],
          preferences: 'Remote work',
          availability: ['2024-10-20'],
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Profile created successfully');
      expect(response.body.profile).toEqual(mockProfile);
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(Profile.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(mockProfile.save).toHaveBeenCalled();
    });

    it('should update an existing profile', async () => {
      const mockUser = { _id: 'user123', name: 'John Doe' };
      const existingProfile = {
        user: mockUser._id,
        fullName: 'John Updated',
        address1: '123 Updated St',
        city: 'Austin',
        state: 'TX',
        zip: '77002',
        skills: ['Node.js'],
        preferences: 'Office work',
        availability: [new Date('2024-10-22').toISOString()],
        save: jest.fn().mockResolvedValue(true),
      };

      User.findById.mockResolvedValue(mockUser);
      Profile.findOne.mockResolvedValue(existingProfile);

      const response = await request(app)
        .post('/profile')
        .send({
          userId: 'user123',
          fullName: 'John Updated',
          address1: '123 Updated St',
          city: 'Austin',
          state: 'TX',
          zip: '77002',
          skills: ['Node.js'],
          preferences: 'Office work',
          availability: ['2024-10-22'],
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(Profile.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(existingProfile.save).toHaveBeenCalled();
    });

    it('should return 404 if user does not exist', async () => {
      User.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/profile')
        .send({ userId: 'invalid-user-id' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/profile')
        .send({ userId: 'user123' }); // Missing required fields

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid data provided');
    });

    it('should handle server errors gracefully', async () => {
      User.findById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/profile')
        .send({
          userId: 'user123',
          fullName: 'John Doe',
          address1: '123 Main St',
          city: 'Houston',
          state: 'TX',
          zip: '77001',
          skills: ['JavaScript'],
          preferences: 'Remote work',
          availability: ['2024-10-20'],
        });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server error');
    });
  });

  describe('GET /:userId', () => {
    it('should retrieve a profile by user ID', async () => {
      const mockProfile = {
        user: 'user123',
        fullName: 'John Doe',
        address1: '123 Main St',
        city: 'Houston',
        state: 'TX',
        zip: '77001',
        skills: ['JavaScript'],
        preferences: 'Remote work',
        availability: [new Date('2024-10-20').toISOString()],
      };

      Profile.findOne.mockResolvedValue(mockProfile);

      const response = await request(app).get('/profile/user123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProfile);
      expect(Profile.findOne).toHaveBeenCalledWith({ user: 'user123' });
    });

    it('should return 404 if profile is not found', async () => {
      Profile.findOne.mockResolvedValue(null);

      const response = await request(app).get('/profile/nonexistent-user');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Profile not found');
    });

    it('should handle server errors gracefully', async () => {
      Profile.findOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/profile/user123');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server error');
    });
  });

  describe('GET /:userId/role', () => {
    it('should return a user role along with the profile', async () => {
      const mockUser = { _id: 'user123', role: 'admin' };
      const mockProfile = {
        user: mockUser._id,
        fullName: 'John Doe',
        address1: '123 Main St',
        city: 'Houston',
        state: 'TX',
        zip: '77001',
        skills: ['JavaScript'],
        preferences: 'Remote work',
        availability: [new Date('2024-10-20').toISOString()],
      };

      User.findById.mockResolvedValue(mockUser);
      Profile.findOne.mockResolvedValue(mockProfile);

      const response = await request(app).get('/profile/user123/role');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        profile: mockProfile,
        role: 'admin',
      });
      expect(User.findById).toHaveBeenCalledWith('user123');
    });

    it('should return 404 if user or profile is not found', async () => {
      User.findById.mockResolvedValue(null);

      const response = await request(app).get('/profile/nonexistent-user/role');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    it('should handle server errors gracefully', async () => {
      User.findById.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/profile/user123/role');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server error');
    });
  });
});
