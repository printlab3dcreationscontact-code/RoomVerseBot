// modules/antiLink.js
const { punish } = require('../../utils/punishment');

module.exports = {
    async check(message) {
        // Liste des domaines autorisés (Whitelist)
        const whitelist = ['discord.com', 'youtube.com'];
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        
        const matches = message.content.match(urlRegex);
        if (!matches) return false;

        for (const url of matches) {
            // Si le lien n'est pas dans la whitelist
            if (!whitelist.some(domain => url.includes(domain))) {
                await message.delete();
                await punish.applySanction(message.member, 'timeout', 'Envoi de lien interdit');
                return true; // Le message a été filtré
            }
        }
        return false;
    }
};