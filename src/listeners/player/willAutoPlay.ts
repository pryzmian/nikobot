import { GuildQueue, GuildQueueEvent, Track } from 'discord-player';
import { NikoClient } from '../../structures/Client.js';
import { BaseEvent } from '../../structures/events/Event.js';
import { User } from 'discord.js';

export default class WillAutoPlayEvent extends BaseEvent {
    public constructor(client: NikoClient) {
        super(client, {
            name: GuildQueueEvent.willAutoPlay,
            emitter: client.player.events
        });
    }

    public async execute(
        queue: GuildQueue,
        tracks: Array<Track<unknown>>,
        done: (track: Track<unknown> | null) => void
    ) {
        const [track] = tracks;
        track.requestedBy = this.client.user as User;
        done(track);
    }
}
