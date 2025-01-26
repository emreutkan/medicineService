// routes/medicineRoutes.js
const express = require('express');
const router = express.Router();
const { searchMedicine } = require('../controllers/medicineController');
const {refreshMedicines} = require("../jobs/refreshMedicinesJob");
router.get('/search', searchMedicine);
router.post('/refresh', refreshMedicines);
module.exports = router;
