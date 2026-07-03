// modules/filters/badWords.js
const punish = require('../../utils/punishment');

module.exports = {
    async check(message) {
        // 1. Séparation des listes par langue pour savoir quoi répondre
        const badWordsFR = [
            'pute', 'putain', 'salope', 'connard', 'connasse', 'enculé', 'fdp', 
            'tamer', 'nique', 'ntm', 'tg', 'batard', 'bouffon', 'clochard', 
            'con', 'conne', 'abruti', 'idiot', 'imbecile', 'debile', 'cretin', 
            'merde', 'enfoire', 'ordure', 'suce', 'bite', 'chatte', 'couilles', 'branleur'
        ];

        const badWordsEN = [
            'fuck', 'bitch', 'asshole', 'dick', 'cock', 'cunt', 'whore', 
            'slut', 'shit', 'dumbass', 'jackass', 'loser', 'faggot', 'fag'
        ];

        // Mots universels ou codes
        const badWordsUniversal = ['kys', 'kms', 'ez', 'ratio', 'nazi', 'hitler', 'kkk'];

        // On fusionne tout pour la recherche globale
        const allBadWords = [...badWordsFR, ...badWordsEN, ...badWordsUniversal];
        
        let content = message.content.toLowerCase();
        
        // Nettoyage intelligent
        let cleanContent = content.replace(/[^a-z]/g, '');
        cleanContent = cleanContent.replace(/(.)\1+/g, '$1');

        // 2. Vérification du mot
        const foundWord = allBadWords.find(word => cleanContent.includes(word));

        if (foundWord) {
            // 3. Détection automatique de la langue pour la réponse
            // On regarde d'abord la langue configurée sur le compte de l'utilisateur (si Discord la transmet)
            let userLanguage = message.author.locale || 'fr'; 

            // Si Discord ne donne pas la langue du compte, on devine selon le mot qu'il a utilisé
            if (!message.author.locale) {
                if (badWordsEN.includes(foundWord)) {
                    userLanguage = 'en';
                } else {
                    userLanguage = 'fr'; // Par défaut en français pour RoomVerse
                }
            }

            // 4. Choix du message selon la langue
            let warningMessage = "";
            if (userLanguage.startsWith('en')) {
                warningMessage = `⚠️ **Whoa whoa whoa, watch your language ${message.author}!**`;
            } else {
                warningMessage = `⚠️ **Hop hop hop, revois ton vocabulaire ${message.author} !**`;
            }

            // Suppression du message insultant
            if (message.guild.members.me.permissions.has('ManageMessages')) {
                await message.delete().catch(err => console.error("Erreur suppression message :", err));
            }
            
            // Envoi du message d'avertissement personnalisé dans le salon
            const warningPrompt = await message.channel.send(warningMessage);
            // Optionnel : supprime l'avertissement du bot après 5 secondes pour garder le salon propre
            setTimeout(() => warningPrompt.delete().catch(() => {}), 5000);

            // Application de la sanction (Timeout 2min)
            await punish.applySanction(message.member, 'timeout', `Contenu inapproprié détecté (${foundWord})`, message.channel);
            
            return true;
        }
        
        return false;
    }
};