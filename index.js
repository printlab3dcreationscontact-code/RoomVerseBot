const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

// Empêche le crash sur les erreurs non gérées
process.on('unhandledRejection', (reason, promise) => {
    console.error('[CRASH] Erreur non gérée détectée : ', reason);
    // Ici, le bot log l'erreur dans la console au lieu de s'arrêter
});

process.on('uncaughtException', (err) => {
    console.error('[CRASH] Exception non capturée : ', err);
    // Ici, le bot log l'erreur critique au lieu de s'arrêter
});

// --- Modules et Utilitaires ---
const antiLink = require('./modules/filters/antiLink'); 
const automodManager = require('./modules/automodManager');

const TOKEN = process.env.TOKEN;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.once('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag} !`);
});

// --- Gestionnaire de Messages ---
client.on('messageCreate', async (message) => {
    // 1. On ignore les messages des bots
    if (message.author.bot) return;

    // 2. AutoMod : Vérification de tous les filtres (Anti-Link, Anti-Spam, etc.)
    const isInfraction = await automodManager.runAll(message);
    if (isInfraction) return; // Si une règle est violée, on arrête ici

    // 3. Commandes
    const MON_ID = '1232266966002307095';

    // Commande !test
    if (message.content === '!test') {
        if (message.author.id !== MON_ID) return;

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Annonce RoomVerse')
            .setDescription('Test réussi !')
            .setFooter({ text: 'Développé par breax!ch' });

        message.channel.send({ embeds: [embed] });
    }

    // Commande !testwelcome
    if (message.content === '!testwelcome') {
        if (message.author.id !== MON_ID) return;
        
        client.emit('guildMemberAdd', message.member);
        message.reply("Test de bienvenue envoyé !");
    }
});

// --- Système de Bienvenue ---
client.on('guildMemberAdd', (member) => {
    const channelId = '1511472464851501157'; 
    const ticketChannelId = '1316389736776077322'; 
    const channel = member.guild.channels.cache.get(channelId);
    
    if (!channel) return;

    const welcomeEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('Welcome to the server!')
        .setDescription(`Hello ${member} to **RoomVerse**!, thank you for joining the server. If you have any questions or problems, please open a ticket on the ticket server: <#${ticketChannelId}>`)
        .setImage('https://images.squarespace-cdn.com/content/v1/582e7271bebafbd72792bd97/1614738222048-XI1C34HABCEELIDIH9X7/RecRoom_Hangout.png')
        .setFooter({ text: `Membre n°${member.guild.memberCount}` });

    channel.send({ embeds: [welcomeEmbed] });
});

client.login(TOKEN);