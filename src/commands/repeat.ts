import { GuildQueue, QueueRepeatMode, useQueue } from 'discord-player';
import { BaseCommand } from '../structures/commands/Command.js';
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, GuildMember } from 'discord.js';

export default class RepeatCommand extends BaseCommand {
    public constructor() {
        super({
            isBeta: true,
            data: new SlashCommandBuilder()
                .setName('repeat')
                .setDescription('Change the repeat mode of the current queue.')
                .addIntegerOption((option) =>
                    option
                        .setName('mode')
                        .setDescription('The repeat mode to set.')
                        .addChoices(
                            { name: 'Track', value: QueueRepeatMode.TRACK },
                            { name: 'Queue', value: QueueRepeatMode.QUEUE },
                            { name: 'Off', value: QueueRepeatMode.OFF }
                        )
                )
        });
    }

    public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const memberChannel = (interaction.member as GuildMember).voice.channel;
        const botChannel = interaction.guild?.members.me?.voice.channel;
        const embedResponse = new EmbedBuilder();

        // Check if the member is in a voice channel
        if (!memberChannel) {
            embedResponse
                .setDescription('You need to be in a voice channel to change the repeat mode!')
                .setColor('Red');
            await interaction.reply({ embeds: [embedResponse], ephemeral: true });
            return;
        }

        // Check if the bot is in a voice channel
        if (botChannel && memberChannel.id !== botChannel.id) {
            embedResponse
                .setDescription('You need to be in the same voice channel as me to change the repeat mode!')
                .setColor('Red');
            await interaction.reply({ embeds: [embedResponse], ephemeral: true });
            return;
        }

        const queue = useQueue(interaction.guildId!);
        const mode = interaction.options.getInteger('mode');

        if (!queue) {
            embedResponse.setDescription('There is no queue to change the repeat mode!').setColor('Red');
            await interaction.reply({ embeds: [embedResponse], ephemeral: true });
            return;
        }

        if (queue && !queue.currentTrack) {
            embedResponse
                .setDescription('There is no song currently playing to change the repeat mode!')
                .setColor('Red');
            await interaction.reply({ embeds: [embedResponse], ephemeral: true });
            return;
        }

        try {
            switch (mode) {
                case QueueRepeatMode.TRACK:
                    queue.setRepeatMode(QueueRepeatMode.TRACK);
                    embedResponse.setDescription('The repeat mode has been set to `Track`!').setColor('Green');
                    break;
                case QueueRepeatMode.QUEUE:
                    queue.setRepeatMode(QueueRepeatMode.QUEUE);
                    embedResponse.setDescription('The repeat mode has been set to `Queue`!').setColor('Green');
                    break;
                case QueueRepeatMode.OFF:
                    queue.setRepeatMode(QueueRepeatMode.OFF);
                    embedResponse.setDescription('The repeat mode has been set to `Off`!').setColor('Green');
                    break;
                default:
                    embedResponse
                        .setDescription(`The repeat mode is currently set to \`${this.getRepeatModeString(queue)}\`!`)
                        .setColor('Blue');
                    break;
            }

            await interaction.reply({ embeds: [embedResponse.toJSON()] });
        } catch (error) {
            if (error instanceof Error) {
                embedResponse.setDescription(error.message).setColor('Red');
                await interaction.reply({ embeds: [embedResponse.toJSON()], ephemeral: true });
            }
        }
    }

    private getRepeatModeString(queue: GuildQueue): string {
        return QueueRepeatMode[queue.repeatMode].toLowerCase();
    }
}
