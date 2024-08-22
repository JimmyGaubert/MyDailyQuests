import { Client, Events, EmbedBuilder } from 'discord.js';
import mysql from 'mysql';
const query = mysql?.db.query;

const cooldown = {};

export default {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction, client) {
        const command = client.commands.get(interaction.commandName);
        if (!command || !interaction.isChatInputCommand()) { return };
        if (cooldown[interaction.user.id] > Date.now()) { return interaction.reply({ content: 'Commands are subject to a 5 second cooldown ...', ephemeral: true }) }
        try {
            const [ results ] = await query(`SELECT * FROM player WHERE discord_id = ?`, [interaction.user.id]);
            if (results.length === 0) {
                await query(`INSERT INTO player (discord_id) VALUES (?)`, [interaction.user.id]);
                await query(`INSERT INTO player_inventory (discord_id) VALUES (?)`, [interaction.user.id]);
                await query(`INSERT INTO player_money (discord_id) VALUES (?)`, [interaction.user.id]);
                await query(`INSERT INTO player_options (discord_id) VALUES (?)`, [interaction.user.id]);
                await query(`INSERT INTO player_quests (discord_id) VALUES (?)`, [interaction.user.id]);
                await query(`INSERT INTO player_stats (discord_id) VALUES (?)`, [interaction.user.id]);
            }
            await command.execute(interaction, client);
            const logChannel = client.channels.cache.get(`${process.env.LOGS_CHANNEL}`);
            if (logChannel) {
                const embedLog = new EmbedBuilder().setColor('Gold').setTitle('Command Executed').setThumbnail(interaction.guild.iconURL())
                    .addFields(
                        { name: 'User', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                        { name: 'Guild', value: `${interaction.guild.name} (${interaction.guild.id})`, inline: true },
                        { name: 'Channel', value: `${interaction.channel.name} (${interaction.channel.id})`, inline: true }
                    );
                await logChannel.send({ embeds: [embedLog] });
            }
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command.', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command.', ephemeral: true });
            }
        }
        cooldown[interaction.user.id] = Date.now() + 5000;
        setTimeout(() => { delete cooldown[interaction.user.id]}, 5000);
    },
};