import { Events } from 'discord.js';
import { db } from 'mysql';

export default {
    name: Events.GuildMemberAdd,
    async execute(guild_member) {
        //console.log(guild_member)
        const [ results ] = await db.query(`SELECT * FROM player WHERE discord_id = ${guild_member.id}`);

        if (results.length === 0) {
            await db.query(`INSERT INTO player (discord_id) VALUES ("${guild_member.id}")`);
            await db.query(`INSERT INTO player_inventory (discord_id) VALUES ("${guild_member.id}")`);
            await db.query(`INSERT INTO player_money (discord_id) VALUES ("${guild_member.id}")`);
            await db.query(`INSERT INTO player_options (discord_id) VALUES ("${guild_member.id}")`);
            await db.query(`INSERT INTO player_quests (discord_id) VALUES ("${guild_member.id}")`);
            await db.query(`INSERT INTO player_stats (discord_id) VALUES ("${guild_member.id}")`);
            console.log('nouveau membre sur le serveur. joueur ajouté en base.');
        }
    },
};