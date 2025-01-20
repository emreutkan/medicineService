// /app.js

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
mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('[DEBUG] Connected to Mongo!');

    // 3) Run the refresh
    await refreshMedicines();

}).catch((err) => {
    console.error('[ERROR] MongoDB connection failed:', err);
});

// 3) Redis setup
let redisClient;
if (process.env.REDIS_HOST) {
    console.log(`[DEBUG] Connecting to Redis at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`);
    redisClient = redis.createClient({
        url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`,
    });
    redisClient.connect().catch(console.error);
    redisClient.on('error', (err) => {
        console.error('[ERROR] Redis connection error:', err);
    });
}
app.locals.redisClient = redisClient; // Attach to app.locals

// 4) Routes
app.use('/v1/medicine', medicineRoutes);

// Debug: Log when a route is called
app.use('/v1/medicine', (req, res, next) => {
    console.log(`[DEBUG] /v1/medicine route hit: ${req.method} ${req.url}`);
    next();
});

// 5) Swagger UI
app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
console.log(`[DEBUG] Swagger UI serving at '/'`);

// Health-check endpoint
app.get('/health', (req, res) => {
    console.log(`[DEBUG] Health check endpoint called`);
    res.json({ status: 'Medicine Service running (NoSQL)' });
});



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

