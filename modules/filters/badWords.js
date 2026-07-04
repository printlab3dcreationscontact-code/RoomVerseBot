// modules/filters/badWords.js
const punish = require('../../utils/punishment');

module.exports = {
    async check(message) {
        // 1. Listes de mots interdits
        const badWordsFR = [
            'pute', 'putain', 'salope', 'connard', 'connasse', 'encule', 'fdp', 
            'tamer', 'nique', 'ntm', 'tg', 'batard', 'bouffon', 'clochard', 
            'con', 'conne', 'abruti', 'idiot', 'imbecile', 'debile', 'cretin', 
            'merde', 'enfoire', 'ordure', 'suce', 'bite', 'chatte', 'couilles', 'branleur'
        ];

        const badWordsEN = [
            'fuck', 'bitch', 'asshole', 'dick', 'cock', 'cunt', 'whore', 
            'slut', 'shit', 'dumbass', 'jackass', 'loser', 'faggot', 'fag'
        ];

        const badWordsUniversal = ['kys', 'kms', 'ez', 'ratio', 'nazi', 'hitler', 'kkk'];

        const allBadWords = [...badWordsFR, ...badWordsEN, ...badWordsUniversal];

        // Seuil : en dessous de cette longueur, on exige une correspondance EXACTE d'un mot entier
        // (sinon "ez" matcherait dans "avez", "tg" dans "watching", etc.)
        const SHORT_WORD_THRESHOLD = 3;

        const rawContent = message.content.toLowerCase();

        // Fonction de nettoyage : enlève tout ce qui n'est pas une lettre, puis compresse les répétitions
        const clean = (str) => str.replace(/[^a-z]/g, '').replace(/(.)\1+/g, '$1');

        // --- Vérification 1 : mots LONGS, détectés même cachés dans une phrase collée ---
        const fullyCleaned = clean(rawContent);
        const longWordFound = allBadWords.find(word => 
            word.length > SHORT_WORD_THRESHOLD && fullyCleaned.includes(word)
        );

        // --- Vérification 2 : mots COURTS, détectés uniquement s'ils forment un mot ENTIER ---
        const tokens = rawContent.split(/\s+/).map(clean).filter(Boolean);
        const shortWordFound = allBadWords.find(word => 
            word.length <= SHORT_WORD_THRESHOLD && tokens.includes(word)
        );

        const foundWord = longWordFound || shortWordFound;

        if (foundWord) {
            // 3. Suppression du message
            if (message.guild.members.me.permissions.has('ManageMessages')) {
                await message.delete().catch(() => {});
            }
            
            // 4. Message d'avertissement temporaire dans le salon
            const isEnglish = badWordsEN.includes(foundWord);
            const warningMessage = isEnglish 
                ? `⚠️ **Whoa whoa whoa, watch your language ${message.author}!**`
                : `⚠️ **Hop hop hop, revois ton vocabulaire ${message.author} !**`;

            const warningPrompt = await message.channel.send(warningMessage);
            setTimeout(() => warningPrompt.delete().catch(() => {}), 5000);

            // 5. Application de la sanction progressive (via punishment.js)
            // On ne précise plus la durée, le système de paliers la calcule tout seul !
            await punish.applySanction(message.member, 'timeout', `Usage de mot interdit : ${foundWord}`, message.channel);
            
            return true;
        }
        
        return false;
    }
};