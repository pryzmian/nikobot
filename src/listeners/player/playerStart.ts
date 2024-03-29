import { GuildQueue, GuildQueueEvent, Track } from 'discord-player';
import { NikoClient } from '../../NikoClient.js';
import { BaseEvent } from '../../structures/Event.js';

export default class PlayerStartEvent extends BaseEvent {
  constructor(client: NikoClient) {
    super(client, {
      event: GuildQueueEvent.playerStart,
      emitter: client.player.events,
      once: false
    });
  }

  public run(queue: GuildQueue, track: Track) {
    console.log(`Track ${track.title} started playing in ${queue.guild.name}`);
  }
}
