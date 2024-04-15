import { GuildQueue, GuildQueueEvent, Track } from 'discord-player';
import { NikoClient } from '../../structures/Client.js';
import { BaseEvent } from '../../structures/Event.js';
import { IQueueMetadata } from '../../types/queueMetadata.js';
import { Message } from 'discord.js';

export default class WillAutoPlayEvent extends BaseEvent {
    public constructor(client: NikoClient) {
        super(client, {
            event: GuildQueueEvent.willAutoPlay,
            emitter: client.player.events,
            once: false
        });
    }

    public async execute(queue: GuildQueue<IQueueMetadata>, tracks: Track[], done: (track: Track) => void) {
        const [track] = tracks;
        track.requestedBy = this.client.user;
        done(track);
    }
}
