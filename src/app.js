require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const medicineRoutes = require('./routes/medicineRoutes');
const redis = require('redis');
const { refreshMedicines } = require("./jobs/refreshMedicinesJob");
const swaggerUi = require('swagger-ui-express');
const yaml = require('yamljs');
const path = require('path');

const app = express();

// Initialize basic express middleware
app.use(express.json());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));
app.options('*', cors());

// Add early health check that responds before MongoDB connection
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'initializing',
        timestamp: new Date(),
        checks: {
            database: 'initializing',
            redis: 'initializing'
        }
    });
});

// Debug middleware
app.use((req, res, next) => {
    console.log(`[DEBUG] Incoming Request: ${req.method} ${req.url}`);
    console.log(`[DEBUG] Headers:`, req.headers);
    next();
});

// Error handling for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Verify required environment variables
if (!process.env.MONGO_URI) {
    console.error('[ERROR] MONGO_URI environment variable is not set');
    process.exit(1);
}

// Initialize Redis if configured
let redisClient;
if (process.env.REDIS_HOST) {
    console.log(`[DEBUG] Connecting to Redis at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`);
    redisClient = redis.createClient({
        url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`,
    });
    redisClient.connect().catch(err => {
        console.error('[ERROR] Redis connection failed:', err);
        // Continue without Redis
    });
    redisClient.on('error', (err) => {
        console.error('[ERROR] Redis error:', err);
    });
}
app.locals.redisClient = redisClient;

// Load Swagger documentation
let swaggerDocument;
try {
    swaggerDocument = yaml.load(path.join(__dirname, 'swagger.yaml'));
    console.log('[DEBUG] Swagger YAML loaded successfully');
} catch (err) {
    console.error('[ERROR] Failed to load Swagger YAML:', err);
    // Continue without Swagger
}

// Start the server before MongoDB connection
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
    console.log(`[DEBUG] Server listening on port ${PORT}`);
});

// Connect to MongoDB
console.log('[DEBUG] Attempting MongoDB connection...');
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4  // Force IPv4
}).then(async () => {
    console.log('[DEBUG] Connected to MongoDB successfully');

    // Update health check endpoint after MongoDB connection
    app.get('/health', async (req, res) => {
        const health = {
            status: 'UP',
            timestamp: new Date(),
            checks: {
                database: mongoose.connection.readyState === 1 ? 'UP' : 'DOWN',
                redis: 'NOT_CONFIGURED'
            }
        };

        if (redisClient) {
            try {
                await redisClient.ping();
                health.checks.redis = 'UP';
            } catch (e) {
                health.checks.redis = 'DOWN';
                console.error('[ERROR] Redis health check failed:', e);
            }
        }

        health.status = Object.values(health.checks).some(status => status === 'DOWN') ? 'DOWN' : 'UP';
        res.status(health.status === 'UP' ? 200 : 503).json(health);
    });

    // Initialize routes after MongoDB connection
    app.use('/v1/medicine', medicineRoutes);

    if (swaggerDocument) {
        app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
        console.log('[DEBUG] Swagger UI serving at \'/\'');
    }

    // Start medicine refresh in the background
    try {
        await refreshMedicines();
        console.log('[DEBUG] Medicines refreshed successfully');
    } catch (err) {
        console.error('[ERROR] Failed to refresh medicines:', err);
        // Continue even if refresh fails
    }

}).catch(err => {
    console.error('[ERROR] MongoDB connection failed:', err);
    // Don't exit the process, let the health check endpoint report the failure
});

// Catch unhandled routes
app.use((req, res) => {
    console.warn(`[WARN] Unhandled Route: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Not Found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('[ERROR] Unhandled error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;