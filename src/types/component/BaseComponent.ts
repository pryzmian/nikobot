import { ComponentType, MessageComponentInteraction } from 'discord.js';

export interface ComponentBase {
  name: string;
  type: ComponentType;
  execute: (interaction: MessageComponentInteraction) => Promise<void> | void;
}