const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mysql = require('mysql');
const util = require('node:util');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('lb')
		.setDescription('Display the leaderboard'),
	async execute(interaction) {
		const db = mysql.createConnection({ host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PWD, database: process.env.DB_NAME });
		const query = util.promisify(db.query).bind(db);
		try {
			const lbExpPoints = await query(`SELECT * FROM player_stats ps INNER JOIN player_options po ON ps.discord_id = po.discord_id WHERE po.player_on_lb = 'oui' ORDER BY CAST(ps.exp_points AS SIGNED) DESC`);
			const lbQuestsDone = await query(`SELECT * FROM player_stats ps INNER JOIN player_options po ON ps.discord_id = po.discord_id WHERE po.player_on_lb = 'oui' ORDER BY CAST(ps.quests_done AS SIGNED) DESC`);
			const lbCoins = await query(`SELECT * FROM player_money pm INNER JOIN player_options po ON pm.discord_id = po.discord_id WHERE po.player_on_lb = 'oui' ORDER BY CAST(pm.coins AS SIGNED) DESC`);
			const lbGuilds = await query(`SELECT * FROM guild WHERE guild_on_lb='oui' ORDER BY CAST(total_guild_points AS SIGNED) DESC `);
			const topExpPoints = lbExpPoints.slice(0, 20);
			const topQuestsDone = lbQuestsDone.slice(0, 20);
			const topCoins = lbCoins.slice(0, 20);
			const topGuilds = lbGuilds.slice(0, 20);
			const userIds = [...new Set([...topExpPoints.map(e => e.discord_id), ...topQuestsDone.map(e => e.discord_id), ...topCoins.map(e => e.discord_id)])];
			const guildIds = [...new Set([...topGuilds.map(e => e.discord_id)])];
			let userMap = new Map(), guildMap = new Map();
			for (const id of userIds) {
				const user = await interaction.client.users.fetch(id).catch(() => null);
				const username = user?.username || `Unknown User (${id})`;
				userMap.set(id, username);
			}
			for (const id of guildIds) {
				const guild = await interaction.client.guilds.fetch(id).catch(() => null);
				const guildname = guild?.name || `Unknown Guild (${id})`;
				guildMap.set(id, guildname);
			}
			const fieldExp = topExpPoints.map((e, i) => ({ name: '\u200B', value: `**${i + 1}.** ${userMap.get(e.discord_id)} ** ** \`${e.exp_points}\`` }));
			const fieldQuests = topQuestsDone.map((e, i) => ({ name: '\u200B', value: `**${i + 1}.** ${userMap.get(e.discord_id)} ** ** \`${e.quests_done}\`` }));
			const fieldCoins = topCoins.map((e, i) => ({ name: '\u200B', value: `**${i + 1}.** ${userMap.get(e.discord_id)} ** ** \`${e.coins}\`` }));
			const fieldGuilds = topGuilds.map((e, i) => ({ name: '\u200B', value: `**${i + 1}.** ${guildMap.get(e.discord_id)} ** ** \`${e.total_guild_points}\`` }))
			const embedsArray = [
				new EmbedBuilder()
					.setColor("Gold")
					.setAuthor({ name: `Experience` })
					.setImage(`https://www.aht.li/3857032/leaderboard.png`)
					.setFooter({ text: `Leaderboard (Page 1/4)` })
					.addFields(fieldExp),
				new EmbedBuilder()
					.setColor("Gold")
					.setAuthor({ name: `Quests done` })
					.setImage(`https://www.aht.li/3857032/leaderboard.png`)
					.setFooter({ text: `Leaderboard (Page 2/4)` })
					.addFields(fieldQuests),
				new EmbedBuilder()
					.setColor("Gold")
					.setAuthor({ name: `Coins` })
					.setImage(`https://www.aht.li/3857032/leaderboard.png`)
					.setFooter({ text: `Leaderboard (Page 3/4)` })
					.addFields(fieldCoins),
				new EmbedBuilder()
					.setColor("Gold")
					.setAuthor({ name: `Guilds points` })
					.setImage(`https://www.aht.li/3857032/leaderboard.png`)
					.setFooter({ text: `Leaderboard (Page 4/4)` })
					.addFields(fieldGuilds),

			]
			let x = 0;
			const msg = await interaction.reply({ embeds: [embedsArray[x]], fetchReply: true });
			await msg.react('1254191697584459938');
			await msg.react('1254191699094409368');
			const filter = (reaction, user) => ['1254191697584459938', '1254191699094409368'].includes(reaction.emoji.id) && user.id === interaction.user.id;
			const collector = msg.createReactionCollector({ filter, time: 5 * 60 * 1000 });
			collector.on('collect', (reaction, user) => {
				if (user.bot) return;
				switch (reaction.emoji.id) {
					case '1254191697584459938':
						if (!embedsArray[x - 1]) return reaction.users.remove(user.id).catch(() => { });
						msg.edit({ embeds: [embedsArray[--x]] }).catch(() => { });
						reaction.users.remove(user.id).catch(() => { });
						break;
					case '1254191699094409368':
						if (!embedsArray[x + 1]) return reaction.users.remove(user.id).catch(() => { });
						msg.edit({ embeds: [embedsArray[++x]] }).catch(() => { });
						reaction.users.remove(user.id).catch(() => { });
						break;
				}
			});
			collector.on('end', () => msg.reactions.removeAll().catch(() => { }));
		} catch (err) {
			console.error(err); await interaction.reply('An error occurred while processing your request. Please contact the dev and provide screenshots.');
		} finally {
			db.end();
		}
	},
};