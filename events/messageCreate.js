const { Events } = require('discord.js');
const mysql = require('mysql');

module.exports = {
    name: Events.MessageCreate,
    once: false,
    async execute(message) {
        const db = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PWD,
            database: process.env.DB_NAME
        });

        try {
            const queryAsync = (query, params) => {
                return new Promise((resolve, reject) => {
                    db.query(query, params, (err, results) => {
                        if (err) return reject(err);
                        resolve(results);
                    });
                });
            };

            const results = await queryAsync(`SELECT * FROM player WHERE discord_id = ?`, [message.author.id]);

            if (results.length === 0) {
                await queryAsync(`INSERT INTO player (discord_id) VALUES (?)`, [message.author.id]);
                await queryAsync(`INSERT INTO player_inventory (discord_id) VALUES (?)`, [message.author.id]);
                await queryAsync(`INSERT INTO player_money (discord_id) VALUES (?)`, [message.author.id]);
                await queryAsync(`INSERT INTO player_options (discord_id) VALUES (?)`, [message.author.id]);
                await queryAsync(`INSERT INTO player_quests (discord_id) VALUES (?)`, [message.author.id]);
                await queryAsync(`INSERT INTO player_stats (discord_id) VALUES (?)`, [message.author.id]);
            }

        } catch (error) {
            console.error(error);
        } finally {
            db.end((err) => {
                if (err) console.error('Error ending the database connection:', err);
            });
        }
    },
};