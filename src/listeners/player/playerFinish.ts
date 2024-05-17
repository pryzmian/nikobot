import { GuildQueue, GuildQueueEvent } from 'discord-player';
import { NikoClient } from '../../structures/Client.js';
import { BaseEvent } from '../../structures/events/Event.js';
import { IQueueMetadata } from '../../types/queueMetadata.js';
import { Message } from 'discord.js';

export default class PlayerFinishEvent extends BaseEvent {
    public constructor(client: NikoClient) {
        super(client, {
            name: GuildQueueEvent.playerFinish,
            emitter: client.player.events
        });
    }

    public async execute(queue: GuildQueue<IQueueMetadata>) {
        const { lastPlayerStartMessage, channel } = queue.metadata;

        if (!channel) {
            return;
        }

        if (!channel.permissionsFor(this.client.user!)?.has(['ReadMessageHistory', 'ViewChannel'])) {
            console.error('playerFinish listener: Missing permissions to read message history or view channel.');
            return;
        }

        let fetchLastAnnounceMessage: Message | null = null;

        if (lastPlayerStartMessage?.id) {
            fetchLastAnnounceMessage = await queue.metadata?.channel.messages.fetch(lastPlayerStartMessage.id);
        }

        if (fetchLastAnnounceMessage && fetchLastAnnounceMessage.deletable) {
            try {
                await fetchLastAnnounceMessage.delete();
            } catch (error) {
                if (error instanceof Error) {
                    console.error('playerFinish name: Error deleting previous now-playing message.', error);
                }
            }
        }
    }
}
