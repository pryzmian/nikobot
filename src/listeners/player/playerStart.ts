import { GuildQueue, GuildQueueEvent, Track } from 'discord-player';
import { NikoClient } from '../../structures/Client.js';
import { BaseEvent } from '../../structures/events/Event.js';
import { IQueueMetadata } from '../../types/queueMetadata.js';
import {
    APIActionRowComponent,
    APIEmbed,
    APIMessageActionRowComponent,
    ButtonStyle,
    ColorResolvable,
    ComponentType,
    EmbedBuilder,
    escapeMarkdown
} from 'discord.js';
import { createButton } from '../../utils/functions/createButton.js';

export default class PlayerStartEvent extends BaseEvent {
    constructor(client: NikoClient) {
        super(client, {
            name: GuildQueueEvent.playerStart,
            emitter: client.player.events
        });
    }

    public async execute(queue: GuildQueue<IQueueMetadata>, track: Track): Promise<void> {
        const { channel } = queue.metadata;
        const fetchedChannel = await this.client.channels.fetch(channel.id);

        if (!fetchedChannel) {
            console.error('playerStart listener: Channel not found.');
            return;
        }

        if (!channel.permissionsFor(this.client.user!)?.has(['SendMessages', 'ViewChannel'])) {
            console.error('playerStart listener: Missing permissions to send messages or view channel.');
            return;
        }

        try {
            const nowPlayingEmbed = this.buildNowPlayingEmbed(track, '#2B2D31');
            const actionRow: APIActionRowComponent<APIMessageActionRowComponent> = {
                type: ComponentType.ActionRow,
                components: []
            };

            createButton(`previous-button_${track.id}`, this.icons.previous, ButtonStyle.Secondary, actionRow);
            createButton(`pause-button_${track.id}`, this.icons.pause, ButtonStyle.Secondary, actionRow);
            createButton(`next-button_${track.id}`, this.icons.next, ButtonStyle.Secondary, actionRow);

            const announceMessage = await channel.send({
                embeds: [nowPlayingEmbed],
                components: [actionRow]
            });

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
            .setDescription(`**Now playing ♪**\n[**${track.title}**](${escapeMarkdown(track.url)})`)
            .setThumbnail(track.thumbnail)
            .toJSON();
    }
}
