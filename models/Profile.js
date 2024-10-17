const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const profileSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: false }, // Reference to the User schema
    fullName: { type: String, maxlength: 50 }, // Optional
    address1: { type: String, maxlength: 100 }, // Optional
    address2: { type: String, maxlength: 100 }, // Optional
    city: { type: String, maxlength: 100 }, // Optional
    state: { type: String, enum: [
        '', 'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 
        'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 
        'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 
        'WA', 'WV', 'WI', 'WY'
    ], required: false }, // Optional enum for US states
    zip: { type: String, maxlength: 9 }, // Optional
    skills: [{ type: String, enum: [
        "Food Preparation & Serving",
        "Cleaning & Sanitation",
        "First Aid & CPR",
        "Event Planning & Coordination",
        "Counseling & Emotional Support",
        "Child Care",
        "Administrative & Clerical Work",
        "Language Translation & Interpretation",
        "Transportation & Driving",
        "Handyman Skills (Basic Repairs & Maintenance)"
    ] }],
    preferences: { type: String }, // Optional for user preferences
    availability: [{ type: Date }], // Optional array of dates for availability
}, {
    timestamps: true // Automatically creates 'createdAt' and 'updatedAt' fields
});

// Create the Profile model from the schema
const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;