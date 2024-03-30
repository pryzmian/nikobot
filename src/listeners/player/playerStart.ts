import { GuildQueue, GuildQueueEvent, Track } from 'discord-player';
import { NikoClient } from '../../structures/Client.js';
import { BaseEvent } from '../../structures/Event.js';
import { IQueueMetadata } from '../../types/queueMetadata.js';
import { APIEmbed, ColorResolvable, EmbedBuilder, BaseGuildTextChannel } from 'discord.js';

export default class PlayerStartEvent extends BaseEvent {
    constructor(client: NikoClient) {
        super(client, {
            event: GuildQueueEvent.playerStart,
            emitter: client.player.events,
            once: false
        });
    }

    public async execute(queue: GuildQueue<IQueueMetadata>, track: Track): Promise<void> {
        const { channel } = queue.metadata;

        if (!channel) {
            console.error('playerStart listener: Channel not found.');
            return;
        }

        if (!(channel instanceof BaseGuildTextChannel)) {
            console.error('playerStart listener: Channel is not a text channel.');
            return;
        }

        if (!channel.permissionsFor(this.client.user!)?.has(['SendMessages', 'ViewChannel'])) {
            console.error('playerStart listener: Missing permissions to send messages or view channel.');
            return;
        }

        const nowPlayingEmbed = this.buildNowPlayingEmbed(track, queue.guild.members.me?.displayHexColor);

        try {
            const announceMessage = await channel.send({ embeds: [nowPlayingEmbed] });

            if (queue.metadata && announceMessage) {
                queue.metadata.lastPlayerStartMessage = announceMessage;
            }
        } catch (error) {
            console.error('playerStart listener: An error occurred while sending the now playing message:', error);
        }
    }

    private buildNowPlayingEmbed(track: Track, color: ColorResolvable | undefined): APIEmbed {
        return new EmbedBuilder()
            .setColor(color!)
            .setAuthor({
                name: track.requestedBy?.username || 'Unknown User',
                iconURL: track.requestedBy?.displayAvatarURL() || undefined
            })
            .setDescription(`**Now playing ♪**\n[**${track.title}**](${track.url})`)
            .setThumbnail(track.thumbnail)
            .toJSON();
    }
}
