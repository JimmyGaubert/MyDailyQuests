import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { db } from 'mysql';
import { readFileSync } from 'node:fs';
import { join } from 'path';

export default {
    data: new SlashCommandBuilder().setName('guild')
        .setDescription('Display guild stats and manage visibility on leaderboard')
        .addStringOption(option =>
            option.setName('leaderboard')
                .setDescription('Choose whether to display the guild on the leaderboard')
                .setRequired(false)
                .addChoices({ name: 'Yes', value: 'yes' }, { name: 'No', value: 'no' })
        ),
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const ownerId = interaction.guild.ownerId;
        const choice = interaction.options.getString('leaderboard');
        try {
            const levelPointsPath = join(__dirname, '../json', 'level_points.json');
            const levelPoints = JSON.parse(readFileSync(levelPointsPath, 'utf-8'));
            const [ guildData ] = await db.query(`SELECT * FROM guild WHERE discord_id = ?`, [guildId]);
            if (!guildData.length) { await interaction.reply(`Guild data not found.`); return; }
            const guildOnLB = guildData[0].guild_on_lb;
            const totalGuildPoints = parseInt(guildData[0].total_guild_points);
            let guildLevel = 1;
            for (const [level, points] of Object.entries(levelPoints)) { if (totalGuildPoints >= BigInt(points)) { guildLevel = parseInt(level) } else { break } }
            const createGuildStatsEmbed = (guildName, iconURL, totalPoints, level, position) => {
                const embed = new EmbedBuilder()
                    .setColor("Gold")
                    .setAuthor({ name: `${guildName} Guild Stats`, iconURL: iconURL })
                    .addFields(
                        { name: '\u200B', value: `**Total Guild Points:** \`${totalPoints}\`` },
                        { name: '\u200B', value: `**Guild Level:** \`${level}\`` },
                        { name: '\u200B', value: `**Guild On Leaderboard:** \`${guildOnLB === 'oui' ? 'yes' : 'no'}\`` },
                    );
                if (guildOnLB === 'oui') { embed.addFields({ name: '\u200B', value: `**Position in Leaderboard:** ${position}` }) }
                return embed;
            };

            if (interaction.user.id === ownerId) {
                if (choice === 'yes') {
                    await db.query(`UPDATE guild SET guild_on_lb = 'oui' WHERE discord_id = ?`, [guildId]);
                    await interaction.reply(`The guild "${interaction.guild.name}" is now displayed on the leaderboard.`);
                } else if (choice === 'no') {
                    await db.query(`UPDATE guild SET guild_on_lb = 'non' WHERE discord_id = ?`, [guildId]);
                    await interaction.reply(`The guild "${interaction.guild.name}" is no longer displayed on the leaderboard.`);
                } else {
                    const guildStatsEmbed = createGuildStatsEmbed(interaction.guild.name, interaction.guild.iconURL(), totalGuildPoints, guildLevel, guildOnLB === 'oui' ? 'to be implemented' : 'Not displayed');
                    await interaction.reply({ embeds: [guildStatsEmbed] });
                }
            } else {
                const guildStatsEmbed = createGuildStatsEmbed(interaction.guild.name, interaction.guild.iconURL(), totalGuildPoints, guildLevel, guildOnLB === 'oui' ? 'to be implemented' : 'Not displayed');
                await interaction.reply({ embeds: [guildStatsEmbed] });
            }
        } catch (err) {
            console.error(err);
            await interaction.reply('An error occurred while processing your request. Please contact the developer and provide screenshots.');
        }
    },
};