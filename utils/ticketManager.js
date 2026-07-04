// utils/ticketManager.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

// ⚠️ Remplace par tes vrais IDs
const CATEGORY_ID = '1316389736776077322';

const MOD_ROLE_IDS = [
    '1511816725535002745',
    '1519997209108676749',
    '1511473555756290280',
    '1512407722480500829'
];

module.exports = {
    // Le panneau avec le bouton "Créer un ticket"
    buildPanel() {
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('🎫 Support RoomVerse')
            .setDescription('Besoin d\'aide ? Clique sur le bouton ci-dessous pour ouvrir un ticket privé avec l\'équipe.');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('create_ticket')
                .setLabel('Créer un ticket')
                .setEmoji('📩')
                .setStyle(ButtonStyle.Primary)
        );

        return { embeds: [embed], components: [row] };
    },

    // Création du salon de ticket
    async createTicket(interaction) {
        const guild = interaction.guild;
        const user = interaction.user;

        // Vérifie si l'utilisateur a déjà un ticket ouvert
        const existing = guild.channels.cache.find(c => c.name === `ticket-${user.username.toLowerCase()}`);
        if (existing) {
            return interaction.reply({ content: `Tu as déjà un ticket ouvert : ${existing}`, ephemeral: true });
        }

        // Construction des permissions : everyone bloqué, l'auteur autorisé, + les 4 rôles modo autorisés
        const permissionOverwrites = [
            {
                id: guild.roles.everyone.id,
                deny: [PermissionFlagsBits.ViewChannel],
            },
            {
                id: user.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
            },
            ...MOD_ROLE_IDS.map(roleId => ({
                id: roleId,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
            }))
        ];

        const channel = await guild.channels.create({
            name: `ticket-${user.username}`,
            type: ChannelType.GuildText,
            parent: CATEGORY_ID,
            permissionOverwrites: permissionOverwrites,
        });

        const welcomeEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('🎫 Nouveau Ticket')
            .setDescription(`Bienvenue ${user}, un membre de l'équipe va te répondre bientôt.\nDécris ton problème ici.`)
            .setFooter({ text: `Ticket ouvert par ${user.tag}` });

        const closeRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Fermer le ticket')
                .setEmoji('🔒')
                .setStyle(ButtonStyle.Danger)
        );

        // Mentionne l'utilisateur + les 4 rôles modo
        const mentions = MOD_ROLE_IDS.map(id => `<@&${id}>`).join(' ');

        await channel.send({ content: `${user} ${mentions}`, embeds: [welcomeEmbed], components: [closeRow] });
        await interaction.reply({ content: `Ton ticket a été créé : ${channel}`, ephemeral: true });
    },

    // Fermeture du ticket
    async closeTicket(interaction) {
        await interaction.reply('🔒 Ce ticket va être fermé dans 5 secondes...');
        setTimeout(() => {
            interaction.channel.delete().catch(console.error);
        }, 5000);
    }
};