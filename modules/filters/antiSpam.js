const punish = require('../../utils/punishment');
const { OWNER_ID } = require('../../config');

const cooldowns = new Map();

module.exports = {

    async check(message) {

        // Ignore les bots et le propriétaire
        if (message.author.bot) return false;
        if (message.author.id === OWNER_ID) return false;

        const userId = message.author.id;
        const now = Date.now();

        const LIMIT = 5;
        const WINDOW = 5000;

        if (!cooldowns.has(userId)) {
            cooldowns.set(userId, []);
        }

        const timestamps = cooldowns.get(userId);

        timestamps.push(now);

        const filteredTimestamps = timestamps.filter(time => now - time < WINDOW);

        cooldowns.set(userId, filteredTimestamps);

        if (filteredTimestamps.length > LIMIT) {

            if (message.guild.members.me.permissions.has('ManageMessages')) {
                await message.delete().catch(() => {});
            }

            await punish.applySanction(
                message.member,
                'timeout',
                'Spam détecté',
                message.channel
            );

            cooldowns.delete(userId);

            return true;
        }

        return false;
    }
};