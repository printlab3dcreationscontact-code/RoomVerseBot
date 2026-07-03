// modules/filters/badWords.js
const punish = require('../../utils/punishment'); // Import direct sans accolades

module.exports = {
    async check(message) {
        const badWords = [
            'pute', 'putain', 'salope', 'connard', 'connasse', 'enculé', 'fdp', 
            'ta mère', 'nique', 'ntm', 'tg', 'bâtard', 'bouffon', 'clochard', 
            'con', 'conne', 'abruti', 'idiot', 'imbécile', 'débile', 'crétin', 
            'merde', 'enfoiré', 'ordure', 'fuck', 'bitch', 'asshole', 'dick', 
            'cock', 'cunt', 'whore', 'slut', 'shit', 'dumbass', 'jackass', 
            'loser', 'kys', 'kms', 'ez', 'ratio', 'nazi', 'hitler', 'kkk', 
            'faggot', 'fag', 'suce', 'bite', 'chatte', 'couilles', 'branleur'
        ];
        
        const content = message.content.toLowerCase();
        const regex = new RegExp(`\\b(${badWords.join('|')})\\b`, 'i');
        const match = content.match(regex);

        if (match) {
            // 1. Suppression du message
            if (message.guild.members.me.permissions.has('ManageMessages')) {
                await message.delete().catch(err => console.error("Impossible de supprimer le message :", err));
            }
            
            // 2. Application de la sanction (Timeout)
            // On utilise la fonction importée depuis utils/punishment.js
            await punish.applySanction(message.member, 'timeout', `Usage de mot interdit : ${match[0]}`);
            
            // 3. Envoi de l'avertissement
            const warning = await message.channel.send(`${message.author}, hop hop hop revois ton vocabulaire !`);
            
            // 4. Suppression de l'avertissement après 5 secondes
            setTimeout(() => {
                warning.delete().catch(err => console.error("Impossible de supprimer l'avertissement :", err));
            }, 5000);

            return true; // Infraction traitée
        }
        
        return false;
    }
};