const { REST, Routes } = require('discord.js');
require('dotenv').config();

const clientId = process.env.BOT_ID;
const token = process.env.BOT_TOKEN;
const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('Started deleting application (/) commands.');

        const commands = await rest.get(
            Routes.applicationCommands(clientId)
        );

        for (const command of commands) {
            await rest.delete(
                Routes.applicationCommand(clientId, command.id)
            );
            console.log(`Deleted command ${command.name}`);
        }

        console.log('Successfully deleted all application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();