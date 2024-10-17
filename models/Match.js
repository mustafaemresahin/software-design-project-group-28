// models/Match.js
const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  matchedOn: { type: Date, default: Date.now },
});

const Match = mongoose.model('Match', matchSchema);
module.exports = Match;