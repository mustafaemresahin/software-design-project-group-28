const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

router.post('/', async (req, res) => {
    const {  } = req.body;
});

module.exports = router;