require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const axios = require('axios');

const app = express();

// Middleware to parse JSON
app.use(express.json());

// Enable CORS for all routes, you can set 'origin' to your frontend's URL
app.use(cors({
    origin: 'http://localhost:3000', // Or the actual frontend domain
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Connect to MongoDB
const connectionString = process.env.CONNECTION_STRING;
mongoose.connect(connectionString)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Error connecting to MongoDB:", err));

// Test route
app.get('/', async (req, res) => {
    console.log("Received request to root");
    res.json('Hello from Express');
});

// Profile route (now handled in profileRoutes.js)
const loginRoutes = require('./routes/loginRoutes'); 
const registrationRoutes = require('./routes/registrationRoutes'); 
const profileRoutes = require('./routes/profileRoutes'); 
const eventRoutes = require('./routes/eventRoutes'); 

// Routes for login, signup, and profile
app.use('/login', loginRoutes);
app.use('/signup', registrationRoutes);
app.use('/profile', profileRoutes);
app.use('/events', eventRoutes);

// Start the server
const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
