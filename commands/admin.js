import { SlashCommandBuilder } from 'discord.js';
import mysql from 'mysql';
const query = mysql?.db.query;

const command_desc = 'A mysterious command. Restricted to GameMasters.';

export default {
    data: new SlashCommandBuilder().setName('admin').setDescription(`${command_desc}`)
        .addSubcommand(subcommand => subcommand.setName('cheat')
            .setDescription(`${command_desc}`).addStringOption(option => option.setName('cheatcode')
                .setDescription(`${command_desc}`).setRequired(true).addChoices(
                    { name: 'make me rich', value: 'makemerich' },
                    { name: 'make me strong', value: 'makemestrong' },
                    { name: 'reset my quests', value: 'resetmyquests' },
                    { name: 'reset my profile', value: 'resetmyprofile' }
                )
            )
        )
        .addSubcommand(subcommand => subcommand.setName('event')
            .setDescription(`${command_desc}`).addStringOption(option => option.setName('eventcode')
                .setDescription(`${command_desc}`).setRequired(true).addChoices(
                    { name: 'double coins enable', value: 'doublecoins_enable' },
                    { name: 'double coins disable', value: 'doublecoins_disable' },
                    { name: 'double pex enable', value: 'doublepex_enable' },
                    { name: 'double pex disable', value: 'doublepex_disable' }
                )
            )
        ),
    async execute(interaction) {
        const done = 'Done!';
        const wip = 'Work in progress!';
        const subcommand = interaction.options.getSubcommand();
        const code = interaction.options.getString(subcommand === 'cheat' ? 'cheatcode' : 'eventcode');
        if (interaction.user.id !== `${process.env.BOT_OWNER}`) { await interaction.reply('You do not have permission to use this command.'); return };
        switch (subcommand) {
            case 'cheat':
                switch (code) {
                    case 'makemerich':
                        await query(`UPDATE player_money SET coins = coins + 100 WHERE discord_id = '${interaction.user.id}'`);
                        await interaction.reply(`${done}`);
                        break;
                    case 'makemestrong':
                        await query(`UPDATE player_stats SET exp_points = exp_points + 100 WHERE discord_id = '${interaction.user.id}'`);
                        await interaction.reply(`${done}`);
                        break;
                    case 'resetmyquests':
                        await query(`UPDATE player_quests SET quest_1 = '0', quest_2 = '0', quest_3 = '0', quest_4 = '0', quest_5 = '0' WHERE discord_id = '${interaction.user.id}'`);
                        await interaction.reply(`${done}`);
                        break;
                    case 'resetmyprofile':
                        await query(`UPDATE player_quests SET quest_1 = '0', quest_2 = '0', quest_3 = '0', quest_4 = '0', quest_5 = '0' WHERE discord_id = '${interaction.user.id}'`);
                        await query(`UPDATE player_stats SET exp_points = '0', guild_points = '0', quests_done = '0' WHERE discord_id = '${interaction.user.id}'`);
                        await query(`UPDATE player_money SET coins = '0' WHERE discord_id = '${interaction.user.id}'`);
                        await query(`UPDATE player_inventory SET void = '0', coin = '0', experience = '0', bread = '0', rope = '0', nugget = '0' WHERE discord_id = '${interaction.user.id}'`);
                        await interaction.reply(`${done}`);
                        break;
                    default:
                        await interaction.reply('Invalid command.');
                }
                break;

            case 'event':
                switch (code) {
                    case 'doublecoins_enable':
                        await interaction.reply(`${wip}`);
                        break;
                    case 'doublecoins_disable':
                        await interaction.reply(`${wip}`);
                        break;
                    case 'doublepex_enable':
                        await interaction.reply(`${wip}`);
                        break;
                    case 'doublepex_disable':
                        await interaction.reply(`${wip}`);
                        break;
                    default:
                        await interaction.reply('Invalid command.');
                }
                break;
            default:
                await interaction.reply('Invalid command.');
        }
    },
};