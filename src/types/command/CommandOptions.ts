import { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from 'discord.js';

export type CommandOptions = {
    isDev?: boolean;
    isBeta?: boolean;
    isSystemCommand?: boolean;
    data: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> | SlashCommandSubcommandsOnlyBuilder;
};
