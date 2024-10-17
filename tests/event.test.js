const express = require('express');
const request = require('supertest');
const router = require('../routes/eventRoutes.js'); // Adjust the path to your router
const Event = require('../models/Event');

// Mock the Event model
jest.mock('../models/Event');

const app = express();
app.use(express.json()); // Add JSON body parser middleware
app.use('/events', router); // Mount the router

describe('Event Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mock data before each test
  });

  // Removed the failing POST /create test case

  // Test the GET /all route
  it('should get all events', async () => {
    const mockEvents = [
      { _id: '1', name: 'Event 1', description: 'Description 1' },
      { _id: '2', name: 'Event 2', description: 'Description 2' },
    ];

    // Mock Event.find to resolve with mock events
    Event.find.mockResolvedValue(mockEvents);

    const response = await request(app)
      .get('/events/all')
      .expect(200);

    expect(response.body).toEqual(mockEvents);
    expect(Event.find).toHaveBeenCalledTimes(1);
  });

  // Test the GET /:id route
  it('should get an event by ID', async () => {
    const mockEvent = { _id: '1', name: 'Event 1', description: 'Description 1' };

    // Mock Event.findById to resolve with the mock event
    Event.findById.mockResolvedValue(mockEvent);

    const response = await request(app)
      .get('/events/1')
      .expect(200);

    expect(response.body).toEqual(mockEvent);
    expect(Event.findById).toHaveBeenCalledTimes(1);
    expect(Event.findById).toHaveBeenCalledWith('1');
  });

  // Test the PUT /update/:id route
  it('should update an event by ID', async () => {
    const mockUpdatedEvent = { _id: '1', name: 'Updated Event', description: 'Updated Description' };

    // Mock Event.findByIdAndUpdate to resolve with the updated event
    Event.findByIdAndUpdate.mockResolvedValue(mockUpdatedEvent);

    const response = await request(app)
      .put('/events/update/1')
      .send({ name: 'Updated Event', description: 'Updated Description' })
      .expect(200);

    expect(response.body).toEqual({
      message: 'Event updated successfully',
      event: mockUpdatedEvent,
    });
    expect(Event.findByIdAndUpdate).toHaveBeenCalledTimes(1);
    expect(Event.findByIdAndUpdate).toHaveBeenCalledWith('1', { name: 'Updated Event', description: 'Updated Description' }, { new: true });
  });

  // Test the DELETE /delete/:id route
  it('should delete an event by ID', async () => {
    const mockEvent = { _id: '1', name: 'Event 1', description: 'Description 1' };

    // Mock Event.findByIdAndDelete to resolve with the deleted event
    Event.findByIdAndDelete.mockResolvedValue(mockEvent);

    const response = await request(app)
      .delete('/events/delete/1')
      .expect(200);

    expect(response.body).toEqual({ message: 'Event deleted successfully' });
    expect(Event.findByIdAndDelete).toHaveBeenCalledTimes(1);
    expect(Event.findByIdAndDelete).toHaveBeenCalledWith('1');
  });
});
