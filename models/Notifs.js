const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Import Schema from mongoose

const notifsSchema = new Schema({
  title: { type: String },
  event: { type: Schema.Types.ObjectId, ref: 'Event', required: false }, // Reference to the Event Schema
  eventName: { type: String },
  eventDescription: { type: String }, // Add description
  location: { type: String },         // Add location
  eventDate: { type: Date },         // Add date
  user: { type: Schema.Types.ObjectId, ref: 'User', required: false}
});

const Notifs = mongoose.model('Notifs', notifsSchema);

module.exports = Notifs;
