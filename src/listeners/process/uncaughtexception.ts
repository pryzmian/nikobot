import { BaseEvent } from '../../structures/Event.js';
import { NikoClient } from '../../structures/Client.js';
import { Events } from 'discord.js';

export default class ReadyEvent extends BaseEvent {
  constructor(client: NikoClient) {
    super(client, {
      emitter: process,
      event: Events.ClientReady,
      once: true
    });
  }

  public run(err: Error, origin: string) {
    console.error(`Uncaught Exception: ${err} at ${origin}`);
  }
}
