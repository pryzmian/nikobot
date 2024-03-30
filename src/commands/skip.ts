import { Track, useQueue } from 'discord-player';
import { BaseCommand } from '../structures/Command.js';
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, GuildMember } from 'discord.js';

export default class SkipCommand extends BaseCommand {
    public constructor() {
        super({
            isBeta: true,
            data: new SlashCommandBuilder()
                .setName('skip')
                .setDescription('Skips the current song.')
                .addIntegerOption((option) =>
                    option.setName('position').setDescription('The position of the song to skip to.').setRequired(false)
                )
        });
    }

    public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const memberChannel = (interaction.member as GuildMember).voice.channel;
        const botChannel = interaction.guild?.members.me?.voice.channel;
        const embedResponse = new EmbedBuilder();

        // Check if the member is in a voice channel
        if (!memberChannel) {
            embedResponse.setDescription('You need to be in a voice channel to skip a song!').setColor('Red');
            await interaction.reply({ embeds: [embedResponse], ephemeral: true });
            return;
        }

        // Check if the bot is in a voice channel
        if (botChannel && memberChannel.id !== botChannel.id) {
            embedResponse
                .setDescription('You need to be in the same voice channel as me to skip the song!')
                .setColor('Red');
            await interaction.reply({ embeds: [embedResponse], ephemeral: true });
            return;
        }

        const queue = useQueue(interaction.guildId!);
        const position = interaction.options.getInteger('position')!;
        const songToSkip = queue?.tracks.toArray()[position - 1] as Track;

        if (!queue) {
            embedResponse.setDescription('There is no queue to skip!').setColor('Red');
            await interaction.reply({ embeds: [embedResponse], ephemeral: true });
            return;
        }

        if (queue && !queue.currentTrack) {
            embedResponse.setDescription('There is no song currently playing you can skip!').setColor('Red');
            await interaction.reply({ embeds: [embedResponse], ephemeral: true });
            return;
        }

        if (queue && queue.tracks.size === 0) {
            embedResponse.setDescription('There are no songs in the queue to skip!').setColor('Red');
            await interaction.reply({ embeds: [embedResponse], ephemeral: true });
            return;
        }

        if (position && !songToSkip) {
            embedResponse.setDescription(`There is no song at position ${position} to skip to!`).setColor('Red');
            await interaction.reply({ embeds: [embedResponse], ephemeral: true });
            return;
        }

        try {
            if (position) {
                queue.node.skipTo(position - 1);

                embedResponse.setDescription(`Skipped to **${songToSkip.title}**!`).setColor('Green');
                await interaction.reply({ embeds: [embedResponse] });
                return;
            } else {
                queue.node.skip();
                embedResponse.setDescription('Skipped the current song!').setColor('Green');
                await interaction.reply({ embeds: [embedResponse] });
            }
        } catch (error) {
            console.error(error, 'There was an issue skipping the song.');
        }
    }
}
