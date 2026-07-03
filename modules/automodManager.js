const antiLink = require('./filters/antiLink');
const antiSpam = require('./filters/antiSpam');
const badWords = require('./filters/badWords'); // Ajout du module

module.exports = {
    async runAll(message) {
        // La liste contient maintenant 3 filtres
        const filters = [antiLink, antiSpam, badWords];
        
        for (const filter of filters) {
            const isInfraction = await filter.check(message);
            if (isInfraction) return true; 
        }
        return false;
    }
};