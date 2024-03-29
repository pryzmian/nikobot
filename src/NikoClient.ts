import { Client, Collection, GatewayIntentBits, Options } from 'discord.js';
import { registerAutocomplete } from './utils/registry/autocomplete.js';
import { registerCommands } from './utils/registry/commands.js';
import { registerComponents } from './utils/registry/components.js';
import { BaseAutocomplete } from './structures/Autocomplete.js';
import { BaseCommand } from './structures/Command.js';
import { BaseComponent } from './structures/Component.js';
import type { Player } from 'discord-player';
import { registerEvents } from './utils/registry/events.js';
import { NikoPlayer } from './structures/Player.js';

export class NikoClient extends Client {
  public readonly commands: Collection<string, BaseCommand>;
  public readonly components: Collection<string, BaseComponent>;
  public readonly autocomplete: Collection<string, BaseAutocomplete>;
  public readonly player: NikoPlayer;

  public constructor() {
    super({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates],
      makeCache: Options.cacheWithLimits({
        ...Options.DefaultMakeCacheSettings,
        MessageManager: 10, // Reduce cache size for messages
        ThreadManager: 10, // Reduce cache size for threads
        GuildMemberManager: {
          maxSize: 50,
          keepOverLimit: (member) => member.id === this.user?.id
        }
      }),
      sweepers: Options.DefaultSweeperSettings
    });

    this.commands = new Collection();
    this.components = new Collection();
    this.autocomplete = new Collection();
    this.player = new NikoPlayer(this);
  }

  public override async login(token: string): Promise<string> {
    await Promise.all([
      registerAutocomplete(this),
      registerCommands(this),
      registerComponents(this),
      registerEvents(this),
      this.player.init()
    ]);

    return super.login(token);
  }
}

declare module 'discord.js' {
  interface Client {
    readonly player: Player;
  }
}
