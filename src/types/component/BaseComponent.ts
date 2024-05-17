import { MessageComponentInteraction } from 'discord.js';

export type ComponentBase = {
    name: string;
    execute: (params: BaseComponentParams) => Promise<void> | void;
};

export type BaseComponentParams = {
    interaction: MessageComponentInteraction;
    referenceId?: string;
};
