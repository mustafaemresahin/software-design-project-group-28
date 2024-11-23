const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const User = require('../models/User');

// Create or Update Profile
router.post('/', async (req, res) => {
  const { userId, fullName, address1, address2, city, state, zip, skills, preferences, availability } = req.body;

  console.log('Received profile update request:', req.body); // Log the incoming request data

  try {
    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found with ID:', userId); // Log if the user isn't found
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('User found:', user); // Log the found user

    // Convert availability strings back to Date objects if provided
    const availabilityDates = availability.map(dateString => new Date(dateString));
    console.log('Converted availability dates:', availabilityDates); // Log converted dates

    // Check if profile exists, otherwise create a new one
    let profile = await Profile.findOne({ user: userId });
    if (profile) {
      console.log('Profile found, updating profile for user:', userId); // Log if profile is found

      // Update existing profile
      profile.fullName = fullName;
      profile.address1 = address1;
      profile.address2 = address2 || '';
      profile.city = city;
      profile.state = state;
      profile.zip = zip;
      profile.skills = skills;
      profile.preferences = preferences || '';
      profile.availability = availabilityDates;

      // Save the updated profile
      const updatedProfile = await profile.save();
      console.log('Profile updated successfully:', updatedProfile); // Log successful update
      return res.status(200).json({ message: 'Profile updated successfully', profile: updatedProfile });
    } else {
      console.log('Profile not found, creating new profile for user:', userId); // Log if creating a new profile

      // Create a new profile
      const newProfile = new Profile({
        user: userId,
        fullName,
        address1,
        address2,
        city,
        state,
        zip,
        skills,
        preferences,
        availability: availabilityDates
      });

      const savedProfile = await newProfile.save();
      console.log('Profile created successfully:', savedProfile); // Log successful profile creation
      return res.status(201).json({ message: 'Profile created successfully', profile: savedProfile });
    }
  } catch (error) {
    console.error('Error creating/updating profile:', error); // Log any errors encountered
    return res.status(500).json({ message: 'Server error' });
  }
});


// Get Profile by user ID
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  if (!userId || userId === 'undefined') {
    return res.status(400).json({ message: 'Invalid or missing user ID' });
  }

  try {
    const profile = await Profile.findOne({ user: userId });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    return res.status(200).json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:userId/role', async (req, res) => {
  const { userId } = req.params;

  if (!userId || userId === 'undefined') {
    return res.status(400).json({ message: 'Invalid or missing user ID' });
  }

  try {
    const profile = await Profile.findOne({ user: userId });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const user = await User.findById(userId);
    const role = user.role;

    //return res.status(200).json(profile, role);
    // Return both the profile and the user's role
    return res.status(200).json({
      profile, // Profile data
      role: role, // User role fetched via populate
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
