import { EventEmitter } from 'node:events';

export type EventOptions = {
    emitter?: EventEmitter | null;
    name: string | symbol;
    once?: boolean | undefined;
};
