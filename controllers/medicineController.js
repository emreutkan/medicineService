// controllers/medicineController.js
const { searchMedicines } = require('../models/medicineModel');

/**
 * GET /v1/medicine/search?query=ASP
 */
exports.searchMedicine = async (req, res) => {
    const query = req.query.query || '';
    if (!query) {
        return res.status(400).json({ error: 'Query parameter is missing.' });
    }

    try {
        // 1) Check Redis cache
        const redisClient = req.app.locals.redisClient;
        const cacheKey = `medicine_search_${query.toLowerCase()}`;

        if (redisClient) {
            const cachedResult = await redisClient.get(cacheKey);
            if (cachedResult) {
                return res.json({ medicationNames: JSON.parse(cachedResult) });
            }
        }
        else {
            console.log('[DEBUG] Redis is not initialized, skipping cache check.');
        }


        // 2) Search in Mongo
        const results = await searchMedicines(query);

        // 3) Store in cache
        if (redisClient) {
            await redisClient.set(cacheKey, JSON.stringify(results), {
                EX: 60 * 60 // expire in 1 hour
            });
        }

        return res.json({ medicationNames: results });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
