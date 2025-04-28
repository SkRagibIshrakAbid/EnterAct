const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { email, password, alias, age } = req.body;
        
        if (age < 18) return res.status(400).json({ msg: 'You must be 18 or older.' });
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword, alias, age });
        await user.save();
        res.status(201).json({ msg: 'User created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'No user found' });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
        
        res.json({ alias: user.alias, id: user._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
