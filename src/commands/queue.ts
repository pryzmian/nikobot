import { GuildQueue, PlayerProgressbarOptions, useQueue } from 'discord-player';
import { BaseCommand } from '../structures/Command.js';
import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    GuildMember,
    CacheType,
    ButtonInteraction,
    APIActionRowComponent,
    APIMessageActionRowComponent,
    ButtonBuilder,
    ButtonStyle,
    ComponentType
} from 'discord.js';

export default class QueueCommand extends BaseCommand {
    public constructor() {
        super({
            isBeta: true,
            data: new SlashCommandBuilder().setName('queue').setDescription('Displays the current queue.')
        });
    }

    public async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
        const memberChannel = (interaction.member as GuildMember).voice.channel;
        const botChannel = interaction.guild?.members.me?.voice.channel;
        const embedResponse = new EmbedBuilder();

        // Check if the member is in a voice channel
        if (!memberChannel) {
            embedResponse
                .setDescription('You need to be in a voice channel to view the current queue!')
                .setColor('Red');
            await interaction.reply({ embeds: [embedResponse], ephemeral: true });
            return;
        }

        // Check if the bot is in a voice channel
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
            if (error instanceof Error) {
                console.error('There was an error while handling the queue pagination:', error);
            }
        }
    }

    private getTracksMap(queue: GuildQueue, currentPage: number, tracksToDisplay: number): string {
        const start = currentPage * tracksToDisplay;
        const tracks = queue.tracks
            .toArray()
            .slice(start, start + tracksToDisplay)
            .map(
                (t, index) =>
                    `**${start + index + 1}.** \`${t.raw ? t.raw.duration : t.duration}\` | [**${t.raw ? t.raw.title : t.title}**](${
                        t.raw ? t.raw.url : t.url
                    })`
            )
            .join('\n');

        return tracks || 'There are no songs in the playback queue. Use the `/play` command to add a song.';
    }

    private createProgressBar(queue: GuildQueue) {
        const progressBarOptions: PlayerProgressbarOptions = {
            leftChar: '▇',
            indicator: '‎',
            rightChar: '▁',
            separator: '‎',
            timecodes: true,
            queue: true
        };
        return queue.node.createProgressBar(progressBarOptions) || '';
    }

    private async handleQueuePagination(interaction: ChatInputCommandInteraction, queue: GuildQueue) {
        const tracksToDisplay = 10;
        const queueSize = queue.tracks.size;

        const buttonsBuilders: ButtonBuilder[] = [
            new ButtonBuilder().setCustomId('fast_previous_page').setLabel('First').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('previous_page').setLabel('Previous').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('next_page').setLabel('Next').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('fast_next_page').setLabel('End').setStyle(ButtonStyle.Secondary)
        ];

        const actionRow: APIActionRowComponent<APIMessageActionRowComponent> = {
            type: ComponentType.ActionRow,
            components: buttonsBuilders.map((b) => b.toJSON())
        };

        let currentPage = 0;
        const currentTrackDuration = queue.currentTrack?.duration ?? queue.currentTrack?.raw.duration;
        const currentTrackTitle = queue.currentTrack?.title ?? queue.currentTrack?.raw.title;
        const currentTrackUrl = queue.currentTrack?.url ?? queue.currentTrack?.raw.url;
        const currentTrackThumbnail = queue.currentTrack?.thumbnail ?? queue.currentTrack?.raw.thumbnail;

        const embedDescription = [
            `**Now Playing:**\n\`${currentTrackDuration}\` | [**${currentTrackTitle}**](${currentTrackUrl})\n${this.createProgressBar(queue)}\n\n`,
            `**Up Next:**\n${this.getTracksMap(queue, currentPage, tracksToDisplay)}`
        ];

        const totalPages = Math.max(1, Math.ceil(queueSize / tracksToDisplay));

        const responseEmbed = new EmbedBuilder()
            .setColor(interaction.guild!.members.me!.displayHexColor!)
            .setDescription(embedDescription.join(''))
            .setFooter({
                text: totalPages === 1 ? 'Page 1 of 1' : `Page ${currentPage + 1} of ${totalPages}`
            })
            .setThumbnail(currentTrackThumbnail!);

        const response = await interaction.reply({
            embeds: [responseEmbed],
            components: [actionRow],
            fetchReply: true
        });

        const collector = response.createMessageComponentCollector({
            filter: (b) => b.user.id === interaction.user.id,
            time: 60000
        });

        collector.on('collect', async (button: ButtonInteraction) => {
            collector.resetTimer();

            if (button.customId === 'fast_previous_page') {
                if (currentPage === 0) {
                    await button.reply({
                        content: 'You are already on the first page.',
                        ephemeral: true
                    });
                    return;
                }
                currentPage = 0;
            } else if (button.customId === 'previous_page') {
                if (currentPage === 0) {
                    await button.reply({
                        content: 'You are already on the first page.',
                        ephemeral: true
                    });
                    return;
                }

                currentPage = Math.max(currentPage - 1, 0);
            } else if (button.customId === 'next_page') {
                if (currentPage === totalPages - 1) {
                    await button.reply({
                        content: 'You are already on the last page.',
                        ephemeral: true
                    });
                    return;
                }

                currentPage = Math.min(currentPage + 1, totalPages - 1);
            } else if (button.customId === 'fast_next_page') {
                if (currentPage === totalPages - 1) {
                    await button.reply({
                        content: 'You are already on the last page.',
                        ephemeral: true
                    });
                    return;
                }

                currentPage = totalPages - 1;
            }

            const newEmbedDescription = [
                `**Now Playing:**\n\`${currentTrackDuration}\` | [**${currentTrackTitle}**](${currentTrackUrl})\n${this.createProgressBar(queue)}\n\n`,
                `**Up Next:**\n${this.getTracksMap(queue, currentPage, tracksToDisplay)}`
            ];

            responseEmbed.setDescription(newEmbedDescription.join(''));
            responseEmbed.setFooter({
                text: totalPages === 1 ? 'Page 1 of 1' : `Page ${currentPage + 1} of ${totalPages}`
            });

            buttonsBuilders[0].setDisabled(currentPage === 0 ?? queueSize === 0);
            buttonsBuilders[1].setDisabled(currentPage === 0 ?? queueSize === 0);
            buttonsBuilders[2].setDisabled(currentPage === totalPages - 1 ?? queueSize === 0);
            buttonsBuilders[3].setDisabled(currentPage === totalPages - 1 ?? queueSize === 0);

            await button
                .update({
                    embeds: [responseEmbed],
                    components: [actionRow]
                })
                .catch(() => {});
        });

        collector.on('end', async () => {
            await response
                .edit({
                    components: []
                })
                .catch(() => {});
        });
    }
}
