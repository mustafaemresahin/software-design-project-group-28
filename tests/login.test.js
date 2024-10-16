const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = express();
app.use(express.json());
const loginRouter = require('../routes/loginRoutes'); // Adjust the path accordingly
app.use('/api/login', loginRouter);

// Mock User model
jest.mock('../models/User'); // Ensure this path is correct
const User = require('../models/User');

describe('POST /api/login', () => {
    beforeAll(async () => {
        // Set up your database connection if necessary
        // e.g., await mongoose.connect(process.env.TEST_DB_URI);
    });

    afterAll(async () => {
        // Clean up and close the database connection
        // e.g., await mongoose.disconnect();
    });

    it('should return 400 if user does not exist', async () => {
        User.findOne.mockResolvedValue(null); // Simulate user not found

        const response = await request(app)
            .post('/api/login')
            .send({ email: 'test@example.com', password: 'password123' });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: 'Invalid credentials' });
    });

    it('should return 400 if password is incorrect', async () => {
        const mockUser = { email: 'test@example.com', password: 'wrongPassword' };
        User.findOne.mockResolvedValue(mockUser); // Simulate user found

        const response = await request(app)
            .post('/api/login')
            .send({ email: 'test@example.com', password: 'password123' });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: 'Invalid credentials' });
    });

    it('should return a token and userName if login is successful', async () => {
        const mockUser = { _id: '12345', email: 'test@example.com', password: 'password123', name: 'Test User' };
        User.findOne.mockResolvedValue(mockUser); // Simulate user found

        const response = await request(app)
            .post('/api/login')
            .send({ email: 'test@example.com', password: 'password123' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('userName', 'Test User');
        expect(response.body.message).toBe('Login successful');
    });

    it('should return 500 if there is a server error', async () => {
        User.findOne.mockRejectedValue(new Error('Database error')); // Simulate a server error

        const response = await request(app)
            .post('/api/login')
            .send({ email: 'test@example.com', password: 'password123' });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: 'Server error' });
    });
});
