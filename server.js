require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const axios = require('axios');

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

//Profile route
app.post('/profile', async (req, res) => {
    const {fullName, address1, address2, city, state, zip, skills, preferences, availability} = req.body;
});

const loginRoutes = require('./routes/loginRoutes'); // Adjust the path as needed
const registrationRoutes = require('./routes/registrationRoutes'); // Import Master PO routes

app.use('/login', loginRoutes);
app.use('/signup', registrationRoutes);

const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));