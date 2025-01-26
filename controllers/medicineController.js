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
            console.log(`[DEBUG] Checking cache with key: ${cacheKey}`);
            const cachedResult = await redisClient.get(cacheKey);
            if (cachedResult) {
                console.log('[DEBUG] Cache hit');
                return res.json({ medicationNames: JSON.parse(cachedResult) });
            } else {
                console.log('[DEBUG] Cache miss');
            }
        } else {
            console.log('[DEBUG] Redis client not available');
        }

        // 2) Search in Mongo
        console.log('[DEBUG] Searching in MongoDB');
        const results = await searchMedicines(query);

        // 3) Extract only the brandName and convert to uppercase
        const medicationNames = results
            .map(med => med.brandName) // Extract brandName
            .filter(name => typeof name === 'string') // Ensure it's a string
            .map(name => name.toUpperCase()); // Convert to uppercase

        // 4) Store in cache
        if (redisClient) {
            try {
                console.log(`[DEBUG] Caching result with key: ${cacheKey}`);
                await redisClient.set(cacheKey, JSON.stringify(medicationNames), {
                    EX: 60 * 60, // expire in 1 hour
                });
            } catch (cacheError) {
                console.error('[ERROR] Failed to set cache:', cacheError);
            }
        }

        return res.json({ medicationNames });
    } catch (err) {
        console.error('[ERROR] Internal server error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
