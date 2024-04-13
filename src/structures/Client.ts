import {
    ActivityType,
    Client,
    Collection,
    GatewayIntentBits,
    Options,
    Partials,
    PresenceUpdateStatus,
    PresenceStatusData
} from 'discord.js';
import { registerAutocomplete } from '../utils/registry/autocomplete.js';
import { registerCommands } from '../utils/registry/commands.js';
import { registerComponents } from '../utils/registry/components.js';
import { BaseAutocomplete } from './Autocomplete.js';
import { BaseCommand } from './Command.js';
import { BaseComponent } from './Component.js';
import { registerEvents } from '../utils/registry/events.js';
import { NikoPlayer } from './Player.js';
import { connectToDatabase } from '../database/index.js';

export class NikoClient extends Client {
    public readonly commands: Collection<string, BaseCommand>;
    public readonly components: Collection<string, BaseComponent>;
    public readonly autocomplete: Collection<string, BaseAutocomplete>;
    public readonly player: NikoPlayer;

    public constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ],
            makeCache: Options.cacheWithLimits({
                ...Options.DefaultMakeCacheSettings,
                MessageManager: 10, // Reduce cache size for messages
                ThreadManager: 10, // Reduce cache size for threads
                GuildMemberManager: {
                    maxSize: 50,
                    keepOverLimit: (member) => member.id === this.user?.id
                }
            }),
            partials: [Partials.Message, Partials.User, Partials.Channel, Partials.GuildMember],
            allowedMentions: {
                parse: ['users'],
                repliedUser: false
            },
            sweepers: {
                ...Options.DefaultSweeperSettings,
                users: {
                    interval: 3_600,
                    filter: () => (user) => user.bot && user.id !== this.user?.id // Remove bot users
                },
                messages: {
                    interval: 3_600, // every hour
                    lifetime: 432000 // Remove messages older than 5 days
                },
                guildMembers: {
                    interval: 3_600,
                    filter: () => (member) => member.user.bot && member.user.id !== this.user?.id // Remove bot members
                }
            },
            presence: {
                activities: [
                    {
                        name: 'your prompts',
                        state: 'Pero oiga, sea serio pues 💢',
                        type: ActivityType.Streaming,
                        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                ],
                status: PresenceUpdateStatus.Offline as PresenceStatusData
            }
        });

        this.commands = new Collection();
        this.components = new Collection();
        this.autocomplete = new Collection();
        this.player = new NikoPlayer(this);
    }

    public static getInstance(): NikoClient {
        return new NikoClient();
    }

    public override async login(token: string): Promise<string> {
        await Promise.all([
            registerAutocomplete(this),
            registerCommands(this),
            registerComponents(this),
            registerEvents(this),
            this.player.init(),
            connectToDatabase()
        ]);

        return super.login(token);
    }
}
