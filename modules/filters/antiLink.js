// modules/filters/antiLink.js
const punish = require('../../utils/punishment'); // ⬅ pas d'accolades, c'est le fix

module.exports = {
    async check(message) {
        const whitelist = ['discord.com', 'youtube.com'];
        const urlRegex = /(https?:\/\/[^\s]+)/g;

        const matches = message.content.match(urlRegex);
        if (!matches) return false;

        for (const url of matches) {
            if (!whitelist.some(domain => url.includes(domain))) {
                await message.delete().catch(() => {});
                await punish.applySanction(message.member, 'timeout', 'Envoi de lien interdit', message.channel);
                return true;
            }
        }
        return false;
    }
};