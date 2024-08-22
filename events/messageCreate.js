import { Events } from 'discord.js';
import { db } from 'mysql';

export default {
    name: Events.MessageCreate,
    once: false,
    async execute(message) {
        try {
            const [ results ] = await db.query(`SELECT * FROM player WHERE discord_id = ?`, [message.author.id]);

            if (results.length === 0) {
                await db.query(`INSERT INTO player (discord_id) VALUES (?)`, [message.author.id]);
                await db.query(`INSERT INTO player_inventory (discord_id) VALUES (?)`, [message.author.id]);
                await db.query(`INSERT INTO player_money (discord_id) VALUES (?)`, [message.author.id]);
                await db.query(`INSERT INTO player_options (discord_id) VALUES (?)`, [message.author.id]);
                await db.query(`INSERT INTO player_quests (discord_id) VALUES (?)`, [message.author.id]);
                await db.query(`INSERT INTO player_stats (discord_id) VALUES (?)`, [message.author.id]);
            }

        } catch (error) {
            console.error(error);
        }
    },
};

