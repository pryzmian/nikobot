import { GuildQueue, GuildQueueEvent, Track } from 'discord-player';
import { NikoClient } from '../../structures/Client.js';
import { BaseEvent } from '../../structures/Event.js';
import { BaseGuildTextChannel } from 'discord.js';

export default class PlayerStartEvent extends BaseEvent {
  constructor(client: NikoClient) {
    super(client, {
      event: GuildQueueEvent.playerStart,
      emitter: client.player.events,
      once: false
    });
  }

  public async run(queue: GuildQueue<{ channel: BaseGuildTextChannel }>, track: Track): Promise<void> {
    await queue.metadata.channel.send(`🎶 | Now playing: **${track.title}** in **${queue.channel?.name}**!`);
  }
}
