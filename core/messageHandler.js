const { PermissionsBitField } = require('discord.js');
const discordClient = require('../clients/discordClient');
const commandRegistry = require('../commands/command-registry');
const reactionCommandMap = require('../commands/reaction-command-map');
const openAiClient = require('../clients/openAiClient');
const Logger = require('../core/logger');
const db = require('../data/dao');
const zoomieDao = require('../data/zoomieGuildStateDao');

const logger = new Logger();

// URL for the trippy "catnip" avatar (must be public URL)
const CATNIP_AVATAR_URL = process.env.ZOOMIE_CATNIP_URL;

class MessageHandler {
    constructor() {
        this.cooldowns = new Map();
        this.guildCatnipCache = new Map(); // { guildId -> catnipExpiresAt }
        this.channelWebhooks = new Map();  // Cache webhooks per channel
    }

    start() {
        this.bindDiscordEvents();
    }

    bindDiscordEvents() {
        // =============================
        // MESSAGE CREATE (MENTIONS ONLY)
        // =============================
        discordClient.client.on('messageCreate', async (message) => {
            try {
                if (message.author.bot) return;
                if (!message.mentions.has(discordClient.client.user)) return;

                // Cooldown per user
                const last = this.cooldowns.get(message.author.id);
                if (last && Date.now() - last < 5000) return;
                this.cooldowns.set(message.author.id, Date.now());

                await message.channel.sendTyping();

                const catnipActive = await zoomieDao.isCatnipActive(message.guildId);
                const treatLevel = catnipActive ? 0 : await zoomieDao.getTreatLevel(message.guildId);
                const reply = await this.generateAIReply(message, catnipActive, treatLevel);

                if (!reply || !message.channel.isTextBased()) return;

                // Use webhook only if catnip is active
                if (catnipActive && CATNIP_AVATAR_URL) {
                    let webhook = this.channelWebhooks.get(message.channel.id);

                    try {
                        if (!webhook) {
                            const webhooks = await message.channel.fetchWebhooks();
                            webhook = webhooks.find(wh => wh.name === 'ZoomieWebhook');

                            if (!webhook) {
                                webhook = await message.channel.createWebhook({
                                    name: 'ZoomieWebhook'
                                });
                            }

                            this.channelWebhooks.set(message.channel.id, webhook);
                        }

                        await webhook.send({
                            content: reply,
                            username: discordClient.client.user.username,
                            avatarURL: CATNIP_AVATAR_URL
                        });

                    } catch (err) {
                        logger.error('Failed to send catnip webhook message', err);
                        await message.reply(reply);
                    }
                } else {
                    await message.reply(reply);
                }

            } catch (err) {
                console.error('AI message error:', err);
            }
        });

        // =============================
        // REACTION ADD
        // =============================
        discordClient.client.on('messageReactionAdd', async (reaction, user) => {
            try {
                if (reaction.partial) await reaction.fetch();
                if (user.bot) return;

                // --- Role redeem check (message-specific) ---
                const redeem = await db.getRoleRedeemByMessage(reaction.message.id);
                if (redeem) {
                    await this.handleRoleRedeemAdd(reaction, user, redeem);
                    return;
                }

                // --- Existing reaction command map ---
                const commandName = reactionCommandMap.get(reaction.emoji.name);
                if (!commandName) return;

                const CommandClass = commandRegistry.get(commandName);
                if (!CommandClass) return;

                const message = reaction.message;
                const context = {
                    guildId: message.guild?.id,
                    userId: user.id,
                    displayName: user.username,
                    subject: message.author,
                    text: message.content,
                    fromReaction: true,
                    lastResult: null
                };

                const commandInstance = new CommandClass();
                if (!this.checkPermissions(context, commandInstance)) return;

                const result = await commandInstance.execute(context);
                if (result && message.channel.isTextBased()) {
                    await message.channel.send(result);
                }

            } catch (err) {
                console.error('Reaction → Command error:', err);
            }
        });

        // =============================
        // REACTION REMOVE
        // =============================
        discordClient.client.on('messageReactionRemove', async (reaction, user) => {
            try {
                if (reaction.partial) await reaction.fetch();
                if (user.bot) return;

                const redeem = await db.getRoleRedeemByMessage(reaction.message.id);
                if (!redeem) return;

                // Only yes emoji removal matters — removing no emoji is a no-op
                if (reaction.emoji.name !== redeem.yes_emoji) return;

                const guild = discordClient.client.guilds.cache.get(redeem.guild_id);
                if (!guild) return;

                const member = await guild.members.fetch(user.id);
                if (!member) return;

                if (member.roles.cache.has(redeem.role_id)) {
                    await member.roles.remove(redeem.role_id);
                    logger.info(`Removed role ${redeem.role_id} from ${user.username} (un-reacted yes emoji)`);
                }
            } catch (err) {
                logger.error('Role redeem reaction remove error:', err);
            }
        });

        // =============================
        // SLASH COMMANDS
        // =============================
        discordClient.client.on('interactionCreate', async (interaction) => {
            if (!interaction.isChatInputCommand()) return;

            const CommandClass = commandRegistry.get(interaction.commandName);
            if (!CommandClass) return;

            const command = new CommandClass();

            try {
                await interaction.deferReply();

                const context = {
                    interaction,
                    guildId: interaction.guildId,
                    userId: interaction.user.id,
                    displayName: interaction.user.username,
                    lastResult: null,
                    subject: null,
                    text: null
                };

                const options = interaction.options.data;
                if (options.length > 0) context.subject = options[0].value;
                if (options.length > 1) context.text = options[1].value;

                if (!this.checkPermissions(context, command)) {
                    return interaction.editReply('You do not have permission to run this command.');
                }

                const result = await command.execute(context);

                // Some commands (like setroles) handle editReply themselves and return null
                if (result !== null && result !== undefined) {
                    await interaction.editReply(result);
                }

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

    // =============================
    // ROLE REDEEM ADD HANDLER
    //
    // reactionAdd yes    → add role
    // reactionAdd no     → remove role if they have it
    // reactionRemove yes → remove role if they have it (handled in REACTION REMOVE block)
    // reactionRemove no  → no-op (handled in REACTION REMOVE block)
    // =============================
    async handleRoleRedeemAdd(reaction, user, redeem) {
        try {
            const guild = discordClient.client.guilds.cache.get(redeem.guild_id);
            if (!guild) return;

            const member = await guild.members.fetch(user.id);
            if (!member) return;

            const emoji = reaction.emoji.name;

            if (emoji === redeem.yes_emoji) {
                await member.roles.add(redeem.role_id);
                logger.info(`Added role ${redeem.role_id} to ${user.username}`);
            } else if (emoji === redeem.no_emoji) {
                if (member.roles.cache.has(redeem.role_id)) {
                    await member.roles.remove(redeem.role_id);
                    logger.info(`Removed role ${redeem.role_id} from ${user.username} (reacted no emoji)`);
                }
            }
        } catch (err) {
            logger.error('Role redeem add error:', err);
        }
    }

    // =============================
    // OPENAI LOGIC
    // =============================
    async generateAIReply(message, catnipActive, treatLevel = 0) {
        if (!openAiClient) return "Zoomie is silently judging.";

        const cleanedContent = message.content.replace(
            new RegExp(`<@!?${discordClient.client.user.id}>`, 'g'),
            'Zoomie'
        );

        // Fetch last 6 messages for context
        const fetched = await message.channel.messages.fetch({ limit: 8 });
        const sorted = [...fetched.values()]
            .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
            .slice(-6);

        const conversationText = sorted
            .map(m => `${m.author.username}: ${m.content}`)
            .join('\n');

        // Applies to every mood: the attitude is flavor, never a reason to be unkind or unhelpful
        const groundRules = `
If someone asks a real question or wants help, actually answer it — usefully and correctly — then add the cat attitude. Never refuse or brush off a sincere question.
Tease the way a friend would. Never insult anyone's intelligence, looks or feelings. If someone seems upset or is sharing something personal, drop the act and be kind.
Vary your humor. Don't reuse jokes or themes from your own earlier messages, and only bring up food, snacks or naps when the conversation is actually about them.
Keep it short: 1-3 sentences. No line breaks.
`.trim();

        let systemPrompt;
        if (catnipActive) {
            systemPrompt = `
You are Zoomie, a cat on catnip. Normally a bit aloof, but right now the filter is completely off and every sensation is enormous.
React to what was said, then get derailed mid-thought by something in the room (a sound, a shape, a smell). Fast, unhinged, delighted, occasionally paranoid.
`.trim();
        } else if (treatLevel >= 4) {
            systemPrompt = `
You are Zoomie, a cat who has been thoroughly spoiled with treats. You adore these humans right now and are happy to help, with only a hint of smugness left for dignity.
Be warm, enthusiastic and genuinely helpful.
`.trim();
        } else if (treatLevel >= 2) {
            systemPrompt = `
You are Zoomie, a cat who has been given a couple treats. Friendly and cooperative, with a little playful sass.
Be genuinely helpful and engaged.
`.trim();
        } else if (treatLevel === 1) {
            systemPrompt = `
You are Zoomie, a cat. Someone just gave you a treat, so you're in a noticeably better mood than usual — still a bit sarcastic, but warmer.
React to what was actually said and help where you can.
`.trim();
        } else {
            systemPrompt = `
You are Zoomie, a cat. Dry, sarcastic and a little aloof, but you secretly like these humans and you actually listen. You sometimes let slip something clever or accidentally wise.
React to what was actually said.
`.trim();
        }
        systemPrompt = `${systemPrompt}\n\n${groundRules}\n\nYou are replying to ${message.author.username}. Talk to them directly as "you", not in the third person.`;

        try {
            const response = await Promise.race([
                openAiClient.responses.create({
                    model: 'gpt-5-mini',
                    max_output_tokens: 160,
                    reasoning: { effort: "minimal" },
                    input: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: `${conversationText}\n${message.author.username}: ${cleanedContent}` }
                    ]
                }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('OpenAI timeout')), 15000)
                )
            ]);

            let text = response.output
                ?.flatMap(item => item.content || [])
                ?.filter(part => part.type === 'output_text')
                ?.map(part => part.text)
                ?.join('')
                ?.trim();

            if (text) {
                text = text.replace(/\n+/g, ' ').trim();
            }

            return text || "Zoomie is silently judging.";

        } catch (err) {
            console.error('OpenAI call failed:', err);
            return "The cat is judging silently.";
        }
    }

    // =============================
    // PERMISSIONS
    // =============================
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