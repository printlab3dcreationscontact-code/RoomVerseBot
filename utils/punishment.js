// utils/punishment.js

// On utilise une Map en mémoire pour suivre le nombre d'infractions
const infractions = new Map();

module.exports = {
    async applySanction(member, type, reason, channel) {
        // 1. Sécurité : Ne jamais sanctionner le propriétaire ou le bot lui-même
        if (member.id === member.guild.ownerId || member.id === member.guild.members.me.id) return;

        // 2. Sécurité : Vérifier les permissions
        if (!member.guild.members.me.permissions.has('ModerateMembers')) {
            console.error("Le bot n'a pas la permission de modérer.");
            return;
        }

        // 3. Gestion des niveaux de sanction
        const userId = member.id;
        const count = (infractions.get(userId) || 0) + 1;
        infractions.set(userId, count);

        // Définition des durées de timeout (en minutes)
        const durations = [0, 2, 5, 15, 60]; 
        // Niveau 1: 0 (juste averti), Niveau 2: 2min, Niveau 3: 5min, etc.
        
        const durationIndex = Math.min(count, durations.length - 1);
        const durationMinutes = durations[durationIndex];

        // 4. Alerte aux modérateurs si le comportement persiste (dès la 3ème infraction)
        if (count >= 3) {
            const modChannel = member.guild.channels.cache.get('1316389736776077322'); // Remplace par ton ID réel
            if (modChannel) {
                modChannel.send(`⚠️ **Alerte AutoMod** : ${member} en est à sa **${count}ème infraction**. Raison : *${reason}*.`);
            }
        }

        // 5. Exécution de la sanction
        try {
            if (count >= 6) {
                // Kick automatique après 6 infractions
                await member.kick(`Auto-modération : récidive excessive (${count} infractions)`).catch(console.error);
                channel.send(`🚫 ${member.user.username} a été exclu automatiquement pour récidive excessive.`);
                infractions.delete(userId);
            } else if (durationMinutes > 0) {
                // Application du Timeout
                await member.timeout(durationMinutes * 60 * 1000, reason).catch(console.error);
                channel.send(`⚠️ ${member} a reçu un timeout de **${durationMinutes} minute(s)** pour : *${reason}*. (Infraction n°${count})`);
            } else {
                // Juste un avertissement pour la 1ère infraction
                channel.send(`⚠️ ${member}, attention : ${reason}.`);
            }
        } catch (error) {
            console.error(`Erreur lors de la sanction : ${error}`);
        }
    },

    // Permet aux modos de reset le compteur d'un utilisateur
    resetInfractions(userId) {
        infractions.delete(userId);
    }
};