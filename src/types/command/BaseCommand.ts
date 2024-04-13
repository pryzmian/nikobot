import { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from 'discord.js';

export type CommandBase = {
    isDev?: boolean | undefined;
    isBeta?: boolean | undefined;
    isSystemCommand?: boolean | undefined;
    data: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> | SlashCommandSubcommandsOnlyBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void> | void;
};
