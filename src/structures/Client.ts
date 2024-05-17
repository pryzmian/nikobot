import { ActivityType, Client, Collection, GatewayIntentBits, Options, Partials } from 'discord.js';
import { registerAutocomplete } from '../utils/registry/autocomplete.js';
import { registerCommands } from '../utils/registry/commands.js';
import { registerComponents } from '../utils/registry/components.js';
import { BaseAutocomplete } from './autocomplete/Autocomplete.js';
import { BaseCommand } from './commands/Command.js';
import { BaseComponent } from './components/Component.js';
import { registerEvents } from '../utils/registry/events.js';
import { NikoPlayer } from './Player.js';
import Redis from 'ioredis';

export class NikoClient extends Client {
    public readonly commands: Collection<string, BaseCommand>;
    public readonly components: Collection<string, BaseComponent>;
    public readonly autocomplete: Collection<string, BaseAutocomplete>;
    public readonly player: NikoPlayer;
    public readonly redis: Redis;

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
                GuildMemberManager: {
                    maxSize: 100,
                    keepOverLimit: (member) => member.id === this.user?.id
                },
                MessageManager: {
                    maxSize: 200,
                    keepOverLimit: (user) => user.id !== this.user?.id
                },
                UserManager: {
                    maxSize: 50,
                    keepOverLimit: (user) => user.id !== this.user?.id
                },
                ReactionManager: 0,
                ThreadManager: 0,
                PresenceManager: 0,
                DMMessageManager: 0,
                GuildBanManager: 0,
                GuildEmojiManager: 0,
                GuildInviteManager: 0,
                GuildStickerManager: 0,
                ReactionUserManager: 0,
                ThreadMemberManager: 0,
                StageInstanceManager: 0,
                BaseGuildEmojiManager: 0,
                GuildTextThreadManager: 0,
                GuildForumThreadManager: 0,
                AutoModerationRuleManager: 0,
                GuildScheduledEventManager: 0,
                GuildMessageManager: 0
            }),
            partials: [Partials.Message, Partials.User, Partials.Channel, Partials.GuildMember],
            allowedMentions: {
                parse: ['users'],
                repliedUser: false
            },
            sweepers: {
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
                        name: 'idk, music?',
                        type: ActivityType.Listening
                    }
                ]
            }
        });

        this.commands = new Collection();
        this.components = new Collection();
        this.autocomplete = new Collection();
        this.redis = new Redis({
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT),
            password: process.env.REDIS_PASSWORD,
            lazyConnect: true
        });
        this.player = new NikoPlayer(this);
    }

    public override async login(token: string): Promise<string> {
        await Promise.all([
            registerAutocomplete(this),
            registerCommands(this),
            registerComponents(this),
            registerEvents(this),
            this.redis.connect(),
            this.player.init()
        ]);

        return super.login(token);
    }
}

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DISCORD_BOT_TOKEN: string;
            DISCORD_APPLICATION_ID: string;
            GOOGLE_GEMINI_API_KEY: string;
            REDIS_HOST: string;
            REDIS_PORT: number;
            REDIS_PASSWORD: string;
            DATABASE_URI: string;
            YOUTUBE_COOKIE: string;
        }
    }
}
