const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Profile = require('../models/Profile');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// User Registration
router.post('/', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user
        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        await newUser.save();

        console.log('User created successfully:', newUser);

        // Automatically create a blank profile for the user
        const newProfile = new Profile({
            user: newUser._id, // Ensure that newUser._id is passed correctly
            fullName: '',
            address1: '',
            address2: '',
            city: '',
            state: '',
            zip: '',
            skills: [],
            preferences: '',
            availability: []
        });

        await newProfile.save();
        console.log('Profile created successfully:', newProfile);

        // Create a JWT token
        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
            expiresIn: '1h'
        });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            userName: newUser.name,
            userId: newUser._id // Send userId so it can be stored in frontend for profile updates
        });
    } catch (error) {
        console.error('Error during registration:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
