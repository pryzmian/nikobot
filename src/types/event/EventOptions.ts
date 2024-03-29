import { EventEmitter } from 'node:events';

export interface EventOptions {
  emitter?: EventEmitter | null;
  event: string | symbol;
  once: boolean;
}
