const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

// --- Gestion des erreurs pour empêcher le bot de crash ---
process.on('unhandledRejection', (reason) => {
    console.error('Erreur mineure ignorée :', reason.message || reason);
});

process.on('uncaughtException', (err) => {
    console.error('Exception critique, le bot tente de rester en vie :', err.message);
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

// Utilisation de clientReady au lieu de ready pour éviter le warning de v15
client.once('clientReady', () => {
    console.log(`Connecté en tant que ${client.user.tag} !`);
});

// --- Gestionnaire de Messages ---
client.on('messageCreate', async (message) => {
    // 1. On ignore les messages des bots
    if (message.author.bot) return;

    // 2. AutoMod : Vérification de tous les filtres
    const isInfraction = await automodManager.runAll(message);
    if (isInfraction) return; 

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