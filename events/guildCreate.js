const { Events } = require('discord.js');
const mysql = require('mysql');
module.exports = {
    name: Events.GuildCreate,
    execute(guild) {
        const db = mysql.createConnection({host:`${process.env.DB_HOST}`,user:`${process.env.DB_USER}`,password:`${process.env.DB_PWD}`,database:`${process.env.DB_NAME}`});
        db.query(`SELECT * FROM guild WHERE discord_id = ${guild.id}`, (err, results) => {
            if (err) { throw err };
            if (results.length === 0) {
                db.query(`INSERT INTO guild (discord_id) VALUES ("${guild.id}")`, err => {
                    if (err) { throw err };
                    db.end();
                });
            };
        });
    },
};