const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mysql = require('mysql');
const util = require('node:util');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('bag')
		.setDescription('Display your player inventory'),
	async execute(interaction) {
		const db = mysql.createConnection({ host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PWD, database: process.env.DB_NAME });
		const query = util.promisify(db.query).bind(db);
		const inventoryName = `${interaction.user.username}'s inventory`
		try {
			const playerInventory = await query(`SELECT * FROM player_inventory WHERE discord_id ='${interaction.user.id}'`);
			const playerInventoryEmbed = new EmbedBuilder().setColor("Gold").setFooter({text:`${inventoryName}`}).setImage(`https://www.aht.li/3857014/bag.png`)
				.addFields(
					{ name: '\u200B', value: '\u200B' },
					{ name: '\u200B', value: `<:keyy:1256230191056027720> **key** \`${playerInventory[0].chest_key.padEnd(3, ' ')}\``, inline: true },
					{ name: '\u200B', value: `<:breadd:1256230197771108406> **bread** \`${playerInventory[0].bread.padEnd(3, ' ')}\``, inline: true },
					{ name: '\u200B', value: `<:ropee:1256230189872971846> **rope** \`${playerInventory[0].rope.padEnd(3, ' ')}\``, inline: true },
					{ name: '\u200B', value: '\u200B' },
					{ name: '\u200B', value: `<:nuggett:1256230187964825673> **nugget** \`${playerInventory[0].nugget.padEnd(3, ' ')}\``, inline: true },
					{ name: '\u200B', value: '\u200B' },
				);
			await interaction.reply({embeds: [playerInventoryEmbed]})
		} catch (err) {
			console.error(err);await interaction.reply('An error occurred while processing your request. Please contact the dev and provide screenshots.');
		} finally {
			db.end();
		}
	},
};