const { Client, Events, EmbedBuilder } = require('discord.js');
const mysql = require('mysql');
const cooldown = {};
module.exports = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction, client) {
        const db = mysql.createConnection({ host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PWD, database: process.env.DB_NAME });
        const command = client.commands.get(interaction.commandName);
        if (!command || !interaction.isChatInputCommand()) { return };
        if (cooldown[interaction.user.id] > Date.now()) { return interaction.reply({ content: 'Commands are subject to a 5 second cooldown ...', ephemeral: true }) }
        try {
            const queryAsync = (query, params) => {
                return new Promise((resolve, reject) => {
                    db.query(query, params, (err, results) => { if (err) return reject(err); resolve(results) });
                })
            };
            const results = await queryAsync(`SELECT * FROM player WHERE discord_id = ?`, [interaction.user.id]);
            if (results.length === 0) {
                await queryAsync(`INSERT INTO player (discord_id) VALUES (?)`, [interaction.user.id]);
                await queryAsync(`INSERT INTO player_inventory (discord_id) VALUES (?)`, [interaction.user.id]);
                await queryAsync(`INSERT INTO player_money (discord_id) VALUES (?)`, [interaction.user.id]);
                await queryAsync(`INSERT INTO player_options (discord_id) VALUES (?)`, [interaction.user.id]);
                await queryAsync(`INSERT INTO player_quests (discord_id) VALUES (?)`, [interaction.user.id]);
                await queryAsync(`INSERT INTO player_stats (discord_id) VALUES (?)`, [interaction.user.id]);
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
        } finally {
            db.end((err) => {if (err) console.error('Error ending the database connection:', err)});
        }
        cooldown[interaction.user.id] = Date.now() + 5000;
        setTimeout(() => { delete cooldown[interaction.user.id]}, 5000);
    },
};