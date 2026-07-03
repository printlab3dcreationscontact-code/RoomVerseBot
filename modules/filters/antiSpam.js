// utils/punishment.js
const { EmbedBuilder } = require('discord.js');
const infractions = new Map();

// ID du salon où les alertes doivent être envoyées
const LOG_CHANNEL_ID = '1512554829405225070'; 

module.exports = {
    async applySanction(member, type, reason, channel) {
        // 1. Sécurité : Ne jamais sanctionner le propriétaire ou le bot
        if (member.id === member.guild.ownerId || member.id === member.guild.members.me.id) return;

        // 2. Vérifier les permissions
        if (!member.guild.members.me.permissions.has('ModerateMembers')) return;

        const userId = member.id;
        const count = (infractions.get(userId) || 0) + 1;
        infractions.set(userId, count);

        // Trouver le salon de log
        const logChannel = member.guild.channels.cache.get(LOG_CHANNEL_ID);

        // 3. Avertissements discrets (pour les 2 premières infractions)
        // Ils s'affichent dans le salon de l'utilisateur puis disparaissent
        if (count <= 2) {
            const warnMsg = await channel.send(`⚠️ *Attention ${member}, c'est ton avertissement n°${count}/2. Raison : ${reason}*`);
            setTimeout(() => warnMsg.delete().catch(() => {}), 5000);
            return;
        }

        // 4. Paliers de sanctions (pour infraction 3 et plus)
        const durations = [0, 0, 0, 5, 15, 60]; 
        const durationMinutes = durations[Math.min(count, durations.length - 1)];

        // 5. Création de l'Embed de sanction
        const embed = new EmbedBuilder()
            .setColor(count >= 6 ? 0x000000 : 0xFF0000)
            .setTitle(count >= 6 ? '🚫 Exclusion Automatique' : '🛡️ Alerte Auto-Modération')
            .setDescription(
                `**Utilisateur :** ${member}\n` +
                `**Statut :** ${member} en est à sa **${count}ème infraction**.\n` +
                `**Raison :** ${reason}`
            )
            .setFooter({ text: 'Décision prise automatiquement par RoomVerseBot' });

        // 6. Exécution et envoi dans le salon de LOGS
        if (count >= 6) {
            await member.kick(`Récidive excessive : ${count} infractions`).catch(console.error);
            embed.addFields({ name: 'Action', value: 'L’utilisateur a été expulsé du serveur.' });
            
            if (logChannel) {
                logChannel.send({ embeds: [embed] });
            } else {
                channel.send({ embeds: [embed] }); // Repli sur le salon courant si le salon de log est introuvable
            }
            infractions.delete(userId);
        } else {
            if (durationMinutes > 0) {
                await member.timeout(durationMinutes * 60 * 1000, reason).catch(console.error);
                embed.addFields({ name: 'Sanction appliquée', value: `Timeout de ${durationMinutes} minutes.` });
            }
            
            if (logChannel) {
                logChannel.send({ embeds: [embed] });
            } else {
                channel.send({ embeds: [embed] });
            }
        }
    },

    resetInfractions(userId) {
        infractions.delete(userId);
    }
};