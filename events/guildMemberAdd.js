const { Events } = require('discord.js');
const mysql = require('mysql');
module.exports = {
    name: Events.GuildMemberAdd,
    execute(guild_member) {
        //console.log(guild_member)
        const db = mysql.createConnection({host:`${process.env.DB_HOST}`,user:`${process.env.DB_USER}`,password:`${process.env.DB_PWD}`,database:`${process.env.DB_NAME}`});
        db.query(`SELECT * FROM player WHERE discord_id = ${guild_member.id}`, (err, results) => {
            if (err) { throw err };
            if (results.length === 0) {
                db.query(`INSERT INTO player (discord_id) VALUES ("${guild_member.id}")`, err => {
                    if (err) { throw err };
                    db.query(`INSERT INTO player_inventory (discord_id) VALUES ("${guild_member.id}")`, err => {
                        if (err) { throw err };
                        db.query(`INSERT INTO player_money (discord_id) VALUES ("${guild_member.id}")`, err => {
                            if (err) { throw err };
                            db.query(`INSERT INTO player_options (discord_id) VALUES ("${guild_member.id}")`, err => {
                                if (err) { throw err };
                                db.query(`INSERT INTO player_quests (discord_id) VALUES ("${guild_member.id}")`, err => {
                                    if (err) { throw err };
                                    db.query(`INSERT INTO player_stats (discord_id) VALUES ("${guild_member.id}")`, err => {
                                        if (err) { throw err };
                                        console.log('nouveau membre sur le serveur. joueur ajouté en base.')
                                        db.end();
                                    });
                                });
                            });
                        });
                    });
                });
            };
        });
    },
};