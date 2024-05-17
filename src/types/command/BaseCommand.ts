import { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from 'discord.js';

export type CommandBase = {
    isDev?: boolean | undefined;
    isBeta?: boolean | undefined;
    isSystemCommand?: boolean | undefined;
    data: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> | SlashCommandOptionsOnlyBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void> | void;
};
