// utils/getXlsx.js

const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrape TİTCK page to find the newest XLSX link
 */
async function getLatestXlsxLink() {
    const url = 'https://www.titck.gov.tr/dinamikmodul/43';
    const { data } = await axios.get(url);

    const $ = cheerio.load(data);

    let latestLink = null;
    let latestDate = null;

    $('#myTable tbody tr').each((i, row) => {
        const tds = $(row).find('td');
        if (tds.length >= 3) {
            // date is in 2nd <td>
            const dateText = $(tds[1]).text().trim(); // e.g. '14/01/2025'
            const [day, month, year] = dateText.split('/').map(Number);
            const rowDate = new Date(year, month - 1, day);

            // link is in 3rd <td>, an <a> tag
            const link = $(tds[2]).find('a').attr('href');

            // Keep the row with the *largest* date
            if (!latestDate || rowDate > latestDate) {
                latestDate = rowDate;
                latestLink = link;
            }
        }
    });

    return latestLink;
}

module.exports = { getLatestXlsxLink };
