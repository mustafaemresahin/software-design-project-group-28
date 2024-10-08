require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const app = express();

app.use(express.json());
app.use(cors());

const connectionString = process.env.CONNECTION_STRING;
mongoose.connect(connectionString)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Error connecting to MongoDB:", err));

app.get('/', async (req, res) => {
    console.log("request");
    res.json('Hello from Express');
});

// Signup route
app.post('/signup', async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;

    // Basic validation
    if (!name || !email || !password || !confirmPassword) {
        return res.status(400).json({ message: 'Please fill all fields' });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
        });
        
        await newUser.save();

        // Create a token
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({
            message: 'User registered successfully',
            token,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Compare the provided password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create a JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Respond with the token and the user's name (user.name from the object)
        res.json({ 
            token, 
            userName: user.name,  // Send the 'name' field from the user object
            message: 'Login successful' 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

//Profile route
app.post('/profile', async (req, res) => {
    const {fullName, address1, address2, city, state, zip, skills, preferences, availability} = req.body;
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));