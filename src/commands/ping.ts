import { BaseCommand } from '../structures/commands/Command.js';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export default class PingCommand extends BaseCommand {
    public constructor() {
        super({
            isBeta: true,
            data: new SlashCommandBuilder().setName('ping').setDescription("Check the bot's latency")
        });
    }

    public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.reply({ content: `Pong! ${interaction.client.ws.ping}ms`, ephemeral: true });
    }
}
