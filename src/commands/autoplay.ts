import { QueueRepeatMode, useQueue } from 'discord-player';
import { BaseCommand } from '../structures/commands/Command.js';
import {
    CacheType,
    ChatInputCommandInteraction,
    ColorResolvable,
    EmbedBuilder,
    GuildMember,
    InteractionResponse,
    Message,
    SlashCommandBuilder
} from 'discord.js';

export default class AutoplayCommand extends BaseCommand {
    public constructor() {
        super({
            isBeta: true,
            data: new SlashCommandBuilder()
                .setName('autoplay')
                .setDescription('Activate or deactivate the autoplay feature.')
                .addBooleanOption((option) =>
                    option
                        .setName('enabled')
                        .setDescription('Enable or disable the autoplay feature.')
                        .setRequired(false)
                )
        });
    }

    public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const memberChannel = (interaction.member as GuildMember).voice.channel;
        const botChannel = interaction.guild?.members.me?.voice.channel;

        if (!memberChannel) {
            await this.sendEmbedResponse(
                interaction,
                'You need to be in a voice channel to activate or deactivate the autoplay feature!',
                '#2B2D31'
            );
            return;
        }

        if (botChannel && memberChannel.id !== botChannel.id) {
            await this.sendEmbedResponse(
                interaction,
                'You need to be in the same voice channel as me to activate or deactivate the autoplay feature!',
                '#2B2D31'
            );
            return;
        }

        const queue = useQueue(interaction.guildId!);
        const enabled = interaction.options.getBoolean('enabled');

        if (!queue) {
            await this.sendEmbedResponse(
                interaction,
                'There is no queue to activate or deactivate the autoplay feature!',
                '#2B2D31'
            );
            return;
        }

        if (queue && !queue.currentTrack) {
            await this.sendEmbedResponse(
                interaction,
                'There is no song currently playing to activate or deactivate the autoplay feature!',
                '#2B2D31'
            );
            return;
        }

        try {
            queue.setRepeatMode(enabled ? QueueRepeatMode.AUTOPLAY : QueueRepeatMode.OFF);
            await this.sendEmbedResponse(
                interaction,
                `The autoplay feature has been ${enabled ? 'enabled' : 'disabled'}.`,
                '#2B2D31'
            );
            return;
        } catch (error) {
            if (error instanceof Error) {
                await this.sendEmbedResponse(interaction, error.message, '#2B2D31');
            }
        }
    }

    private async sendEmbedResponse(
        interaction: ChatInputCommandInteraction<CacheType>,
        response: string,
        color: ColorResolvable
    ): Promise<InteractionResponse<boolean> | Message<boolean>> {
        const embedResponse = new EmbedBuilder();
        embedResponse.setDescription(response).setColor(color);
        return await interaction[interaction.deferred ? 'editReply' : 'reply']({ embeds: [embedResponse.toJSON()] });
    }
}
