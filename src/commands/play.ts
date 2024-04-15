import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    GuildMember,
    InteractionResponse,
    Message,
    PermissionsBitField,
    SlashCommandBuilder
} from 'discord.js';
import { BaseCommand } from '../structures/Command.js';
import { QueueRepeatMode, useMainPlayer } from 'discord-player';

export default class PlayCommand extends BaseCommand {
    public constructor() {
        super({
            isBeta: true,
            data: new SlashCommandBuilder()
                .setName('play')
                .setDescription('Play a song')
                .addStringOption((option) =>
                    option.setName('song').setDescription('The song to play').setRequired(true).setAutocomplete(true)
                )
        });
    }

    public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        // Extract member and bot voice channels
        const memberChannel = (interaction.member as GuildMember).voice.channel;
        const botChannel = interaction.guild?.members.me?.voice.channel;
        const embedResponse = new EmbedBuilder();

        // Check if the member is in a voice channel
        if (!memberChannel) {
            await this.sendErrorMessage(interaction, 'You need to be in a voice channel to play music!');
            return;
        }

        // Check if the bot is in a voice channel
        if (botChannel && memberChannel.id !== botChannel.id) {
            await this.sendErrorMessage(interaction, 'You need to be in the same voice channel as me to play music!');
            return;
        }

        // Check bot's channel permissions
        const resolvedPermissions = new PermissionsBitField([
            PermissionsBitField.Flags.Connect,
            PermissionsBitField.Flags.Speak,
            PermissionsBitField.Flags.ViewChannel
        ]);
        const channelPermissions = memberChannel.permissionsFor(interaction.client.user!)!.missing(resolvedPermissions);
        const isMissingPermissions = channelPermissions?.length !== 0;

        if (isMissingPermissions) {
            await this.sendErrorMessage(
                interaction,
                `I am missing the following permissions: ${channelPermissions?.join(', ')}`
            );
            return;
        }

        // Get the song to play
        const player = useMainPlayer();
        const song = interaction.options.getString('song') as string;

        await interaction.deferReply();

        const searchResult = await player.search(song, {
            requestedBy: interaction.user
        });

        if (!searchResult.tracks.length || searchResult.isEmpty()) {
            await this.sendErrorMessage(interaction, 'No results found for the specified song!');
            return;
        }

        await player.play(memberChannel, searchResult, {
            nodeOptions: {
                leaveOnEmpty: false,
                leaveOnEnd: false,
                leaveOnStop: false,
                volume: 50,
                metadata: {
                    client: interaction.client,
                    channel: interaction.channel,
                    requestedBy: interaction.user
                }
            }
        });

        const resultMessage = searchResult.hasPlaylist()
            ? `Queued playlist [${searchResult.playlist?.title}](${searchResult.playlist?.url}) with \`${searchResult.playlist?.tracks.length}\` songs!`
            : `Queued [${searchResult.tracks[0].title}](${searchResult.tracks[0].url})!`;

        embedResponse.setDescription(resultMessage).setColor('Green');
        await interaction.editReply({ embeds: [embedResponse.toJSON()] });
    }

    private async sendErrorMessage(interaction: ChatInputCommandInteraction, message: string): Promise<InteractionResponse<boolean> | Message<boolean>> {
        const embedResponse = new EmbedBuilder().setDescription(message).setColor('Red');
        if (interaction.replied && interaction.deferred) {
            return await interaction.editReply({ embeds: [embedResponse.toJSON()] });
        } else {
            return await interaction.reply({ embeds: [embedResponse.toJSON()], ephemeral: true });
        }
    }
}
