// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// User Schema (for authentication)
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    userType: { type: String, enum: ['worker', 'client'], required: true },
    skills: [String],
    rating: { type: Number, default: 0 },
    reviews: [{
        userId: mongoose.Schema.Types.ObjectId,
        rating: Number,
        comment: String,
        date: { type: Date, default: Date.now }
    }]
});

const User = mongoose.model('User', userSchema);

// Worker Schema (your existing schema)
const workerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    skills: [String],
    availability: {
        days: [String],
        timeSlots: [String]
    },
    location: {
        type: { type: String },
        coordinates: [Number]
    },
    rating: { type: Number, default: 0 },
    reviews: [{
        clientId: mongoose.Schema.Types.ObjectId,
        rating: Number,
        comment: String,
        date: Date
    }],
    completedJobs: { type: Number, default: 0 }
});

const Worker = mongoose.model('Worker', workerSchema);

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, phone, userType } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        user = new User({
            name,
            email,
            password: hashedPassword,
            phone,
            userType
        });

        await user.save();

        // Create token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token,
            userId: user._id,
            email: user.email,
            userType: user.userType
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            userId: user._id,
            email: user.email,
            userType: user.userType
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Your existing routes
app.get('/api/workers', async (req, res) => {
    try {
        const workers = await Worker.find();
        res.json(workers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/jobs', async (req, res) => {
    const job = new Job(req.body);
    try {
        const newJob = await job.save();
        res.status(201).json(newJob);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));