const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const mysql = require('mysql');
const util = require('node:util');
module.exports = {
	data: new SlashCommandBuilder().setName('shop').setDescription('Display the shop for buying items')
		.addStringOption(option =>
			option.setName('item').setDescription('Name of the item to buy').setRequired(false)
				.addChoices(
					{ name: 'rope', value: 'rope' },
					{ name: 'bread', value: 'bread' },
					{ name: 'nugget', value: 'nugget' },
					{ name: 'key', value: 'chest_key' }
				)
		)
		.addIntegerOption(option =>
			option.setName('quantity').setDescription('Quantity of the item to buy').setRequired(false)
		),
	async execute(interaction) {
		const db = mysql.createConnection({ host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PWD, database: process.env.DB_NAME });
		const query = util.promisify(db.query).bind(db);
		const itemName = interaction.options.getString('item');
		const quantity = interaction.options.getInteger('quantity') || 1;
		const shopItems = [
			{ title: 'rope', price: 5, emoji: '🪢' },
			{ title: 'bread', price: 5, emoji: '\\🍞' },
			{ title: 'nugget', price: 5, emoji: '\\🍖' },
			{ title: 'chest_key', price: 5, emoji: '\\🗝️' }
		];
		try {
			if (!itemName) { await displayShopItems(interaction, shopItems) } else { await buyItem(interaction, itemName, quantity, shopItems, query) }
		} catch (err) {
			console.error(err);
			await interaction.reply('An error occurred while processing your request. Please contact the developer.');
		} finally {
			db.end();
		}
	},
};
async function displayShopItems(interaction, shopItems) {
	const embed = new EmbedBuilder().setColor('Gold').setTitle('Welcome to the Shop!').setImage('https://www.aht.li/3857673/shop_2.png');
	shopItems.forEach(item => {
		embed.addFields({ name: '\u200B', value: `${item.emoji} **${item.title}**\n${item.price} coins`, inline: true });
	});
	await interaction.reply({ embeds: [embed] });
};
async function buyItem(interaction, itemName, quantity, shopItems, query) {
	if (quantity <= 0) {
        await interaction.reply('You need to buy at least one item.');
        return;
    }
	const selectedItem = shopItems.find(item => item.title === itemName);
	if (!selectedItem) {
		await interaction.reply('Item not found in the shop.');
		return;
	}
	const userId = interaction.user.id;
	const playerMoney = await query(`SELECT coins FROM player_money WHERE discord_id = '${userId}'`);
	const currentCoins = parseInt(playerMoney[0].coins);
	const totalPrice = selectedItem.price * quantity;
	if (currentCoins < totalPrice) {
		await interaction.reply(`You don't have enough coins to buy ${quantity} ${selectedItem.title}(s).`);
		return;
	}
	const newCoins = currentCoins - totalPrice;
	await query(`UPDATE player_money SET coins = ${newCoins} WHERE discord_id = '${userId}'`);
	const playerInventory = await query(`SELECT * FROM player_inventory WHERE discord_id = '${userId}'`);
	if (!playerInventory.length) {
		await query(`INSERT INTO player_inventory (discord_id, ${selectedItem.title}) VALUES ('${userId}', '${quantity}')`);
	} else {
		await query(`UPDATE player_inventory SET ${selectedItem.title} = ${selectedItem.title} + ${quantity} WHERE discord_id = '${userId}'`);
	}
	await interaction.reply(`You have successfully bought ${quantity} ${selectedItem.title}(s) for ${totalPrice} coins.`);
};