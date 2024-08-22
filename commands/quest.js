import { SlashCommandBuilder, EmbedBuilder } from 'discord.js'; //Client, GatewayIntentBits, Partials, ButtonBuilder, ActionRowBuilder
import { db } from 'mysql';

export default {
	data: new SlashCommandBuilder().setName('quest').setDescription('The quest board!').addStringOption(option => option.setName('choice').setDescription('Choose a quest!')
		.setRequired(false).addChoices({ name: '1', value: '1' }, { name: '2', value: '2' }, { name: '3', value: '3' }, { name: '4', value: '4' }, { name: '5', value: '5' })
	),
	async execute(interaction) {
		const choice = interaction.options.getString('choice');
		try {
			const [ dailyQuestsResults ] = await db.query(`SELECT quest_id FROM daily_quests`);
			const [ allQuestsResults ] = await db.query(`SELECT * FROM all_quests`);
			let questIds = dailyQuestsResults.map(result => parseInt(result.quest_id));
			let dailyQuests = allQuestsResults.filter(quest => questIds.includes(parseInt(quest.id)));
			const fidelityQuests = [
				{ id: 'x', title_en: 'Spread joy!', description_en: 'Spread the joy of having such an awesome bot and receive a reward.', quest_type: 'fidelity', rewards: '1x0', required_item: '0', exp_given: '2', img: 'https://www.aht.li/3857025/quest_x.png', done_img: 'https://www.aht.li/3857051/done_x.png' },
				{ id: '0', title_en: 'Join us...', description_en: 'Join good people and keep up to date with the latest bot updates.', quest_type: 'fidelity', rewards: '1x0', required_item: '0', exp_given: '2', img: 'https://www.aht.li/3857026/quest_0.png', done_img: 'https://www.aht.li/3857060/done_0.png' }
			];
			dailyQuests = dailyQuests.concat(fidelityQuests);
			if (!choice) {
				await displayQuestBoard(interaction, dailyQuests);
			} else {
				let quest = dailyQuests[parseInt(choice) - 1];
				if (quest) {
					switch (quest.quest_type) {
						case 'item':
							await handleItemQuest(interaction, quest, choice);
							break;
						case 'special':
							await handleSpecialQuest(interaction, quest, choice);
							break;
						case '20_percent':
							await handle20PercentQuest(interaction, quest, choice);
							break;
						case 'fidelity':
							await handleFidelityQuest(interaction, quest, choice);
							break;
						default:
							await interaction.reply('Unknown quest type. Please contact the dev and provide screenshots.');
					}
				} else {
					await interaction.reply('Quest not found. Please contact the dev and provide screenshots.');
				}
			}
		} catch (err) {
			console.error(err);
			await interaction.reply('An error occurred while processing your request. Please contact the dev and provide screenshots.');
		}
	},
};
async function displayQuestBoard(interaction, quests, choice) {
	const userId = interaction.user.id;
	const [ playerQuestsResults ] = await db.query(`SELECT * FROM player_quests WHERE discord_id = '${userId}'`);
	const nowEpochInSeconds = ~~(new Date().getTime() / 1000);
	const embedsArray = [];
	for (let i = 0; i < quests.length; i++) {
		const quest = quests[i];
		let itemDescription = '';
		if (quest.required_item !== '0') {
			const [ itemResults ] = await db.query(`SELECT title_en FROM item WHERE id = '${quest.required_item}'`);
			const requiredItemName = itemResults.length > 0 ? itemResults[0].title_en : 'Unknown Item';
			itemDescription = `Required Item: \`${requiredItemName}\``;
		}
		let questCommand = `Quest command: \`/quest ${i+1}\``;
		console.log(playerQuestsResults[0]['quest_' + (i + 1)])
		embedsArray.push(
			new EmbedBuilder()
				.setColor("Gold")
				.setAuthor({ name: `${quests[i].title_en}` })
				.setDescription(`${quests[i].description_en} \n\n\nQuest available: \`${parseInt(playerQuestsResults[0]['quest_' + (i + 1)]) <= nowEpochInSeconds}\`\n\n${questCommand}\n\n${itemDescription}`/***/)
				.setImage(`${quests[i].img}`)
				.setFooter({ text: `Page ${i + 1}/5` })
		);
	}
	let x = 0;
	let msg = await interaction.reply({ embeds: [embedsArray[x]], fetchReply: true });
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
}
async function handleItemQuest(interaction, quest, choice) {
	const userId = interaction.user.id;
	const [ playerQuestsResults ] = await db.query(`SELECT * FROM player_quests WHERE discord_id = '${userId}'`);
	const nowEpochInSeconds = ~~(new Date().getTime() / 1000);
	const midnight = new Date();
	midnight.setHours(24, 0, 0, 0);
	const midnightEpochInSeconds = ~~(midnight.getTime() / 1000);
	const questSlot = `quest_${quest.id}`;
	const playerQuestSlot=`quest_${choice}`
	if (playerQuestsResults[0][questSlot] === undefined) { await interaction.reply(`Sorry, the quest slot ${playerQuestSlot} does not exist for this player.`); return; }
	if (parseInt(playerQuestsResults[0][playerQuestSlot]) <= nowEpochInSeconds) {
		const [ itemResults ] = await db.query(`SELECT * FROM item WHERE id = '${quest.required_item}'`);
		const [ rewardResults ] = await db.query(`SELECT * FROM item WHERE id = '${quest.rewards.split('x')[1]}'`);
		const [ playerInventoryResults ] = await db.query(`SELECT * FROM player_inventory WHERE discord_id = '${userId}'`);
		const item = itemResults[0].title_en;
		const reward = rewardResults[0].title_en;
		const reward_id = parseInt(rewardResults[0].id);
		const numberOfItemToReward = parseInt(quest.rewards.split('x')[0]);
		if ((parseInt(playerInventoryResults[0][item]) >= 1 && parseInt(quest.required_item) != 0) || parseInt(quest.required_item) == 0) {
			await db.query(`UPDATE player_quests SET ${playerQuestSlot} = '${midnightEpochInSeconds}' WHERE discord_id = '${userId}'`);
			if (parseInt(quest.required_item) != 0) { await db.query(`UPDATE player_inventory SET ${item} = ${parseInt(playerInventoryResults[0][item]) - 1} WHERE discord_id = '${userId}'`) }
			if (reward_id != 0) { await db.query(`UPDATE player_inventory SET ${reward} = ${parseInt(playerInventoryResults[0][reward]) + numberOfItemToReward} WHERE discord_id = '${userId}'`) }
			await db.query(`UPDATE player_money SET coins = coins + 1 WHERE discord_id = '${userId}'`);
			await db.query(`UPDATE player_stats SET exp_points = exp_points + 1, guild_points = guild_points + 1, quests_done = quests_done + 1 WHERE discord_id = '${userId}'`);
			await db.query(`UPDATE guild SET total_guild_points = total_guild_points + 1 WHERE discord_id = '${interaction.guildId}'`);
			const embedRewards = new EmbedBuilder()
				.setColor("Gold")
				.setDescription(`Quest completed! ${item === "void" ? '' : `${item} -1, `}${reward === 'void' ? '' : `${reward} +${numberOfItemToReward}, `}coin +1, exp +1, gp +1 !`)
				.setImage(`${quest.done_img}`)
			await interaction.reply({ embeds: [embedRewards] });
		} else {
			await interaction.reply({ content: `Sorry, you need at least 1 ${item} to complete this quest`, ephemeral: true });
		}
	} else {
		await interaction.reply({ content: `Sorry, you have already completed this quest today`, ephemeral: true });
	}
}
async function handleSpecialQuest(interaction, quest, choice) {
	const userId = interaction.user.id;
	const specialItems = ['chest_key', 'bread', 'nugget', 'rope'];
	const randomItem = specialItems[Math.floor(Math.random() * specialItems.length)];
	const [ playerInventoryResults ] = await db.query(`SELECT * FROM player_inventory WHERE discord_id = '${userId}'`);
	const [ itemResults ] = await db.query(`SELECT * FROM item WHERE title_en = '${randomItem}'`);
	const itemId = parseInt(itemResults[0].id);
	const [ playerQuestsResults ] = await db.query(`SELECT * FROM player_quests WHERE discord_id = '${userId}'`);
	let questSlotNumber = interaction.options.getString('choice');
	const questSlot = `quest_${questSlotNumber}`;
	const lastCompletionTime = parseInt(playerQuestsResults[0][questSlot]);
	const nowEpochInSeconds = ~~(new Date().getTime() / 1000);
	const midnight = new Date();
	midnight.setHours(24, 0, 0, 0);
	const midnightEpochInSeconds = ~~(midnight.getTime() / 1000);
	if (lastCompletionTime && lastCompletionTime >= nowEpochInSeconds) { await interaction.reply({ content: `Sorry, you have already completed this quest today.`, ephemeral: true }); return }
	if (itemId !== undefined) {
		await db.query(`UPDATE player_inventory SET ${randomItem} = ${parseInt(playerInventoryResults[0][randomItem]) + 1} WHERE discord_id = '${userId}'`);
		await db.query(`UPDATE player_money SET coins = coins + 1 WHERE discord_id = '${userId}'`);
		await db.query(`UPDATE player_stats SET exp_points = exp_points + 1, guild_points = guild_points + 1, quests_done = quests_done + 1 WHERE discord_id = '${userId}'`);
		await db.query(`UPDATE guild SET total_guild_points = total_guild_points + 1 WHERE discord_id = '${interaction.guildId}'`);
		await db.query(`UPDATE player_quests SET ${questSlot} = '${midnightEpochInSeconds}' WHERE discord_id = '${userId}'`);
		const embedRewards = new EmbedBuilder()
			.setColor("Gold")
			.setDescription(`Quest completed! ${randomItem} +1, coin +1, exp +1, gp +1 !`)
			.setImage(`${quest.done_img}`)
		await interaction.reply({ embeds: [embedRewards] });
	} else {
		await interaction.reply({ content: `An error occurred while processing your quest. Please contact the dev and provide screenshots.`, ephemeral: true });
	}
}
async function handle20PercentQuest(interaction, quest) {
	const userId = interaction.user.id;
	const [ playerMoneyResults ] = await db.query(`SELECT coins FROM player_money WHERE discord_id = '${userId}'`);
	const [ playerQuestsResults ] = await db.query(`SELECT * FROM player_quests WHERE discord_id = '${userId}'`);
	if (playerMoneyResults.length === 0 || playerQuestsResults.length === 0) {
		await interaction.reply({ content: `An error occurred: Player data not found. Please contact the dev and provide screenshots.`, ephemeral: true }); return;
	};
	const currentCoins = parseInt(playerMoneyResults[0].coins);
	const nowEpochInSeconds = ~~(new Date().getTime() / 1000);
	const midnight = new Date();
	midnight.setHours(24, 0, 0, 0);
	const midnightEpochInSeconds = ~~(midnight.getTime() / 1000);
	let questSlotNumber = interaction.options.getString('choice');
	const questSlot = `quest_${questSlotNumber}`;
	const lastCompletionTime = parseInt(playerQuestsResults[0][questSlot]);
	if (lastCompletionTime && lastCompletionTime >= nowEpochInSeconds) { await interaction.reply({ content: `Sorry, you have already completed this quest today.`, ephemeral: true }); return }
	const isWinner = Math.random() < 0.2;
	if (isWinner) {
		const newCoins = currentCoins + 10;
		await db.query(`UPDATE player_money SET coins = ${newCoins > 0 ? newCoins : 0} WHERE discord_id = '${userId}'`);
		await db.query(`UPDATE player_stats SET exp_points = exp_points + ${quest.exp_given}, guild_points = guild_points + 1, quests_done = quests_done + 1 WHERE discord_id = '${userId}'`);
		await db.query(`UPDATE guild SET total_guild_points = total_guild_points + 1 WHERE discord_id = '${interaction.guildId}'`);
		await db.query(`UPDATE player_quests SET ${questSlot} = '${midnightEpochInSeconds}' WHERE discord_id = '${userId}'`);
		const embedRewards = new EmbedBuilder()
			.setColor("Gold")
			.setDescription(`Congratulations! You won the quest and earned 10 coins. Your new balance is ${newCoins > 0 ? newCoins : 0} coins. exp +${quest.exp_given}, gp +1 !`)
			.setImage(`${quest.done_img}`)
		await interaction.reply({ embeds: [embedRewards] });
	} else {
		const coinsLost = Math.min(currentCoins, 5);
		const newCoins = currentCoins - coinsLost;
		await db.query(`UPDATE player_money SET coins = ${newCoins > 0 ? newCoins : 0} WHERE discord_id = '${userId}'`);
		await db.query(`UPDATE player_stats SET exp_points = exp_points + ${quest.exp_given}, guild_points = guild_points + 1, quests_done = quests_done + 1 WHERE discord_id = '${userId}'`);
		await db.query(`UPDATE guild SET total_guild_points = total_guild_points + 1 WHERE discord_id = '${interaction.guildId}'`);
		await db.query(`UPDATE player_quests SET ${questSlot} = '${midnightEpochInSeconds}' WHERE discord_id = '${userId}'`);
		await interaction.reply(`Sorry, you lost the quest and lost ${coinsLost} coins. Your new balance is ${newCoins > 0 ? newCoins : 0} coins. exp +${quest.exp_given}, gp +1 !`);
	}
}
async function handleFidelityQuest(interaction, quest, choice) {
	const userId = interaction.user.id;
	if (quest.id === 'x') {
		if (parseInt(interaction.guildId) == 1250459005076377711) {
			await interaction.reply({ content: `Sorry, this quest must be done out of the bot server.`, ephemeral: true });
		} else {
			await completeFidelityQuest(interaction, quest, userId, choice);
		}
	} else if (quest.id === '0') {
		if (parseInt(interaction.guildId) != 1250459005076377711) {
			await interaction.reply(`Sorry, this quest must be done on the bot server: https://discord.gg/SM5dePqdug`);
		} else {
			await completeFidelityQuest(interaction, quest, userId, choice);
		}
	} else {
		await interaction.reply({ content: `Quest is not yet implemented`, ephemeral: true });
	}
}
async function completeFidelityQuest(interaction, quest, userId, choice) {
	const [ playerQuestsResults ] = await db.query(`SELECT * FROM player_quests WHERE discord_id = '${userId}'`);
	const nowEpochInSeconds = ~~(new Date().getTime() / 1000);
	const midnight = new Date();
	midnight.setHours(24, 0, 0, 0);
	const midnightEpochInSeconds = ~~(midnight.getTime() / 1000);
	const questSlot = `quest_${(choice)}`;
	if (playerQuestsResults[0][questSlot] === undefined || parseInt(playerQuestsResults[0][questSlot]) < nowEpochInSeconds) {
		await db.query(`UPDATE player_quests SET ${questSlot} = '${midnightEpochInSeconds}' WHERE discord_id = '${userId}'`);
		await db.query(`UPDATE player_money SET coins = coins + 2 WHERE discord_id = '${userId}'`);
		await db.query(`UPDATE player_stats SET exp_points = exp_points + 1, guild_points = guild_points + 1, quests_done = quests_done + 1 WHERE discord_id = '${userId}'`);
		await db.query(`UPDATE guild SET total_guild_points = total_guild_points + 1 WHERE discord_id = '${interaction.guildId}'`);
		let embedRewards = new EmbedBuilder()
			.setColor("Gold")
			.setImage(`${quest.done_img}`)
			.setDescription(`Quest completed! You received 2 coins, exp +1, gp +1 !`)
		await interaction.reply({ embeds: [embedRewards] });
		if (choice === '4') { await interaction.channel.send('https://discord.gg/SM5dePqdug\n\nhttps://discord.com/oauth2/authorize?client_id=1250451012381311047') }
	} else {
		await interaction.reply({ content: `Sorry, you have already completed this quest today`, ephemeral: true });
	}
}