import { SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from 'discord.js';

export type CommandOptions = {
    isDev?: boolean | undefined;
    isBeta?: boolean | undefined;
    isSystemCommand?: boolean | undefined;
    data: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> | SlashCommandOptionsOnlyBuilder;
};
