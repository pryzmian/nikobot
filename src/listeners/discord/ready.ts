import { BaseEvent } from '../../structures/Event.js';
import { NikoClient } from '../../structures/Client.js';
import { Events } from 'discord.js';

export default class ReadyEvent extends BaseEvent {
  constructor(client: NikoClient) {
    super(client, {
      event: Events.ClientReady,
      once: true
    });
  }

  public run(client: NikoClient) {
    console.log(`Logged in as ${client.user?.username}`);
  }
}
