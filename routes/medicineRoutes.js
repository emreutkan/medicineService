// routes/medicineRoutes.js
const express = require('express');
const router = express.Router();
const { searchMedicine } = require('../controllers/medicineController');

// Public, no authentication required
router.get('/search', searchMedicine);

module.exports = router;
