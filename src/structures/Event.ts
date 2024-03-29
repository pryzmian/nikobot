import EventEmitter from 'node:events';
import { EventOptions } from '../types/event/EventOptions.js';
import { Base } from './Base.js';
import { ClientEvents } from 'discord.js';
import { NikoClient } from '../NikoClient.js';

export abstract class BaseEvent<E = keyof ClientEvents | symbol> extends Base {
  public readonly client: NikoClient;
  public readonly emitter: EventEmitter | null;
  public readonly event: string | symbol;
  public readonly once: boolean;

  constructor(client: NikoClient, options: EventOptions) {
    super();
    this.client = client;
    this.emitter = this.resolveEmitter(options.emitter as EventEmitter);
    this.event = options.event ?? this.client;
    this.once = options.once ?? false;
  }

  private resolveEmitter(emitter: EventEmitter): EventEmitter | null {
    if (typeof emitter === 'string') {
      return (Reflect.get(this.client, emitter) as EventEmitter) || null;
    }
    return emitter ?? this.client;
  }

  public abstract run(...args: E extends keyof ClientEvents ? ClientEvents[E] : unknown[]): unknown;
}