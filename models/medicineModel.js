// models/medicineModel.js
const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
    brandName: { type: String, required: true, unique: true },
    barcode: { type: String },
    atcCode: { type: String },
    atcName: { type: String },
    companyName: { type: String },
    prescriptionType: { type: String },
    status: { type: String },
    description: { type: String },
    basicMedicineList: { type: Number, default: 0 },
    childMedicineList: { type: Number, default: 0 },
    newbornMedicineList: { type: Number, default: 0 },
    activeProductDate: { type: Date },
}, {
    timestamps: true
});

// Create the Medicine model
const Medicine = mongoose.model('Medicine', medicineSchema);

/**
 * Search medicines by brandName using a case-insensitive regex
 * @param {String} query - The search query
 * @returns {Array} - Array of medicine objects with only brandName
 */
async function searchMedicines(query) {
    if (!query) {
        throw new Error('Search query is required');
    }

    const regex = new RegExp(query, 'i');
    const results = await Medicine.find({ brandName: regex }).select('brandName -_id').exec();

    console.log(`[DEBUG] searchMedicines returned: ${JSON.stringify(results)}`);
    return results;
}

/**
 * Upsert multiple medicines into the database
 * @param {Array} medicines - Array of medicine objects to upsert
 */
async function upsertMedicines(medicines) {
    if (!Array.isArray(medicines)) {
        throw new Error('medicines must be an array');
    }

    const bulkOps = medicines.map(med => {
        return {
            updateOne: {
                filter: { brandName: med.brandName },
                update: { $set: med },
                upsert: true
            }
        };
    });

    if (bulkOps.length > 0) {
        const bulkWriteResult = await Medicine.bulkWrite(bulkOps);
        console.log(`[INFO] Upserted ${bulkWriteResult.upsertedCount} medicines.`);
    } else {
        console.log('[INFO] No medicines to upsert.');
    }
}



module.exports = {
    searchMedicines,
    upsertMedicines
};
