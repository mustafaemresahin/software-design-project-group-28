const request = require('supertest');
const express = require('express');
const router = require('../routes/registrationRoutes'); // Correct path to the registrationRoutes.js file
const User = require('../models/User');
const Profile = require('../models/Profile');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock the User, Profile, bcrypt, and jwt modules
jest.mock('../models/User');
jest.mock('../models/Profile');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

// Ensure JWT_SECRET is set for testing purposes
process.env.JWT_SECRET = 'test-secret';

const app = express();
app.use(express.json());
app.use('/users', router);

// Suppress console logs during tests
beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
});

describe('User Registration Route', () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Clear all mocks before each test
    });

    it('should register a new user and create a profile', async () => {
        const mockUser = {
            _id: 'user123',
            name: 'John Doe',
            email: 'john@example.com',
            password: 'hashedPassword123',
        };

        const mockProfile = {
            _id: 'profile123',
            user: mockUser._id,
        };

        const mockToken = 'jwt-token-123';

        // Mock User.findOne to return null (user doesn't exist)
        User.findOne.mockResolvedValue(null);

        // Mock bcrypt.hash to return a hashed password
        bcrypt.hash.mockResolvedValue('hashedPassword123');

        // Mock the save method on the User model instance
        User.prototype.save = jest.fn().mockResolvedValue(mockUser);

        // Mock the save method on the Profile model instance
        Profile.prototype.save = jest.fn().mockResolvedValue(mockProfile);

        // Mock jwt.sign to return a mock token
        jwt.sign.mockReturnValue(mockToken);

        const response = await request(app)
            .post('/users')
            .send({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
            })
            .expect(201);

        // Ensure the correct response with userId and userName is returned
        expect(response.body).toEqual({
            message: 'User registered successfully',
            token: mockToken,
            userName: mockUser.name,
            userId: mockUser._id,
        });

        // Ensure the correct methods were called
        expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
        expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
        expect(User.prototype.save).toHaveBeenCalledTimes(1); // Ensure that save was called on the User model
        expect(Profile.prototype.save).toHaveBeenCalledTimes(1); // Ensure that save was called on the Profile model
        expect(jwt.sign).toHaveBeenCalledWith(
            { userId: mockUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
    });

    it('should return 400 if email is already in use', async () => {
        // Mock User.findOne to return an existing user
        User.findOne.mockResolvedValue({ email: 'john@example.com' });

        const response = await request(app)
            .post('/users')
            .send({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
            })
            .expect(400);

        expect(response.body).toEqual({ message: 'Email already in use' });
        expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
    });

    it('should return 500 if there is a server error', async () => {
        // Mock User.findOne to throw an error
        User.findOne.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
            .post('/users')
            .send({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
            })
            .expect(500);

        expect(response.body).toEqual({ message: 'Server error' });
    });
});
