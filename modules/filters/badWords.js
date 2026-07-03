// modules/filters/badWords.js
const punish = require('../../utils/punishment');

module.exports = {
    async check(message) {
        // Liste propre : plus besoin de mettre des variantes (FDPPPPPPP), le nettoyage s'en occupe.
        const badWords = [
            'pute', 'putain', 'salope', 'connard', 'connasse', 'enculé', 'fdp', 
            'tamer', 'nique', 'ntm', 'tg', 'batard', 'bouffon', 'clochard', 
            'con', 'conne', 'abruti', 'idiot', 'imbecile', 'debile', 'cretin', 
            'merde', 'enfoire', 'ordure', 'fuck', 'bitch', 'asshole', 'dick', 
            'cock', 'cunt', 'whore', 'slut', 'shit', 'dumbass', 'jackass',
            'loser', 'kys', 'kms', 'ez', 'ratio', 'nazi', 'hitler', 'kkk', 
            'faggot', 'fag', 'suce', 'bite', 'chatte', 'couilles', 'branleur'
        ];
        
        // 1. Normalisation du message
        let content = message.content.toLowerCase();
        
        // Nettoyage : 
        // - Enlève tout ce qui n'est pas une lettre (espaces, points, tirets, etc.)
        // - Réduit les répétitions (ex: "F.D.P.P.P" -> "fdppp" -> "fdp")
        let cleanContent = content.replace(/[^a-z]/g, '');
        cleanContent = cleanContent.replace(/(.)\1+/g, '$1');

        // 2. Vérification
        // On vérifie si un mot interdit est contenu dans la version "nettoyée" du message
        const foundWord = badWords.find(word => cleanContent.includes(word));

        if (foundWord) {
            // Suppression du message
            if (message.guild.members.me.permissions.has('ManageMessages')) {
                await message.delete().catch(err => console.error("Erreur suppression message :", err));
            }
            
            // Application de la sanction
            await punish.applySanction(message.member, 'timeout', `Contenu inapproprié détecté`, message.channel);
            
            return true;
        }
        
        return false;
    }
};