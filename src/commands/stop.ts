import { BaseCommand } from '../structures/commands/Command.js';
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, GuildMember } from 'discord.js';
import { useQueue } from 'discord-player';

export default class StopCommand extends BaseCommand {
    public constructor() {
        super({
            isBeta: true,
            data: new SlashCommandBuilder().setName('stop').setDescription('Stops the current queue.')
        });
    }

    public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const memberChannel = (interaction.member as GuildMember).voice.channel;
        const botChannel = interaction.guild?.members.me?.voice.channel;
        const embedResponse = new EmbedBuilder();

        // Check if the member is in a voice channel
        if (!memberChannel) {
            embedResponse.setDescription('You need to be in a voice channel to play music!').setColor('Red');
            await interaction.reply({ embeds: [embedResponse], ephemeral: true });
            return;
        }

        // Check if the bot is in a voice channel
        if (botChannel && memberChannel.id !== botChannel.id) {
            embedResponse
                .setDescription('You need to be in the same voice channel as me to play music!')
                .setColor('Red');
            await interaction.reply({ embeds: [embedResponse], ephemeral: true });
            return;
        }

        const queue = useQueue(interaction.guildId!);

        if (!queue || !queue.currentTrack) {
            embedResponse.setDescription('There is no queue to stop!').setColor('Red');
            await interaction.reply({ embeds: [embedResponse], ephemeral: true });
            return;
        }

        try {
            queue?.node.stop();
            embedResponse.setDescription('Stopped the queue!').setColor('Green');
            await interaction.reply({ embeds: [embedResponse] });
        } catch (error) {
            console.error(error, 'There was an issue stopping the queue');
        }
    }
}
