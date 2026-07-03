// modules/filters/antiSpam.js
const punish = require('../../utils/punishment');

const cooldowns = new Map();

module.exports = {
    async check(message) {
        const userId = message.author.id;
        const now = Date.now();
        const LIMIT = 5;      // Nombre max de messages
        const WINDOW = 5000;  // Dans un intervalle de 5 secondes

        if (!cooldowns.has(userId)) {
            cooldowns.set(userId, []);
        }

        const timestamps = cooldowns.get(userId);
        timestamps.push(now);

        // On ne garde que les messages dans la fenêtre de temps
        const filteredTimestamps = timestamps.filter(time => now - time < WINDOW);
        cooldowns.set(userId, filteredTimestamps);

        // Si le seuil est dépassé
        if (filteredTimestamps.length > LIMIT) {
            // Suppression du message
            if (message.guild.members.me.permissions.has('ManageMessages')) {
                await message.delete().catch(() => {});
            }
            
            // Application de la sanction (Timeout 2min + Message dans le salon)
            await punish.applySanction(message.member, 'timeout', 'Spam détecté', message.channel);
            
            // On vide le cooldown pour éviter de re-sanctionner immédiatement
            cooldowns.delete(userId);
            return true; 
        }

        return false;
    }
};