const { PermissionsBitField } = require('discord.js');
const discordClient = require('../clients/discordClient');
const commandRegistry = require('../commands/command-registry');
const Logger = require('../core/logger');

const logger = new Logger();

class MessageHandler {
    constructor() {
        this.cooldowns = new Map();
    }

    start() {
        this.bindDiscordEvents();
    }

    bindDiscordEvents() {
        discordClient.client.on('messageCreate', async (message) => {
            try {
                // Ignore bots (including itself)
                if (message.author.bot) return;

                const payload = {
                    displayName: message.author.username,
                    message: message.content,
                    source: 'Discord',
                    userId: message.author.id,
                    isModerator:
                        message.member?.permissions.has(
                            PermissionsBitField.Flags.Administrator
                        ) || false,
                    channelId: message.channel.id,
                    guildId: message.guild?.id
                };

                await this.handleMessage(payload);

            } catch (err) {
                logger.error('Unhandled messageCreate error:', err);
            }
        });
    }

    async handleMessage(payload) {
        const { message, channelId } = payload;

        // Handle commands
        if (message.startsWith('!')) {
            try {
                await this.processCommands(payload);
            } catch (error) {
                logger.error('Error processing command:', error);
            }
            return;
        }

        // Non-command handling (mentions / DMs)
        const channel = discordClient.client.channels.cache.get(channelId);
        if (!channel || !channel.isTextBased()) return;

        const botId = discordClient.client.user.id;

        const isDM = !payload.guildId;
        const isMentioned = channel.isTextBased() &&
            channel.client.user &&
            channel.client.user.id &&
            channel.client.user.id === botId &&
            false;

        // Proper mention detection
        const mentioned = payload.message.includes(`<@${botId}>`);

        if (isDM || mentioned) {
            try {
                await channel.send('meow?');
            } catch (err) {
                logger.error('Failed to send meow:', err);
            }
        }
    }

    async processCommands(payload) {
        const message = payload.message;
        const parts = message.substring(1).split(/(\s*(&&|\|)\s*)/);

        const commands = [];

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i].trim();
            if (!part || part === '&&' || part === '|') continue;

            const parts2 = part.split(/\s+/);

            commands.push({
                name: parts2[0].toLowerCase(),
                args: parts2.slice(1),
                operator: parts[i + 1] ? parts[i + 1].trim() : undefined
            });
        }

        let lastResult = null;

        for (const command of commands) {
            const isPiped = command.operator === '|';
            const isChained = command.operator === '&&';

            const CommandClass = commandRegistry.get(command.name);
            if (!CommandClass) {
                logger.warn(`Command !${command.name} not found.`);
                continue;
            }

            const commandInstance = new CommandClass();

            if (!commandInstance.isEnabled()) continue;
            if (!this.checkPermissions(payload, commandInstance)) continue;
            if (this.isCoolingDown(command.name)) continue;

            this.setCooldown(command.name, commandInstance.cooldown);

            try {
                const context = {
                    displayName: payload.displayName,
                    message: payload.message,
                    source: payload.source,
                    isMod: payload.isModerator,
                    args: command.args,
                    lastResult,
                    isPiped,
                    isChained,
                    userId: payload.userId,
                    channelId: payload.channelId,
                    guildId: payload.guildId
                };

                if (commandInstance.redeemOnly()) {
                    throw new Error('Command is redeem only');
                }

                const result = await commandInstance.execute(context);
                lastResult = result;

                if (!command.operator && result) {
                    const channel = discordClient.client.channels.cache.get(payload.channelId);
                    if (channel && channel.isTextBased()) {
                        await channel.send(result);
                    }
                }

            } catch (error) {
                logger.error(`Error executing command !${command.name}:`, error);

                const channel = discordClient.client.channels.cache.get(payload.channelId);
                if (channel && channel.isTextBased()) {
                    await channel.send(`An error occurred executing !${command.name}.`);
                }
            }
        }
    }

    checkPermissions(payload, command) {
        if (command.permissions?.includes('mod') && !payload.isModerator) {
            return false;
        }
        return true;
    }

    isCoolingDown(commandName) {
        const now = Date.now();
        const expiresAt = this.cooldowns.get(commandName);
        return expiresAt && now < expiresAt;
    }

    setCooldown(commandName, cooldown) {
        if (cooldown) {
            const expiresAt = Date.now() + cooldown;
            this.cooldowns.set(commandName, expiresAt);
        }
    }
}

module.exports = new MessageHandler();