const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mysql = require('mysql');
const util = require('node:util');
const fs = require('node:fs');
const path = require('node:path');
module.exports = {
	data: new SlashCommandBuilder().setName('me').setDescription('Display your player stats')
		.addStringOption(option => option.setName('leaderboard').setDescription('Be displayed on the leaderboard').setRequired(false)
		.addChoices({ name: 'yes', value: 'yes' }, { name: 'no', value: 'no' })
	),
	async execute(interaction) {
		const db = mysql.createConnection({ host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PWD, database: process.env.DB_NAME });
		const query = util.promisify(db.query).bind(db);
		const choice = interaction.options.getString('leaderboard');
		try {
			const statsName = `${interaction.user.username}'s stats`;
			const levelPointsPath = path.join(__dirname, '../json', 'level_points.json');
			const levelPoints = JSON.parse(fs.readFileSync(levelPointsPath, 'utf-8'));
			const playerStats = await query(`SELECT * FROM player_stats WHERE discord_id ='${interaction.user.id}'`);
			const playerOptions = await query(`SELECT * FROM player_Options WHERE discord_id ='${interaction.user.id}'`);
			const playerPoints = BigInt(playerStats[0].exp_points);
			let playerLevel = 1;
			for (const [level, points] of Object.entries(levelPoints)) { if (playerPoints >= BigInt(points)) { playerLevel = parseInt(level) } else { break } };
			console.log(choice)
			if (!choice) {
				const playerStatsEmbed = new EmbedBuilder().setColor("Gold").setFooter({ text: `${statsName}`, iconURL: `${interaction.user.displayAvatarURL()}` })
				.addFields(
					{ name: '\u200B', value: `**Exp points** \`${playerPoints}\`` },
					{ name: '\u200B', value: `**Level** \`${playerLevel}\`` },
					{ name: '\u200B', value: `**Quests done** \`${playerStats[0].quests_done}\`` },
					{ name: '\u200B', value: `**On Leaderboard** \`${playerOptions[0].player_on_lb === 'oui' ? 'yes' : 'no'}\`` },
					{ name: '\u200B', value: `\u200B` },
				);
				await interaction.reply({ embeds: [playerStatsEmbed] });
			} else {
				if (choice === 'yes') {
					await query(`UPDATE player_options SET player_on_lb = 'oui' WHERE discord_id = '${interaction.user.id}'`);
					await interaction.reply(`You're now... Displayed on the leaderboard!`);
				} else if (choice === 'no') {
					await query(`UPDATE player_options SET player_on_lb = 'non' WHERE discord_id = '${interaction.user.id}'`);
					await interaction.reply(`You're now... Not displayed on the leaderboard!`);
				}
			}
		} catch (err) {
			console.error(err); await interaction.reply('An error occurred while processing your request. Please contact the dev and provide screenshots.');
		} finally {
			db.end();
		};
	},
};