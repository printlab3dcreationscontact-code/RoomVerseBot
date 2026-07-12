const punish = require('../../utils/punishment');
const { OWNER_ID } = require('../../config');

module.exports = {
    async check(message) {

        // Ignore les bots et le propriétaire
        if (message.author.bot) return false;
        if (message.author.id === OWNER_ID) return false;

        const whitelist = [
            'discord.com',
            'discord.gg',
            'youtube.com',
            'youtu.be'
        ];

        const urlRegex = /(https?:\/\/[^\s]+)/gi;

        const matches = message.content.match(urlRegex);

        if (!matches) return false;

        for (const url of matches) {

            if (!whitelist.some(domain => url.includes(domain))) {

                await message.delete().catch(() => {});

                await punish.applySanction(
                    message.member,
                    'timeout',
                    'Envoi de lien interdit',
                    message.channel
                );

                return true;
            }
        }

        return false;
    }
};