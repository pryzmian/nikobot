import { EventEmitter } from 'node:events';

export type EventOptions = {
    emitter?: EventEmitter | null;
    event: string | symbol;
    once: boolean;
};
