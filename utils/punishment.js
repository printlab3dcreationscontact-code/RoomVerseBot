const { EmbedBuilder } = require('discord.js');
const { OWNER_ID } = require('../config');

const infractions = new Map();

const LOG_CHANNEL_ID = '1512554829405225070';

module.exports = {

    async applySanction(member, type, reason, channel) {

        // Ignore le propriétaire
        if (member.id === OWNER_ID) return;

        // Ignore le propriétaire du serveur
        if (member.id === member.guild.ownerId) return;

        // Ignore le bot
        if (member.id === member.guild.members.me.id) return;

        if (!member.guild.members.me.permissions.has('ModerateMembers'))
            return;

        const userId = member.id;

        const count = (infractions.get(userId) || 0) + 1;

        infractions.set(userId, count);

        const logChannel = member.guild.channels.cache.get(LOG_CHANNEL_ID);

        if (count <= 2) {

            const warnMsg = await channel.send(
                `⚠️ *Attention ${member}, c'est ton avertissement n°${count}/2.\nRaison : ${reason}*`
            );

            setTimeout(() => {
                warnMsg.delete().catch(() => {});
            }, 5000);

            return;
        }

        const durations = [
            0,
            0,
            0,
            5,
            15,
            60
        ];

        const durationMinutes =
            durations[Math.min(count, durations.length - 1)];

        const embed = new EmbedBuilder()
            .setColor(count >= 6 ? 0x000000 : 0xFF0000)
            .setTitle(
                count >= 6
                    ? '🚫 Exclusion Automatique'
                    : '🛡️ Alerte Auto-Modération'
            )
            .setDescription(
                `**Utilisateur :** ${member}\n` +
                `**Infraction :** ${count}\n` +
                `**Raison :** ${reason}`
            )
            .setFooter({
                text: 'Décision prise automatiquement par RoomVerseBot'
            });

        if (count >= 6) {

            await member
                .kick(`Récidive excessive (${count} infractions)`)
                .catch(console.error);

            embed.addFields({
                name: 'Action',
                value: 'Expulsion du serveur'
            });

            (logChannel || channel).send({
                embeds: [embed]
            });

            infractions.delete(userId);

            return;
        }

        if (durationMinutes > 0) {

            await member
                .timeout(durationMinutes * 60 * 1000, reason)
                .catch(console.error);

            embed.addFields({
                name: 'Sanction',
                value: `Timeout de ${durationMinutes} minute(s)`
            });

        }

        (logChannel || channel).send({
            embeds: [embed]
        });

    },

    resetInfractions(userId) {
        infractions.delete(userId);
    }

};