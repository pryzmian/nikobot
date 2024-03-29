import { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from 'discord.js';

export interface CommandOptions {
  isDev?: boolean;
  isBeta?: boolean;
  isSystemCommand?: boolean;
  data: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> | SlashCommandSubcommandsOnlyBuilder;
}