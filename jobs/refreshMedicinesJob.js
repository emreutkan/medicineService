const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const { parseMedicineExcel } = require('../utils/excelParser');   // Excel parsing code
const { upsertMedicines } = require('../models/medicineModel');   // DB upsert
const { getLatestXlsxLink } = require('../utils/getXlsx');        // The scraper

async function refreshMedicines(req, res) {
    try {
        // 1) Get the LATEST XLSX link by scraping TİTCK
        const latestUrl = await getLatestXlsxLink();
        if (!latestUrl) {
            return res.status(404).json({ success: false, message: 'Could not find a valid XLSX link!' });
        }
        console.log('Found the newest XLSX link:', latestUrl);

        // 2) Download the XLSX to a temp file
        const tempDir = path.join(__dirname, '..', 'temp');
        await fs.mkdir(tempDir, { recursive: true });
        console.log('Ensured temp directory exists:', tempDir);

        const tempFilePath = path.join(tempDir, 'latest-medicines.xlsx');
        const response = await axios.get(latestUrl, { responseType: 'arraybuffer' });
        await fs.writeFile(tempFilePath, response.data);
        console.log('Downloaded XLSX to temp file:', tempFilePath);

        // 3) Parse the XLSX
        const medicines = await parseMedicineExcel(tempFilePath);
        console.log('Parsed medicines:', medicines.length);

        // 4) Upsert into DB
        await upsertMedicines(medicines);
        console.log(`Refreshed ${medicines.length} medicines from the XLSX.`);

        // 5) Cleanup
        await fs.unlink(tempFilePath);
        console.log('Removed temp XLSX file:', tempFilePath);

        // Success response
        return res.status(200).json({ success: true, message: 'Medicines refreshed successfully!' });

    } catch (err) {
        console.error('Error refreshing medicines:', err.message);

        // Failure response
        return res.status(500).json({ success: false, message: 'Failed to refresh medicines!', error: err.message });
    }
}

module.exports = { refreshMedicines };
