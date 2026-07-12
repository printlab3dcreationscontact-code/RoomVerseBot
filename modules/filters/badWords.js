const punish = require('../../utils/punishment');
const { OWNER_ID } = require('../../config');

module.exports = {
    async check(message) {

        // Ignore les bots et le propriétaire
        if (message.author.bot) return false;
        if (message.author.id === OWNER_ID) return false;

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

        const badWordsUniversal = [
            'kys',
            'kms',
            'ez',
            'ratio',
            'nazi',
            'hitler',
            'kkk'
        ];

        const allBadWords = [
            ...badWordsFR,
            ...badWordsEN,
            ...badWordsUniversal
        ];

        const SHORT_WORD_THRESHOLD = 3;

        const rawContent = message.content.toLowerCase();

        const clean = (str) =>
            str
                .replace(/[^a-z]/g, '')
                .replace(/(.)\1+/g, '$1');

        const fullyCleaned = clean(rawContent);

        const longWordFound = allBadWords.find(word =>
            word.length > SHORT_WORD_THRESHOLD &&
            fullyCleaned.includes(word)
        );

        const tokens = rawContent
            .split(/\s+/)
            .map(clean)
            .filter(Boolean);

        const shortWordFound = allBadWords.find(word =>
            word.length <= SHORT_WORD_THRESHOLD &&
            tokens.includes(word)
        );

        const foundWord = longWordFound || shortWordFound;

        if (!foundWord)
            return false;

        if (message.guild.members.me.permissions.has('ManageMessages')) {
            await message.delete().catch(() => {});
        }

        const isEnglish = badWordsEN.includes(foundWord);

        const warningMessage = isEnglish
            ? `⚠️ **Whoa whoa whoa, watch your language ${message.author}!**`
            : `⚠️ **Hop hop hop, revois ton vocabulaire ${message.author} !**`;

        const warningPrompt = await message.channel.send(warningMessage);

        setTimeout(() => {
            warningPrompt.delete().catch(() => {});
        }, 5000);

        await punish.applySanction(
            message.member,
            'timeout',
            `Usage de mot interdit : ${foundWord}`,
            message.channel
        );

        return true;
    }
};