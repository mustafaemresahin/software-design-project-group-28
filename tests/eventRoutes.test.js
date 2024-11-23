const request = require('supertest');
const express = require('express');
const eventRoutes = require('../routes/eventRoutes');
const Event = require('../models/Event');
const Match = require('../models/Match');

// Mock the Event and Match models
jest.mock('../models/Event', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  save: jest.fn(),
}));
jest.mock('../models/Match', () => ({
  find: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/events', eventRoutes);

describe('Event Routes', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test
  });

  // Test POST /create
  describe('POST /create', () => {
    it('should create a new event', async () => {
      const mockEvent = { eventName: 'Test Event', location: 'Test Location' };
      Event.prototype.save = jest.fn().mockResolvedValue(mockEvent);

      const response = await request(app)
        .post('/events/create')
        .send(mockEvent);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Event created successfully');
      expect(response.body.data).toMatchObject(mockEvent);
    });

    it('should return 400 if event creation fails', async () => {
      Event.prototype.save = jest.fn().mockRejectedValue(new Error('Creation error'));

      const response = await request(app)
        .post('/events/create')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });
  });

  // Test GET /all
  describe('GET /all', () => {
    it('should retrieve all events', async () => {
      const mockEvents = [
        { eventName: 'Event 1', location: 'Location 1' },
        { eventName: 'Event 2', location: 'Location 2' },
      ];
      Event.find.mockResolvedValue(mockEvents);

      const response = await request(app).get('/events/all');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockEvents);
    });

    it('should return 500 if fetching events fails', async () => {
      Event.find.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/events/all');

      expect(response.status).toBe(500);
      expect(response.body.message).toBeDefined();
    });
  });

  // Test GET /all-with-volunteer-count
  describe('GET /all-with-volunteer-count', () => {
    it('should retrieve events with volunteer counts', async () => {
      const mockEvents = [
        { _id: '1', eventName: 'Event 1', location: 'Location 1' },
        { _id: '2', eventName: 'Event 2', location: 'Location 2' },
      ];
      const mockMatches = [
        { userId: { name: 'Volunteer 1', email: 'v1@test.com' } },
        { userId: { name: 'Volunteer 2', email: 'v2@test.com' } },
      ];
      Event.find.mockResolvedValue(mockEvents);
      Match.find.mockResolvedValue(mockMatches);

      const response = await request(app).get('/events/all-with-volunteer-count');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            eventName: 'Event 1',
            volunteerCount: mockMatches.length,
          }),
        ])
      );
    });

    it('should return 500 if fetching events fails', async () => {
      Event.find.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/events/all-with-volunteer-count');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Error fetching events');
    });
  });

  // Test GET /:id
  describe('GET /:id', () => {
    it('should retrieve an event by ID', async () => {
      const mockEvent = { _id: '1', eventName: 'Event 1', location: 'Location 1' };
      Event.findById.mockResolvedValue(mockEvent);

      const response = await request(app).get('/events/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockEvent);
    });

    it('should return 404 if event is not found', async () => {
      Event.findById.mockResolvedValue(null);

      const response = await request(app).get('/events/1');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Event not found');
    });

    it('should return 500 if fetching event fails', async () => {
      Event.findById.mockRejectedValue(new Error('Error fetching event'));

      const response = await request(app).get('/events/1');

      expect(response.status).toBe(500);
      expect(response.body.message).toBeDefined();
    });
  });

  // Test PUT /update/:id
  describe('PUT /update/:id', () => {
    it('should update an event by ID', async () => {
      const updatedEvent = { _id: '1', eventName: 'Updated Event', location: 'Updated Location' };
      Event.findByIdAndUpdate.mockResolvedValue(updatedEvent);

      const response = await request(app)
        .put('/events/update/1')
        .send(updatedEvent);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Event updated successfully');
      expect(response.body.event).toEqual(updatedEvent);
    });

    it('should return 404 if event is not found for update', async () => {
      Event.findByIdAndUpdate.mockResolvedValue(null);

      const response = await request(app)
        .put('/events/update/1')
        .send({});

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Event not found');
    });

    it('should return 500 if updating event fails', async () => {
      Event.findByIdAndUpdate.mockRejectedValue(new Error('Error updating event'));

      const response = await request(app).put('/events/update/1').send({});

      expect(response.status).toBe(500);
      expect(response.body.message).toBeDefined();
    });
  });

  // Test DELETE /delete/:id
  describe('DELETE /delete/:id', () => {
    it('should delete an event by ID', async () => {
      const mockEvent = { _id: '1', eventName: 'Event to Delete' };
      Event.findById.mockResolvedValue(mockEvent);

      const response = await request(app).delete('/events/delete/1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Event and associated data deleted successfully');
    });

    it('should return 404 if event is not found for deletion', async () => {
      Event.findById.mockResolvedValue(null);

      const response = await request(app).delete('/events/delete/1');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Event not found');
    });

    it('should return 500 if deleting event fails', async () => {
      Event.findById.mockRejectedValue(new Error('Error deleting event'));

      const response = await request(app).delete('/events/delete/1');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Error deleting event and associated data');
    });
  });
});
