const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'iplAuction';
const COLLECTION_NAME = process.env.COLLECTION_NAME || 'registrations';

let db;
let registrationsCollection;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Configure multer for file uploads (store in memory)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only .png, .jpg, .jpeg, and .pdf files are allowed!'));
    }
});

// Connect to MongoDB
async function connectDB() {
    try {
        const client = await MongoClient.connect(MONGODB_URI);
        db = client.db(DB_NAME);
        registrationsCollection = db.collection(COLLECTION_NAME);
        console.log('Connected to MongoDB successfully!');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

// API Routes

// Get all registrations
app.get('/api/registrations', async (req, res) => {
    try {
        const registrations = await registrationsCollection.find({}).toArray();
        res.json(registrations);
    } catch (error) {
        console.error('Error fetching registrations:', error);
        res.status(500).json({ error: 'Failed to fetch registrations' });
    }
});

// Create new registration
app.post('/api/registrations', upload.single('paymentScreenshot'), async (req, res) => {
    try {
        const formData = JSON.parse(req.body.formData);
        
        // Get the next registration ID
        const count = await registrationsCollection.countDocuments();
        const registrationId = `IPL-TEAM-${String(count + 1).padStart(3, '0')}`;
        
        const registration = {
            id: registrationId,
            teamName: formData.teamName,
            teamLead: formData.teamLead,
            additionalMembers: formData.additionalMembers || [],
            paymentScreenshot: {
                filename: req.file.originalname,
                data: req.file.buffer.toString('base64'),
                contentType: req.file.mimetype
            },
            registrationDate: new Date().toISOString()
        };

        const result = await registrationsCollection.insertOne(registration);
        
        // Send data to webhook
        const webhookData = {
            id: registrationId,
            teamName: formData.teamName,
            teamLead: formData.teamLead,
            additionalMembers: formData.additionalMembers || [],
            totalMembers: 1 + (formData.additionalMembers?.length || 0),
            registrationDate: registration.registrationDate,
            paymentProof: {
                filename: req.file.originalname,
                contentType: req.file.mimetype
            }
        };
        
        // Post to webhook (non-blocking)
        fetch('https://mako-amused-clearly.ngrok-free.app/webhook-test/reg', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(webhookData)
        }).catch(err => {
            console.error('Webhook error:', err);
            // Don't fail the registration if webhook fails
        });
        
        res.json({ success: true, id: registrationId, insertedId: result.insertedId });
    } catch (error) {
        console.error('Error creating registration:', error);
        res.status(500).json({ error: 'Failed to create registration' });
    }
});

// Get payment screenshot by registration ID
app.get('/api/registrations/:id/screenshot', async (req, res) => {
    try {
        const registration = await registrationsCollection.findOne({ id: req.params.id });
        
        if (!registration || !registration.paymentScreenshot) {
            return res.status(404).json({ error: 'Screenshot not found' });
        }

        const buffer = Buffer.from(registration.paymentScreenshot.data, 'base64');
        res.set('Content-Type', registration.paymentScreenshot.contentType);
        res.send(buffer);
    } catch (error) {
        console.error('Error fetching screenshot:', error);
        res.status(500).json({ error: 'Failed to fetch screenshot' });
    }
});

// Delete registration (optional - for admin)
app.delete('/api/registrations/:id', async (req, res) => {
    try {
        const result = await registrationsCollection.deleteOne({ id: req.params.id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Registration not found' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting registration:', error);
        res.status(500).json({ error: 'Failed to delete registration' });
    }
});

// Start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});
