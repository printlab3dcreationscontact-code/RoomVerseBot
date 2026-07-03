// modules/filters/badWords.js
const punish = require('../../utils/punishment');

module.exports = {
    async check(message) {
        // 1. Listes de mots interdits
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

        const badWordsUniversal = ['kys', 'kms', 'ez', 'ratio', 'nazi', 'hitler', 'kkk'];

        const allBadWords = [...badWordsFR, ...badWordsEN, ...badWordsUniversal];
        
        let content = message.content.toLowerCase();
        
        // Nettoyage intelligent (transforme "F.D.P" ou "FDPPP" en "fdp")
        let cleanContent = content.replace(/[^a-z]/g, '');
        cleanContent = cleanContent.replace(/(.)\1+/g, '$1');

        // 2. Vérification
        const foundWord = allBadWords.find(word => cleanContent.includes(word));

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