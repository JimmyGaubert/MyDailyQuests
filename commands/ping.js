import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with the bot\'s ping!'),
    async execute(interaction) {
        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
        const ping = sent.createdTimestamp - interaction.createdTimestamp;
        return await interaction.editReply(`Pong! Latency is ${ping}ms. API Latency is ${Math.round(interaction.client.ws.ping)}ms`);
    },
};