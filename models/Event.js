const mongoose = require('mongoose');
const Match = require('./Match');
const Notifs = require('./Notifs');

const eventSchema = new mongoose.Schema({
  eventName: { type: String, required: true },
  eventDescription: { type: String, required: true },
  location: { type: String, required: true },
  requiredSkills: [{ type: String, required: true }],
  urgency: { type: String, required: true },
  eventDate: { type: Date, required: true },
}, {
  timestamps: true
});

// Middleware to delete related data when an event is deleted
eventSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    const eventId = this._id;

    // Delete all matches associated with this event
    const deletedMatches = await Match.deleteMany({ eventId });
    console.log(`Deleted ${deletedMatches.deletedCount} matches for event ${eventId}`);

    // Delete all notifications associated with this event
    const deletedNotifs = await Notifs.deleteMany({ event: eventId });
    console.log(`Deleted ${deletedNotifs.deletedCount} notifications for event ${eventId}`);

    next();
  } catch (error) {
    console.error('Error in event delete middleware:', error);
    next(error);
  }
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
