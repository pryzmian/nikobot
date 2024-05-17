import { BaseEvent } from '../../structures/events/Event.js';
import { NikoClient } from '../../structures/Client.js';
import { Events } from 'discord.js';

export default class ReadyEvent extends BaseEvent {
    constructor(client: NikoClient) {
        super(client, {
            emitter: process,
            name: Events.ClientReady
        });
    }

    public execute(err: Error, origin: string) {
        console.error(`Uncaught Exception: ${err} at ${origin}`);
    }
}
