import { BaseCommand } from '../structures/Command.js';
import { useQueue } from 'discord-player';
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, GuildMember, CacheType } from 'discord.js';

export default class VolumeCommand extends BaseCommand {
    public constructor() {
        super({
            isBeta: true,
            data: new SlashCommandBuilder()
                .setName('volume')
                .setDescription('Sets the volume of the player.')
                .addIntegerOption((option) =>
                    option
                        .setName('volume')
                        .setDescription('The volume to set the player to.')
                        .setMinValue(1)
                        .setMaxValue(100)
                        .setRequired(true)
                )
        });
    }

    public async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
        const memberChannel = (interaction.member as GuildMember).voice.channel;
        const botChannel = interaction.guild?.members.me?.voice.channel;
        const embedResponse = new EmbedBuilder();

        // Check if the member is in a voice channel
        if (!memberChannel) {
            embedResponse.setDescription('You need to be in a voice channel to set the volume!').setColor('Red');
            await interaction.reply({ embeds: [embedResponse.toJSON()], ephemeral: true });
            return;
        }

        // Check if the bot is in a voice channel
        if (botChannel && memberChannel.id !== botChannel.id) {
            embedResponse
                .setDescription('You need to be in the same voice channel as me to set the volume!')
                .setColor('Red');
            await interaction.reply({ embeds: [embedResponse.toJSON()], ephemeral: true });
            return;
        }

        const queue = useQueue(interaction.guildId!);
        const volumeValue = interaction.options.getInteger('volume') as number;

        try {
            if (volumeValue === 1) {
                queue?.node.pause();
                embedResponse
                    .setDescription('The volume has been set to 1. Because of this, the player has been paused.')
                    .setColor('Green');
                await interaction.reply({ embeds: [embedResponse.toJSON()] });
                return;
            }

            if (volumeValue > 1 && queue?.node.isPaused()) {
                queue?.node.resume();
                queue.node.setVolume(volumeValue);
                embedResponse.setDescription(`The volume has been set to ${volumeValue}.`).setColor('Green');
                await interaction.reply({ embeds: [embedResponse.toJSON()] });
                return;
            }

            queue?.node.setVolume(volumeValue);
            embedResponse.setDescription(`The volume has been set to ${volumeValue}.`).setColor('Green');
            await interaction.reply({ embeds: [embedResponse.toJSON()] });
        } catch (error) {
            if (error instanceof Error) {
                console.error(
                    `An error occurred while setting the volume for ${interaction.guild?.name} (${interaction.guildId}): ${error.stack}`
                );
                embedResponse
                    .setDescription(`An error occurred while setting the volume: ${error.message}`)
                    .setColor('Red');
                await interaction.reply({ embeds: [embedResponse.toJSON()], ephemeral: true });
                return;
            }
        }
    }
}
