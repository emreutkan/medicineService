// utils/excelParser.js
const ExcelJS = require('exceljs');

async function parseMedicineExcel(filePath) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.worksheets[0];
    const medicines = [];

    worksheet.eachRow((row, rowNumber) => {
        // Skip the first three rows (metadata and headers)
        if (rowNumber <= 3) return;

        const brandName = row.getCell(1).value;
        const barcode = row.getCell(2).value || null;
        const atcCode = row.getCell(3).value || null;
        const atcName = row.getCell(4).value || null;
        const companyName = row.getCell(5).value || null;
        const prescriptionType = row.getCell(6).value || null;
        const status = row.getCell(7).value || null;
        const description = row.getCell(8).value || null;
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
