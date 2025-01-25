// jobs/refreshMedicinesJob.js
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const { parseMedicineExcel } = require('../utils/excelParser');   // Excel parsing code
const { upsertMedicines } = require('../models/medicineModel');   // DB upsert
const { getLatestXlsxLink } = require('../utils/getXlsx');        // The scraper

async function refreshMedicines() {
    try {
        // 1) Get the LATEST XLSX link by scraping TİTCK
        const latestUrl = await getLatestXlsxLink();
        if (!latestUrl) {
            throw new Error('Could not find a valid XLSX link!');
        }
        console.log('Found the newest XLSX link:', latestUrl);

        // 2) Download the XLSX to a temp file
        const tempDir = path.join(__dirname, '..', 'temp');
        try {
            await fs.mkdir(tempDir, { recursive: true });
            console.log('Ensured temp directory exists:', tempDir);
        } catch (dirErr) {
            throw new Error(`Failed to create temp directory: ${dirErr.message}`);
        }

        const tempFilePath = path.join(tempDir, 'latest-medicines.xlsx');

        try {
            const response = await axios.get(latestUrl, { responseType: 'arraybuffer' });
            await fs.writeFile(tempFilePath, response.data);
            console.log('Downloaded XLSX to temp file:', tempFilePath);
        } catch (downloadErr) {
            throw new Error(`Failed to download XLSX file: ${downloadErr.message}`);
        }

        // 3) Parse the XLSX
        let medicines;
        try {
            medicines = await parseMedicineExcel(tempFilePath);
            console.log('Parsed medicines:', medicines.length);
        } catch (parseErr) {
            throw new Error(`Failed to parse XLSX file: ${parseErr.message}`);
        }

        // 4) Upsert into DB
        try {
            await upsertMedicines(medicines);
            console.log(`Refreshed ${medicines.length} medicines from the XLSX.`);
        } catch (upsertErr) {
            throw new Error(`Failed to upsert medicines: ${upsertErr.message}`);
        }

        // 5) Cleanup
        try {
            await fs.unlink(tempFilePath);
            console.log('Removed temp XLSX file:', tempFilePath);
        } catch (cleanupErr) {
            console.warn(`Failed to remove temp file: ${cleanupErr.message}`);
        }

    } catch (err) {
        console.error('Error refreshing medicines:', err);
    }
}

module.exports = { refreshMedicines };
