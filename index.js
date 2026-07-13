const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const ticketManager = require('./utils/ticketManager');
const express = require('express');
const cors = require('cors');

process.on('unhandledRejection', (reason) => {
    console.error('Erreur mineure ignorée :', reason.stack || reason);
});

process.on('uncaughtException', (err) => {
    console.error('Exception critique, le bot tente de rester en vie :', err.stack);
});

// --- Initialisation du Serveur Express (API Panel) ---
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BOT_SECRET = process.env.BOT_SECRET;

if (!BOT_SECRET) {
    console.warn("⚠️ Avertissement : la variable BOT_SECRET n'est pas définie. L'API d'envoi de messages est publique.");
}

// Route racine pour maintenir le bot éveillé sur Render avec UptimeRobot
app.get('/', (req, res) => {
    res.status(200).send('RoomVerse Bot is running!');
});

// Route de santé (utilisée par le panel pour tester la connexion)
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        bot: client.user ? client.user.tag : 'non connecté' 
    });
});

app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

// Route de récupération des salons du bot
app.get('/api/channels', async (req, res) => {
    try {
        // Validation du Secret si configuré
        if (BOT_SECRET) {
            const authHeader = req.headers.authorization;
            const providedSecret = authHeader 
                ? authHeader.replace('Bearer ', '').trim() 
                : req.query.secret;
            
            if (providedSecret !== BOT_SECRET) {
                return res.status(403).json({ error: 'Non autorisé : Secret incorrect ou manquant' });
            }
        }

        const channelList = [];
        client.guilds.cache.forEach(guild => {
            // Parcourir tous les salons de ce serveur
            guild.channels.cache.forEach(channel => {
                // Filtrer pour ne garder que les salons textuels (pas les salons vocaux ni les threads)
                if (channel.isTextBased() && !channel.isVoiceBased() && !channel.isThread()) {
                    const parentName = channel.parent ? channel.parent.name : null;
                    channelList.push({
                        id: channel.id,
                        name: channel.name,
                        category: parentName,
                        guildName: guild.name
                    });
                }
            });
        });

        // Trier les salons par nom de serveur, puis par catégorie, puis par nom de salon
        channelList.sort((a, b) => {
            const guildCompare = a.guildName.localeCompare(b.guildName);
            if (guildCompare !== 0) return guildCompare;
            
            const catA = a.category || '';
            const catB = b.category || '';
            const catCompare = catA.localeCompare(catB);
            if (catCompare !== 0) return catCompare;
            
            return a.name.localeCompare(b.name);
        });

        res.status(200).json({ channels: channelList });
    } catch (err) {
        console.error("Erreur lors de la récupération des salons :", err);
        res.status(500).json({ error: "Erreur interne lors de la récupération des salons", details: err.message });
    }
});

// Route d'envoi de message depuis le panel
app.post('/api/send-message', async (req, res) => {
    try {
        const { channelId, secret, content, embeds } = req.body;

        // Validation du Secret si configuré
        if (BOT_SECRET) {
            const authHeader = req.headers.authorization;
            const providedSecret = authHeader 
                ? authHeader.replace('Bearer ', '').trim() 
                : secret;
            
            if (providedSecret !== BOT_SECRET) {
                return res.status(403).json({ error: 'Non autorisé : Secret incorrect ou manquant' });
            }
        }

        // Validation du Salon
        if (!channelId) {
            return res.status(400).json({ error: 'channelId est requis' });
        }

        // Récupérer le salon Discord
        let channel = client.channels.cache.get(channelId);
        if (!channel) {
            try {
                channel = await client.channels.fetch(channelId);
            } catch (fetchErr) {
                console.error(`Impossible de récupérer le salon ${channelId}:`, fetchErr);
                return res.status(404).json({ error: `Salon Discord introuvable ou inaccessible (${channelId})` });
            }
        }

        if (!channel.isTextBased()) {
            return res.status(400).json({ error: 'Le salon ciblé doit être un salon textuel' });
        }

        // Préparer les options du message
        const messageOptions = {};
        if (content) messageOptions.content = content;
        if (embeds && Array.isArray(embeds)) {
            messageOptions.embeds = embeds;
        }

        if (!messageOptions.content && (!messageOptions.embeds || messageOptions.embeds.length === 0)) {
            return res.status(400).json({ error: 'Le message doit contenir du texte ou un embed' });
        }

        // Envoyer le message
        const sentMessage = await channel.send(messageOptions);
        res.status(200).json({ 
            success: true, 
            messageId: sentMessage.id, 
            channelId: sentMessage.channelId 
        });
    } catch (err) {
        console.error("Erreur lors de l'envoi du message via l'API :", err);
        res.status(500).json({ error: "Erreur interne du serveur lors de l'envoi", details: err.message });
    }
});

// Lancer le serveur HTTP immédiatement
app.listen(PORT, () => {
    console.log(`Serveur API du Bot à l'écoute sur le port ${PORT}`);
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

    // Commande !setupticket : envoie le panneau avec le bouton de création de ticket
    if (message.content === '!setupticket') {
        if (message.author.id !== MON_ID) return;

        await message.channel.send(ticketManager.buildPanel());
        await message.delete().catch(() => {});
    }
});

// --- Gestion des interactions (boutons) ---
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'create_ticket') {
        await ticketManager.createTicket(interaction);
    }

    if (interaction.customId === 'close_ticket') {
        await ticketManager.closeTicket(interaction);
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