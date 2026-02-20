const { REST, Routes } = require('discord.js');
const commandRegistry = require('../commands/command-registry');

async function registerSlashCommands({
    token,
    clientId,
    guildId = null // if provided → guild registration, else global
}) {
    if (!token || !clientId) {
        throw new Error('Missing token or clientId for slash registration.');
    }

    const commands = [];

    for (const [, CommandClass] of commandRegistry.entries()) {
        if (CommandClass.slashData) {
            commands.push(CommandClass.slashData.toJSON());
        }
    }

    if (commands.length === 0) {
        console.warn('No slash commands found in registry.');
        return;
    }

    const rest = new REST({ version: '10' }).setToken(token);

    try {
        console.log(`Registering ${commands.length} slash command(s)...`);

        if (guildId) {
            await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commands }
            );
            console.log('Registered guild slash commands.');
        } else {
            await rest.put(
                Routes.applicationCommands(clientId),
                { body: commands }
            );
            console.log('Registered global slash commands.');
        }

    } catch (error) {
        console.error('Error registering slash commands:', error);
        throw error;
    }
}

module.exports = registerSlashCommands;
