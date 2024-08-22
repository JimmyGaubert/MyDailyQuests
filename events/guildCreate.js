import { Events } from 'discord.js';
import mysql from 'mysql';
const query = mysql?.db.query;

export default {
    name: Events.GuildCreate,
    async execute(guild) {
        const [ results ] = await query(`SELECT * FROM guild WHERE discord_id = ${guild.id}`);

        if (results.length === 0) {
            await query(`INSERT INTO guild (discord_id) VALUES ("${guild.id}")`);
        };
    },
};