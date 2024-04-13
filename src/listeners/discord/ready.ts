import { BaseEvent } from '../../structures/Event.js';
import { NikoClient } from '../../structures/Client.js';
import { Events } from 'discord.js';

export default class ReadyEvent extends BaseEvent {
    /**
     * Creates an instance of ReadyEvent.
     * @param {NikoClient} client - The client instance.
     */
    constructor(client: NikoClient) {
        super(client, {
            event: Events.ClientReady,
            once: true
        });
    }

    /**
     * Executes the ready event handler.
     * @param {NikoClient} client - The client instance.
     * @returns {void} This method does not return a value.
     */
    public execute(client: NikoClient): void {
        console.log(`${client.user?.username} is now ready!`);
    }
}
