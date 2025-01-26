require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const medicineRoutes = require('./routes/medicineRoutes');
const { refreshMedicines } = require("./jobs/refreshMedicinesJob");
const swaggerUi = require('swagger-ui-express');
const yaml = require('yamljs');
const path = require('path');

const app = express();
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});


// Debug: Log incoming requests
app.use((req, res, next) => {
    console.log(`[DEBUG] Incoming Request: ${req.method} ${req.url}`);
    console.log(`[DEBUG] Headers:`, req.headers);
    next();
});

// CORS middleware
app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));
app.options('*', cors());

app.use(express.json());

console.log(`[DEBUG] Mongo URI: ${process.env.MONGO_URI}`);

// 1) Load Swagger YAML
const swaggerDocument = yaml.load(path.join(__dirname, 'swagger.yaml'));
console.log(`[DEBUG] Swagger YAML Loaded`);

// 2) Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
}).then(async () => {
    console.log('[DEBUG] Connected to Mongo!');
    try {
        await refreshMedicines();
    } catch (err) {
        console.error('[ERROR] Failed to refresh medicines:', err);
    }
}).catch((err) => {
    console.error('[ERROR] MongoDB connection failed:', err);
});

const redis = require('redis');

let redisClient;
if (process.env.REDIS_URL) {
    console.log(`[DEBUG] Connecting to Redis at ${process.env.REDIS_URL}`);
    redisClient = redis.createClient({
        url: process.env.REDIS_URL,
    });
    redisClient.connect().catch(console.error);

    redisClient.on('error', (err) => {
        console.error('[ERROR] Redis connection error:', err);
    });
}
app.locals.redisClient = redisClient;

// 4) Routes
app.use('/v1', medicineRoutes);

// Debug: Log when a route is called
app.use('/v1', (req, res, next) => {
    console.log(`[DEBUG] /v1/medicine route hit: ${req.method} ${req.url}`);
    next();
});

// 5) Swagger UI
// Health-check endpoint
app.get('/health', async (req, res) => {
    const health = {
        status: 'UP',
        timestamp: new Date(),
        checks: {
            database: 'UNKNOWN',
            redis: 'UNKNOWN'
        }
    };

    try {
        // Check MongoDB connection
        if (mongoose.connection.readyState === 1) {
            health.checks.database = 'UP';
        } else {
            health.checks.database = 'DOWN';
            health.status = 'DOWN';
        }

        // Check Redis if configured
        if (app.locals.redisClient) {
            try {
                await app.locals.redisClient.ping();
                health.checks.redis = 'UP';
            } catch (e) {
                health.checks.redis = 'DOWN';
                health.status = 'DOWN';
            }
        }

        res.status(health.status === 'UP' ? 200 : 503).json(health);
    } catch (e) {
        health.status = 'DOWN';
        res.status(503).json(health);
    }
});

console.log(`[DEBUG] Swagger UI serving at '/'`);
app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));



// Debug: Catch unhandled routes
app.use((req, res, next) => {
    console.warn(`[WARN] Unhandled Route: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Not Found' });
});

// 6) Start server

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`[DEBUG] Medicine Service (NoSQL) listening on port ${PORT}`);
});

module.exports = app;

