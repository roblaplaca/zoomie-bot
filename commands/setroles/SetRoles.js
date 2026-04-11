const Command = require('../command-interface.js');
const { SlashCommandBuilder } = require('discord.js');
const db = require('../../data/dao');
const Logger = require('../../core/logger');
const logger = new Logger();

class SetRolesCommand extends Command {
    static permissions = ['mod'];

    static slashData = new SlashCommandBuilder()
        .setName('setroles')
        .setDescription('Post a role opt-in message that Zoomie will manage')
        .addStringOption(option =>
            option.setName('prompt')
                  .setDescription('The message text to display')
                  .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('yes_emoji')
                  .setDescription('Emoji for opting in (e.g. 👍)')
                  .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('no_emoji')
                  .setDescription('Emoji for opting out (e.g. 👎)')
                  .setRequired(true)
        )
        .addRoleOption(option =>
            option.setName('role')
                  .setDescription('The role to assign')
                  .setRequired(true)
        );

    async execute(context) {
        const { interaction, guildId } = context;

        const prompt   = interaction.options.getString('prompt');
        const yesEmoji = interaction.options.getString('yes_emoji').trim();
        const noEmoji  = interaction.options.getString('no_emoji').trim();
        const role     = interaction.options.getRole('role');

        try {
            // Post the message in the current channel
            const posted = await interaction.channel.send(prompt);

            // Pre-react with both emojis so users know what to click
            await posted.react(yesEmoji);
            await posted.react(noEmoji);

            // Persist to DB
            await db.saveRoleRedeem({
                guildId,
                channelId:  interaction.channelId,
                messageId:  posted.id,
                yesEmoji,
                noEmoji,
                roleId:     role.id,
            });

            logger.info(`Role redeem set up for role ${role.name} in guild ${guildId}`);

            // Edit the deferred reply so it doesn't just say "thinking..."
            await interaction.editReply(`Done! Zoomie is watching that message for reactions.`);

        } catch (err) {
            logger.error('SetRoles error:', err);
            await interaction.editReply(`Hisss! Something went wrong setting up the role message.`);
        }

        // Return null — we handled editReply ourselves
        return null;
    }
}

module.exports = SetRolesCommand;