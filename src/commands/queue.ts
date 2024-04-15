import { GuildMember, CacheType, ButtonInteraction, ChatInputCommandInteraction, APIActionRowComponent, APIMessageActionRowComponent } from 'discord.js';
import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { BaseCommand } from '../structures/Command.js';
import { GuildQueue, useQueue } from 'discord-player';

export default class QueueCommand extends BaseCommand {
    constructor() {
        super({
            isBeta: true,
            data: new SlashCommandBuilder().setName('queue').setDescription('Displays the current queue.')
        });
    }

    async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
        const memberChannel = (interaction.member as GuildMember)?.voice?.channel;
        const botChannel = interaction.guild?.members?.me?.voice?.channel;
        const embedResponse = new EmbedBuilder();

        if (!memberChannel) {
            embedResponse
                .setDescription('You need to be in a voice channel to view the current queue!')
                .setColor('Red');
            await interaction.reply({ embeds: [embedResponse], ephemeral: true });
            return;
        }

        if (botChannel && memberChannel.id !== botChannel.id) {
            embedResponse
                .setDescription('You need to be in the same voice channel as me to view the current queue!')
                .setColor('Red');
            await interaction.reply({ embeds: [embedResponse], ephemeral: true });
            return;
        }

        const queue = useQueue(interaction.guildId!);

        if (!queue) {
            embedResponse.setDescription('There is no queue!').setColor('Red');
            await interaction.reply({ embeds: [embedResponse], ephemeral: true });
            return;
        }

        try {
            await this.handleQueuePagination(interaction, queue);
        } catch (error) {
            console.error('Error handling queue pagination:', error instanceof Error ? error : 'Unknown error');
        }
    }

    private getTracksDescription(queue: GuildQueue, currentPage: number, tracksToDisplay: number): string {
        const start = currentPage * tracksToDisplay;
        const tracks = queue.tracks
            .toArray()
            .slice(start, start + tracksToDisplay)
            .map(
                (track, index) =>
                    `**${start + index + 1}.** \`${track.raw?.duration || track.duration}\` | [**${track.raw?.title || track.title}**](${track.raw?.url || track.url})`
            )
            .join('\n');

        return tracks || 'There are no songs in the playback queue. Use the `/play` command to add a song.';
    }

    private createProgressBar(queue: GuildQueue): string {
        const progressBarOptions = {
            leftChar: '▇',
            indicator: '‎',
            rightChar: '▁',
            separator: '‎',
            timecodes: true,
            queue: true
        };
        return queue.node.createProgressBar(progressBarOptions) || '';
    }

    private async handleQueuePagination(interaction: ChatInputCommandInteraction, queue: GuildQueue): Promise<void> {
        const tracksToDisplay = 10;
        const totalPages = Math.max(1, Math.ceil(queue.tracks.size / tracksToDisplay));
        let currentPage = 0;

        const buttonsBuilders = [
            new ButtonBuilder().setCustomId('fast_previous_page').setLabel('First').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('previous_page').setLabel('Previous').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('next_page').setLabel('Next').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('fast_next_page').setLabel('End').setStyle(ButtonStyle.Secondary)
        ];

        const actionRow: APIActionRowComponent<APIMessageActionRowComponent> = {
            type: ComponentType.ActionRow,
            components: buttonsBuilders.map((builder) => builder.toJSON())
        };

        const currentTrack = queue.currentTrack!;
        const currentTrackDuration = currentTrack.duration || currentTrack.raw?.duration || '';
        const currentTrackTitle = currentTrack.title || currentTrack.raw?.title || '';
        const currentTrackUrl = currentTrack.url || currentTrack.raw?.url || '';
        const currentTrackThumbnail = currentTrack.thumbnail || currentTrack.raw?.thumbnail || '';

        const embedDescription = [
            `**Now Playing:**\n\`${currentTrackDuration}\` | [**${currentTrackTitle}**](${currentTrackUrl})\n${this.createProgressBar(queue)}\n\n`,
            `**Up Next:**\n${this.getTracksDescription(queue, currentPage, tracksToDisplay)}`
        ];

        const responseEmbed = new EmbedBuilder()
            .setColor(interaction.guild?.members?.me?.displayHexColor || 'Default')
            .setDescription(embedDescription.join(''))
            .setFooter({ text: totalPages === 1 ? 'Page 1 of 1' : `Page ${currentPage + 1} of ${totalPages}` })
            .setThumbnail(currentTrackThumbnail);

        const response = await interaction.reply({
            embeds: [responseEmbed],
            components: [actionRow],
            fetchReply: true
        });

        const collector = response.createMessageComponentCollector({
            filter: (button) => button instanceof ButtonInteraction && button.user.id === interaction.user.id,
            time: 60000
        });

        collector.on('collect', async (button: ButtonInteraction) => {
            collector.resetTimer();
            const update = async (): Promise<void> => {
                const newDescription = [
                    `**Now Playing:**\n\`${currentTrackDuration}\` | [**${currentTrackTitle}**](${currentTrackUrl})\n${this.createProgressBar(queue)}\n\n`,
                    `**Up Next:**\n${this.getTracksDescription(queue, currentPage, tracksToDisplay)}`
                ];

                responseEmbed.setDescription(newDescription.join(''));
                responseEmbed.setFooter({
                    text: totalPages === 1 ? 'Page 1 of 1' : `Page ${currentPage + 1} of ${totalPages}`
                });

                buttonsBuilders[0].setDisabled(currentPage === 0 || !queue.tracks.size);
                buttonsBuilders[1].setDisabled(currentPage === 0 || !queue.tracks.size);
                buttonsBuilders[2].setDisabled(currentPage === totalPages - 1 || !queue.tracks.size);
                buttonsBuilders[3].setDisabled(currentPage === totalPages - 1 || !queue.tracks.size);

                await button
                    .update({
                        embeds: [responseEmbed],
                        components: [actionRow]
                    })
                    .catch(() => {});
            };

            switch (button.customId) {
                case 'fast_previous_page':
                    if (currentPage !== 0) currentPage = 0;
                    break;
                case 'previous_page':
                    if (currentPage !== 0) currentPage = Math.max(currentPage - 1, 0);
                    break;
                case 'next_page':
                    if (currentPage !== totalPages - 1) currentPage = Math.min(currentPage + 1, totalPages - 1);
                    break;
                case 'fast_next_page':
                    if (currentPage !== totalPages - 1) currentPage = totalPages - 1;
                    break;
                default:
                    break;
            }

            await update();
        });

        collector.on('end', async () => {
            await response.edit({ components: [] }).catch(() => {});
        });
    }
}