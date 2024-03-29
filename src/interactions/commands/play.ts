import { ChatInputCommandInteraction, EmbedBuilder, GuildMember, SlashCommandBuilder, VoiceChannel } from 'discord.js';
import { BaseCommand } from '../../structures/Command.js';
import { useMainPlayer, QueueRepeatMode } from 'discord-player';

export default class PingCommand extends BaseCommand {
  public constructor() {
    super({
      isBeta: true,
      data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song')
        .addStringOption((option) => option.setName('song').setDescription('The song to play').setRequired(true))
    });
  }

  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Extract member and bot voice channels
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
      embedResponse.setDescription('You need to be in the same voice channel as me to play music!').setColor('Red');
      await interaction.reply({ embeds: [embedResponse], ephemeral: true });
      return;
    }

    // Get the song to play
    const player = useMainPlayer();
    const song = interaction.options.getString('song') as string;

    await interaction.deferReply();

    const searchResult = await player.search(song, {
      requestedBy: interaction.user
    });

    if (!searchResult.tracks.length || searchResult.isEmpty()) {
      embedResponse.setDescription('No tracks found!').setColor('Red');
      await interaction.editReply({ embeds: [embedResponse] });
      return;
    }

    const track = await player.play(memberChannel, searchResult, {
      nodeOptions: {
        leaveOnEmptyCooldown: 180000,
        leaveOnEnd: false,
        leaveOnStop: false,
        volume: 50,
        metadata: {
          client: interaction.client,
          channel: interaction.channel,
          requestedBy: interaction.user
        }
      }
    });

    await interaction.editReply({ content: `Now playing requested query!` });
  }
}
