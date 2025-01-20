// jobs/refreshMedicinesJob.js
const fs = require('fs');
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
        const tempFilePath = path.join(__dirname, 'latest-medicines.xlsx');
        const response = await axios.get(latestUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(tempFilePath, response.data);

        // 3) Parse the XLSX
        const medicines = await parseMedicineExcel(tempFilePath);

        // 4) Upsert into DB
        await upsertMedicines(medicines);
        console.log(`Refreshed ${medicines.length} medicines from the XLSX.`);

        // 5) Cleanup
        fs.unlinkSync(tempFilePath);
        console.log('Done temp XLSX file removed.');

    } catch (err) {
        console.error('Error refreshing medicines:', err);
    }
}

module.exports = { refreshMedicines };

