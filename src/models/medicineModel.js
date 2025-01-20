// /models/medicineModel.js
const mongoose = require('mongoose');

// schema for medicines
const medicineSchema = new mongoose.Schema({
    brandName: { type: String, required: true },
    barcode: { type: String },
    atcCode: { type: String },
    atcName: { type: String },
    companyName: { type: String },
    prescriptionType: { type: String },
    status: { type: String },
    description: { type: String },
    basicMedicineList: { type: Number },
    childMedicineList: { type: Number },
    newbornMedicineList: { type: Number },
    activeProductDate: { type: Date },
    createdAt: { type: Date, default: Date.now },
});

// Create the model from the schema
const Medicine = mongoose.model('Medicine', medicineSchema);

/**
 * Insert or update a list of medicines
 * @param {Array} medicineList - List of medicines to be inserted or updated
 */
async function upsertMedicines(medicineList) {
    for (const m of medicineList) {
        await Medicine.findOneAndUpdate(
            { barcode: m.barcode }, // Use barcode as the unique identifier
            {
                brandName: m.brandName,
                barcode: m.barcode,
                atcCode: m.atcCode,
                atcName: m.atcName,
                companyName: m.companyName,
                prescriptionType: m.prescriptionType,
                status: m.status,
                description: m.description,
                basicMedicineList: m.basicMedicineList || 0,
                childMedicineList: m.childMedicineList || 0,
                newbornMedicineList: m.newbornMedicineList || 0,
                activeProductDate: m.activeProductDate || null,
            },
            { upsert: true, new: true }
        );
    }
}

/**
 * Search medicines by brandName with partial matching
 * @param {string} queryText - The search text for partial match
 * @returns {Array} - List of matching medicines
 */
async function searchMedicines(queryText) {
    const regex = new RegExp(queryText, 'i');
    return await Medicine.find({brandName: regex})
        .limit(50)
        .sort({brandName: 1})
        .select('brandName barcode atcCode atcName companyName prescriptionType status description') // Select relevant fields
        .exec();
}

module.exports = {
    Medicine,
    upsertMedicines,
    searchMedicines,
};
