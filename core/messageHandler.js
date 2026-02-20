const { PermissionsBitField } = require('discord.js');
const discordClient = require('../clients/discordClient');
const commandRegistry = require('../commands/command-registry');
const reactionCommandMap = require('../commands/reaction-command-map');
const openAiClient = require('../clients/openAiClient');
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
        // =============================
        // MESSAGE CREATE (DM + MENTION AI)
        // =============================
        discordClient.client.on('messageCreate', async (message) => {
            try {
                if (message.author.bot) return;
                if (!openAiClient) return;

                const isMentioningBot = message.mentions.has(discordClient.client.user);
                if (!isMentioningBot) return; // ignore DMs

                // Basic cooldown (5s per user)
                const last = this.cooldowns.get(message.author.id);
                if (last && Date.now() - last < 5000) return;
                this.cooldowns.set(message.author.id, Date.now());

                await message.channel.sendTyping();

                const reply = await this.generateAIReply(message);

                if (reply && message.channel.isTextBased()) {
                    await message.reply(reply);
                }

            } catch (err) {
                console.error('AI message error:', err);
            }
        });

        // =============================
        // REACTION COMMANDS
        // =============================
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

    // =============================
    // OPENAI LOGIC
    // =============================
async generateAIReply(message, isDM) {
    if (!openAiClient) {
        console.log('OpenAI client missing');
        return null;
    }

    console.log('Calling OpenAI...');

    let cleanedContent = message.content;
    if (!isDM) {
        cleanedContent = cleanedContent.replace(
            new RegExp(`<@!?${discordClient.client.user.id}>`, 'g'),
            'Zoomie'
        );
    }

    // Fetch last 6 messages for context
    const fetched = await message.channel.messages.fetch({ limit: 8 });
    const sorted = [...fetched.values()]
        .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
        .slice(-6);

    const conversationText = sorted
        .map(m => `${m.author.username}: ${m.content}`)
        .join('\n');

    const systemPrompt = `
You are Zoomie, a grumpy, Garfield-style cat.
You speak in very short, punchy sentences.
Always sarcastic, lazy, and uninterested in humans.
Occasionally absurd or weird.
Never offer advice or explanations.
Never congratulate or comment academically.
Maximum 1 sentences.
React to humans, not their choices or dilemmas.
Keep it casual and a little ridiculous.
    `.trim();

    try {
        const response = await Promise.race([
            openAiClient.responses.create({
                model: 'gpt-5-mini',
                max_output_tokens: 120,
                reasoning: { effort: "minimal" }, // ← fixed
                input: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `${conversationText}\n${message.author.username}: ${cleanedContent}` }
                ]
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('OpenAI timeout')), 15000)
            )
        ]);

        console.log('Raw OpenAI response:', JSON.stringify(response, null, 2));

        const text = response.output
            ?.flatMap(item => item.content || [])
            ?.filter(part => part.type === 'output_text')
            ?.map(part => part.text)
            ?.join('')
            ?.trim();

        console.log('Extracted text:', text);

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