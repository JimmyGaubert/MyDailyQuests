const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Bot info and commands'),
	async execute(interaction) {
		const helpEmbeds = [
			new EmbedBuilder()
				.setColor("Gold")
				.setAuthor({ name: `Introducing MyDailyQuests` })
				.setDescription(`This bot offers rotating daily quests. Each quest yields various rewards, including items, coins, experience and guild points.\n\nThe best players who wish can find themselves publicly displayed on the bot leaderboard. Are you ready to get on the podium?\n\nMyDailyQuests also contains a shop, where you can obtain items necessary to complete quests.\n\nEnjoy!`)
				.setImage(`https://www.aht.li/3857013/help.png`)
				.setFooter({ text: `Page 1/3` }),
			new EmbedBuilder()
				.setColor("Gold")
				.setAuthor({ name: `Commands` })
				.setDescription(`\`/help \` - Display bot informations\n\n\`/quest\` - Display the daily quests\n\n\`/quest <number>\` - Allows you to complete a quest\n\n\`/bag\` - Display your inventory\n\n\`/me\` - Display your player profile\n\n\`/shop\` - Display the shop\n\n\`/lb\` - Display the Leaderboard\n\n\`/ping\` - Display the bot ping\n\n\`/admin\` - A mysterious admin restricted command`)
				.setImage(`https://www.aht.li/3857013/help.png`)
				.setFooter({ text: `Page 2/3` }),
			new EmbedBuilder()
				.setColor("Gold")
				.setAuthor({ name: `Credits` })
				.setDescription(`**Bot owner:** earlam\n\n**Thanks to:** quantum_rage, zommbiebro, lunchiro, whayn\\_, darkecnelis, draconictail...`)
				.setImage(`https://www.aht.li/3857013/help.png`)
				.setFooter({ text: `Page 3/3` }),
		];
		let x = 0;
		let msg = await interaction.reply({ embeds: [helpEmbeds[x]], fetchReply: true });
		await msg.react('1254191697584459938');
		await msg.react('1254191699094409368');
		const filter = (reaction, user) => ['1254191697584459938', '1254191699094409368'].includes(reaction.emoji.id) && user.id === interaction.user.id;
		const collector = msg.createReactionCollector({ filter, time: 5 * 60 * 1000 });
		collector.on('collect', (reaction, user) => {
			if (user.bot) return;
			switch (reaction.emoji.id) {
				case '1254191697584459938':
					if (!helpEmbeds[x - 1]) return reaction.users.remove(user.id).catch(() => { });
					msg.edit({ embeds: [helpEmbeds[--x]] }).catch(() => { });
					reaction.users.remove(user.id).catch(() => { });
					break;
				case '1254191699094409368':
					if (!helpEmbeds[x + 1]) return reaction.users.remove(user.id).catch(() => { });
					msg.edit({ embeds: [helpEmbeds[++x]] }).catch(() => { });
					reaction.users.remove(user.id).catch(() => { });
					break;
			}
		});
		collector.on('end', () => msg.reactions.removeAll().catch(() => { }));
	},
};