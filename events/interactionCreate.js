const { Client, Events } = require('discord.js');
const mysql = require('mysql');
const obj = {};
module.exports = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction, client) {
        const db = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PWD,
            database: process.env.DB_NAME
        });
        if (!interaction.isChatInputCommand()) return;
        const command = client.commands.get(interaction.commandName);
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }
        if (obj[interaction.user.id] > Date.now()) {
            console.log('a');
            return interaction.reply({
                content: 'Commands are subject to a 5 second cooldown ...',
                ephemeral: true
            });
        }
        try {
            const queryAsync = (query, params) => {
                return new Promise((resolve, reject) => {
                    db.query(query, params, (err, results) => {
                        if (err) return reject(err);
                        resolve(results);
                    });
                });
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
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: 'There was an error while executing this command.',
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: 'There was an error while executing this command.',
                    ephemeral: true
                });
            }
        } finally {
            db.end((err) => {
                if (err) console.error('Error ending the database connection:', err);
            });
        }
        obj[interaction.user.id] = Date.now() + 5000;
        setTimeout(() => {
            delete obj[interaction.user.id];
        }, 5000);
    },
};


// const { Client, Events } = require('discord.js');
// const mysql = require('mysql');
// const obj = {};
// module.exports = {
//     name: Events.InteractionCreate,
//     once: false,
//     async execute(interaction, client) {
//         const db = mysql.createConnection({ host: `${process.env.DB_HOST}`, user: `${process.env.DB_USER}`, password: `${process.env.DB_PWD}`, database: `${process.env.DB_NAME}` });
//         if (!interaction.isChatInputCommand()) return;
//         const command = client.commands.get(interaction.commandName);
//         if (!command) { console.error(`No command matching ${interaction.commandName} was found.`); return; }
//         if (obj[interaction.user.id] > Date.now()) { console.log('a'); return interaction.reply({ content: 'Commands are subject to a 5 second cooldown ...', ephemeral: true }) };
//         try {
//             db.query(`SELECT * FROM player WHERE discord_id = ${interaction.user.id}`, async (err, results) => {
//                 if (err) { throw err };
//                 if (results.length === 0) {
//                     db.query(`INSERT INTO player (discord_id) VALUES ("${interaction.user.id}")`, async (err) => {
//                         if (err) { throw err };
//                         db.query(`INSERT INTO player_inventory (discord_id) VALUES ("${interaction.user.id}")`, async (err) => {
//                             if (err) { throw err };
//                             db.query(`INSERT INTO player_money (discord_id) VALUES ("${interaction.user.id}")`, async (err) => {
//                                 if (err) { throw err };
//                                 db.query(`INSERT INTO player_options (discord_id) VALUES ("${interaction.user.id}")`, async (err) => {
//                                     if (err) { throw err };
//                                     db.query(`INSERT INTO player_quests (discord_id) VALUES ("${interaction.user.id}")`, async (err) => {
//                                         if (err) { throw err };
//                                         db.query(`INSERT INTO player_stats (discord_id) VALUES ("${interaction.user.id}")`, async (err) => {
//                                             if (err) { throw err };
//                                             db.end();
//                                             await command.execute(interaction);
//                                         });
//                                     });
//                                 });
//                             });
//                         });
//                     });
//                 } else {
//                     db.end();
//                     await command.execute(interaction);
//                 }
//             });
//         } catch (error) {
//             console.error(error);
//             if (interaction.replied || interaction.deferred) {
//                 await interaction.followUp({ content: 'There was an error while executing this command.', ephemeral: true });
//             } else {
//                 await interaction.reply({ content: 'There was an error while executing this command.', ephemeral: true });
//             }
//         }
//         obj[interaction.user.id] = Date.now() + 5000;
//         const UwU = setTimeout(() => { delete obj[interaction.user.id] }, 5000);
//         //setInterval(() => { db.query('SELECT 1', (err) => { err && console.error(err) }) }, 29000);
//     },
// };