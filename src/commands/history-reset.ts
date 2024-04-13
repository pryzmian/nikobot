import { BaseCommand } from '../structures/Command.js';
import { ChatHistoryModel } from '../database/models/ChatBot.js';
import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export default class HistoryResetCommand extends BaseCommand {
    public constructor() {
        super({
            isBeta: true,
            isSystemCommand: true,
            data: new SlashCommandBuilder()
                .setName('history-reset')
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
                .setDescription('Resets the chat history for the bot in a server')
                .addStringOption((option) =>
                    option
                        .setName('server-id')
                        .setDescription('The ID of the server to reset the chat history for')
                        .setRequired(true)
                )
        });
    }

    public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const serverId = interaction.options.getString('server-id') as string;
        const guild = await interaction.client.guilds.fetch(serverId).catch(() => null);
        const embedResponse = new EmbedBuilder();

        await interaction.deferReply();

        // if the guild ID is not found, return an error message
        if (!guild) {
            embedResponse.setDescription('The server ID provided is invalid.').setColor('Red');
            await interaction.editReply({ embeds: [embedResponse.toJSON()] });
            return;
        }

        const historyModel = await ChatHistoryModel.findOne({ guildId: guild.id });
        const historyExists = !!historyModel;

        // if the chat history does not exist, return an error message
        if (!historyExists || !historyModel.history.length) {
            embedResponse.setDescription('The chat history for this server does not exist.').setColor('Red');
            await interaction.editReply({ embeds: [embedResponse.toJSON()] });
            return;
        }

        try {
            // if the chat history exists, reset it
            await ChatHistoryModel.findOneAndUpdate({ guildId: guild.id }, { history: [] });
            embedResponse.setDescription('The chat history for this server has been reset.').setColor('Green');
            await interaction.editReply({ embeds: [embedResponse.toJSON()] });
        } catch (error) {
            if (error instanceof Error) {
                console.error(
                    `An error occurred while resetting the chat history for ${guild.name} (${guild.id}): ${error.stack}`
                );
                embedResponse
                    .setDescription(`An error occurred while resetting the chat history: ${error.message}`)
                    .setColor('Red');
                await interaction.editReply({ embeds: [embedResponse.toJSON()] });
                return;
            }
        }
    }
}
