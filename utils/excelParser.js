// utils/excelParser.js
const ExcelJS = require('exceljs');

/**
 * Helper function to extract text from a cell value.
 * If the cell contains an object (e.g., with text and hyperlink), return the text.
 * If it's a string, return it as is.
 * Otherwise, return null.
 *
 * @param {any} cellValue - The value of the Excel cell.
 * @returns {string|null} - Extracted text or null.
 */
function extractText(cellValue) {
    if (typeof cellValue === 'string') {
        return cellValue;
    } else if (typeof cellValue === 'object' && cellValue !== null) {
        return cellValue.text || null;
    }
    return null;
}

async function parseMedicineExcel(filePath) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.worksheets[0];
    const medicines = [];

    worksheet.eachRow((row, rowNumber) => {
        // Skip the first three rows (metadata and headers)
        if (rowNumber <= 3) return;

        const brandName = extractText(row.getCell(1).value);
        const barcode = extractText(row.getCell(2).value);
        const atcCode = extractText(row.getCell(3).value);
        const atcName = extractText(row.getCell(4).value);
        const companyName = extractText(row.getCell(5).value);
        const prescriptionType = extractText(row.getCell(6).value);
        const status = extractText(row.getCell(7).value);
        const description = extractText(row.getCell(8).value);

        // For numeric fields, ensure they are numbers
        const basicMedicineList = parseInt(row.getCell(9).value, 10) || 0;
        const childMedicineList = parseInt(row.getCell(10).value, 10) || 0;
        const newbornMedicineList = parseInt(row.getCell(11).value, 10) || 0;

        const activeProductDateValue = row.getCell(12).value;
        let activeProductDate = null;

        if (activeProductDateValue) {
            if (typeof activeProductDateValue === 'string') {
                const [month, day, year] = activeProductDateValue.split('/').map(Number);
                if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
                    activeProductDate = new Date(year, month - 1, day);
                    if (isNaN(activeProductDate.getTime())) {
                        console.warn(`Row ${rowNumber}: Invalid date string "${activeProductDateValue}"`);
                        activeProductDate = null;
                    }
                } else {
                    console.warn(`Row ${rowNumber}: Malformed date string "${activeProductDateValue}"`);
                }
            } else if (activeProductDateValue instanceof Date && !isNaN(activeProductDateValue.getTime())) {
                activeProductDate = activeProductDateValue;
            } else {
                console.warn(`Row ${rowNumber}: Unexpected date format "${activeProductDateValue}"`);
            }
        }

        if (brandName) {
            medicines.push({
                brandName,
                barcode,
                atcCode,
                atcName,
                companyName,
                prescriptionType,
                status,
                description,
                basicMedicineList,
                childMedicineList,
                newbornMedicineList,
                activeProductDate,
            });
        }
    });

    return medicines;
}

module.exports = { parseMedicineExcel };
