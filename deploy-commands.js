import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
config();

import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const clientId = process.env.BOT_ID
const token = process.env.BOT_TOKEN
const commands = [];
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const { default: command } = await import(`./commands/${file}`);
	commands.push(command.data.toJSON());
}
const rest = new REST({ version: '10' }).setToken(token);

try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);
    const data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands },
    );
    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
} catch (error) { console.error(error) }
