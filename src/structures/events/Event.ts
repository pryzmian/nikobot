import EventEmitter from 'node:events';
import { EventOptions } from '../../types/event/EventOptions.js';
import { Base } from '../Base.js';
import { ClientEvents } from 'discord.js';
import { NikoClient } from '../Client.js';

export abstract class BaseEvent<E = keyof ClientEvents | symbol> extends Base {
    public readonly emitter?: EventEmitter | null;
    public readonly name: string | symbol;
    public readonly once?: boolean | false;

    constructor(public client: NikoClient, options: EventOptions) {
        super();
        this.emitter = this.resolveEmitter(options.emitter as EventEmitter);
        this.name = options.name ?? this.client;
        this.once = options.once ?? false;
    }

    private resolveEmitter(emitter: EventEmitter): EventEmitter | null {
        if (typeof emitter === 'string') {
            return (Reflect.get(this.client, emitter) as EventEmitter) || null;
        }
        return emitter ?? this.client;
    }

    public abstract execute(...args: E extends keyof ClientEvents ? ClientEvents[E] : unknown[]): unknown;
}