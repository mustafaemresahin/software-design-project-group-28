// eventRoutes.test.js
const request = require('supertest');
const express = require('express');
const eventRoutes = require('../routes/eventRoutes');
const Event = require('../models/Event');

// Mock the Event model to prevent actual database interaction
jest.mock('../models/Event', () => {
  return {
    find: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };
});

const app = express();
app.use(express.json());
app.use('/events', eventRoutes);

describe('Event Routes', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Reset mocks after each test
  });

  // Test POST /events/create
  describe('POST /events/create', () => {
    it('should create a new event', async () => {
      const mockEvent = { _id: '1', eventName: 'Test Event', location: 'Test Location' };
      Event.prototype.save.mockResolvedValue(mockEvent);

      const response = await request(app)
        .post('/events/create')
        .send(mockEvent);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Event created successfully');
      expect(response.body.data).toMatchObject(mockEvent);
    });

    it('should return 400 if event creation fails', async () => {
      Event.prototype.save.mockRejectedValue(new Error('Creation error'));

      const response = await request(app)
        .post('/events/create')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  // Test GET /events/all
  describe('GET /events/all', () => {
    it('should retrieve all events', async () => {
      const mockEvents = [
        { _id: '1', eventName: 'Event 1', location: 'Location 1' },
        { _id: '2', eventName: 'Event 2', location: 'Location 2' }
      ];
      Event.find.mockResolvedValue(mockEvents);

      const response = await request(app).get('/events/all');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockEvents);
    });

    it('should return 500 if error occurs during retrieval', async () => {
      Event.find.mockRejectedValue(new Error('Retrieval error'));

      const response = await request(app).get('/events/all');

      expect(response.status).toBe(500);
    });
  });

  // Test GET /events/:id
  describe('GET /events/:id', () => {
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

    it('should return 500 if error occurs during retrieval by ID', async () => {
      Event.findById.mockRejectedValue(new Error('Error fetching event'));

      const response = await request(app).get('/events/1');

      expect(response.status).toBe(500);
    });
  });

  // Test PUT /events/update/:id
  describe('PUT /events/update/:id', () => {
    it('should update an event by ID', async () => {
      const updatedEvent = { _id: '1', eventName: 'Updated Event', location: 'New Location' };
      Event.findByIdAndUpdate.mockResolvedValue(updatedEvent);

      const response = await request(app)
        .put('/events/update/1')
        .send(updatedEvent);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Event updated successfully');
      expect(response.body.event).toEqual(updatedEvent);
    });

    it('should return 404 if event to update is not found', async () => {
      Event.findByIdAndUpdate.mockResolvedValue(null);

      const response = await request(app)
        .put('/events/update/1')
        .send({ eventName: 'Nonexistent Event' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Event not found');
    });

    it('should return 500 if error occurs during event update', async () => {
      Event.findByIdAndUpdate.mockRejectedValue(new Error('Error updating event'));

      const response = await request(app).put('/events/update/1').send({});

      expect(response.status).toBe(500);
    });
  });

  // Test DELETE /events/delete/:id
  describe('DELETE /events/delete/:id', () => {
    it('should delete an event by ID', async () => {
      Event.findByIdAndDelete.mockResolvedValue({ _id: '1', eventName: 'Event to Delete' });

      const response = await request(app).delete('/events/delete/1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Event deleted successfully');
    });

    it('should return 404 if event to delete is not found', async () => {
      Event.findByIdAndDelete.mockResolvedValue(null);

      const response = await request(app).delete('/events/delete/1');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Event not found');
    });

    it('should return 500 if error occurs during event deletion', async () => {
      Event.findByIdAndDelete.mockRejectedValue(new Error('Error deleting event'));

      const response = await request(app).delete('/events/delete/1');

      expect(response.status).toBe(500);
    });
  });
});
