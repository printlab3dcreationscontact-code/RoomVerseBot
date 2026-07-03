// utils/punishment.js
module.exports = {
    async applySanction(member, action, reason, channel) {
        // 1. Sécurité : Ne jamais toucher au proprio du serveur
        if (member.id === member.guild.ownerId) return;

        // 2. Sécurité : Vérifier les permissions du bot
        if (!member.guild.members.me.permissions.has('ModerateMembers')) {
            console.error("Le bot n'a pas la permission de modérer.");
            return;
        }

        try {
            switch(action) {
                case 'timeout':
                    await member.timeout(60000, reason); // 1 minute par défaut
                    break;
                case 'kick':
                    await member.kick(reason);
                    break;
                case 'ban':
                    await member.ban({ reason });
                    break;
            }
            console.log(`Sanction appliquée à ${member.user.tag} : ${action}`);
        } catch (error) {
            console.error(`Erreur lors de la sanction : ${error}`);
        }
    }
};