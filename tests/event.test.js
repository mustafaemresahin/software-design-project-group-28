const mongoose = require('mongoose');
const Event = require('../models/Event');
const Match = require('../models/Match');
const Notifs = require('../models/Notifs');

// Mock dependent models to avoid database operations
jest.mock('../models/Match', () => ({
  deleteMany: jest.fn(),
}));

jest.mock('../models/Notifs', () => ({
  deleteMany: jest.fn(),
}));

describe('Event Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('deleteOne Middleware', () => {
    it('should delete associated matches and notifications when an event is deleted', async () => {
      const mockEvent = new Event({
        eventName: 'Test Event',
        eventDescription: 'Test Description',
        location: 'Test Location',
        requiredSkills: ['Skill1', 'Skill2'],
        urgency: 'High',
        eventDate: new Date(),
      });

      Match.deleteMany.mockResolvedValue({ deletedCount: 5 });
      Notifs.deleteMany.mockResolvedValue({ deletedCount: 3 });

      // Simulate calling the deleteOne middleware
      await mockEvent.deleteOne();

      expect(Match.deleteMany).toHaveBeenCalledWith({ eventId: mockEvent._id });
      expect(Notifs.deleteMany).toHaveBeenCalledWith({ event: mockEvent._id });
    });

    it('should handle errors during related data deletion', async () => {
      const mockEvent = new Event({
        eventName: 'Test Event',
        eventDescription: 'Test Description',
        location: 'Test Location',
        requiredSkills: ['Skill1', 'Skill2'],
        urgency: 'High',
        eventDate: new Date(),
      });

      Match.deleteMany.mockRejectedValue(new Error('Match deletion error'));
      Notifs.deleteMany.mockResolvedValue({ deletedCount: 3 });

      const next = jest.fn(); // Mock next to check for error handling
      try {
        await mockEvent.deleteOne(next);
      } catch (error) {
        expect(error.message).toBe('Match deletion error');
      }

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(Notifs.deleteMany).toHaveBeenCalledWith({ event: mockEvent._id });
    });
  });

  describe('Schema Validation', () => {
    it('should throw validation error for missing required fields', async () => {
      const invalidEvent = new Event({
        eventName: '',
        location: '',
        urgency: 'InvalidValue',
      });

      try {
        await invalidEvent.validate();
      } catch (error) {
        expect(error.errors.eventName).toBeDefined();
        expect(error.errors.eventDescription).toBeDefined();
        expect(error.errors.requiredSkills).toBeDefined();
        expect(error.errors.urgency).toBeDefined();
      }
    });

    it('should save a valid event', async () => {
      const validEvent = new Event({
        eventName: 'Test Event',
        eventDescription: 'A valid description',
        location: 'Test Location',
        requiredSkills: ['Skill1', 'Skill2'],
        urgency: 'Medium',
        eventDate: new Date(),
      });

      jest.spyOn(validEvent, 'save').mockResolvedValue(validEvent);
      const result = await validEvent.save();

      expect(result.eventName).toBe('Test Event');
      expect(result.location).toBe('Test Location');
    });
  });
});
