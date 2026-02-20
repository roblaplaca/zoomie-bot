const { PermissionsBitField } = require('discord.js');
const discordClient = require('../clients/discordClient');
const commandRegistry = require('../commands/command-registry');
const reactionCommandMap = require('../commands/reaction-command-map');
const Logger = require('../core/logger');

const logger = new Logger();

class MessageHandler {
    start() {
        this.bindDiscordEvents();
    }

    bindDiscordEvents() {
        // Reaction handling
        discordClient.client.on('messageReactionAdd', async (reaction, user) => {
            try {
                if (reaction.partial) await reaction.fetch();
                if (user.bot) return;

                const commandName = reactionCommandMap.get(reaction.emoji.name);
                if (!commandName) return;

                const CommandClass = commandRegistry.get(commandName);
                if (!CommandClass) return;

                const message = reaction.message;

                const context = {
                    guildId: message.guild?.id,
                    userId: user.id,
                    displayName: user.username,
                    subject: message.author,    // original message author
                    text: message.content,      // full message content
                    fromReaction: true,
                    lastResult: null
                };

                const commandInstance = new CommandClass();

                // Permissions check
                if (!this.checkPermissions(context, commandInstance)) return;

                const result = await commandInstance.execute(context);

                if (result && message.channel.isTextBased()) {
                    await message.channel.send(result);
                }

            } catch (err) {
                console.error('Reaction → Command error:', err);
            }
        });

        // Slash command handling
        discordClient.client.on('interactionCreate', async (interaction) => {
            if (!interaction.isChatInputCommand()) return;

            const CommandClass = commandRegistry.get(interaction.commandName);
            if (!CommandClass) return;

            const command = new CommandClass();

            try {
                await interaction.deferReply();

                // Build unified context for slash commands
                const context = {
                    interaction,
                    guildId: interaction.guildId,
                    userId: interaction.user.id,
                    displayName: interaction.user.username,
                    lastResult: null,
                    subject: null,
                    text: null
                };

                // Map options into subject/text
                const options = interaction.options.data;
                if (options.length > 0) context.subject = options[0].value;
                if (options.length > 1) context.text = options[1].value;

                // Permissions check
                if (!this.checkPermissions(context, command)) {
                    return interaction.editReply('You do not have permission to run this command.');
                }

                const result = await command.execute(context);
                await interaction.editReply(result);

            } catch (err) {
                console.error('Slash command execution error:', err);
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply('Something went wrong.');
                } else {
                    await interaction.reply({ content: 'Something went wrong.', flags: 64 });
                }
            }
        });
    }

    // Only mod-check
    checkPermissions(context, command) {
        if (command.permissions?.includes('mod')) {
            const member = context.guildId
                ? discordClient.client.guilds.cache.get(context.guildId)?.members.cache.get(context.userId)
                : null;
            return member?.permissions.has(PermissionsBitField.Flags.Administrator) || false;
        }
        return true;
    }
}

module.exports = new MessageHandler();