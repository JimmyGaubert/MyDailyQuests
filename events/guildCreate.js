import { Events } from 'discord.js';
import { db } from 'mysql';

export default {
    name: Events.GuildCreate,
    async execute(guild) {
        const [ results ] = await db.query(`SELECT * FROM guild WHERE discord_id = ${guild.id}`);

        if (results.length === 0) {
            await db.query(`INSERT INTO guild (discord_id) VALUES ("${guild.id}")`);
        };
    },
};