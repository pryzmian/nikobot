import { SearchResult, Track, useMainPlayer, useQueue } from 'discord-player';
import { lyricsExtractor, LyricsData } from '@discord-player/extractor';
import { BaseCommand } from '../structures/commands/Command.js';
import {
    CacheType,
    ChatInputCommandInteraction,
    ColorResolvable,
    EmbedBuilder,
    GuildMember,
    InteractionResponse,
    Message,
    SlashCommandBuilder
} from 'discord.js';

export default class LyricsCommand extends BaseCommand {
    public constructor() {
        super({
            isBeta: true,
            data: new SlashCommandBuilder()
                .setName('lyrics')
                .setDescription('Get the lyrics of a song')
                .addStringOption((option) =>
                    option.setName('song').setDescription('The name of the song').setRequired(false)
                )
        });
    }

    public async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
        const memberChannel = (interaction.member as GuildMember).voice.channel;
        const botChannel = interaction.guild?.members.me?.voice.channel;

        if (!memberChannel) {
            await this.sendEmbedResponse(interaction, 'You need to be in a voice channel to get the lyrics!', 'Red');
            return;
        }

        if (botChannel && memberChannel.id !== botChannel.id) {
            await this.sendEmbedResponse(
                interaction,
                'You need to be in the same voice channel as me to get the lyrics!',
                'Red'
            );
            return;
        }

        const queue = useQueue(interaction.guildId!);
        let lyricsToFind: string | null = interaction.options.getString('song');

        if (!lyricsToFind && !queue?.currentTrack) {
            await this.sendEmbedResponse(
                interaction,
                'Please provide a song name or play a song to get the lyrics!',
                'Red'
            );
            return;
        }

        if (!lyricsToFind && queue?.currentTrack) {
            lyricsToFind = queue.currentTrack.title;
        }

        const playerResult = await this.getPlayerSearch(lyricsToFind!);
        const lyricsData = await this.getGeniusLyrics(playerResult!.toString());

        console.log(lyricsData);

        if (!lyricsData) {
            await this.sendEmbedResponse(interaction, 'No lyrics found for this song', 'Red');
            return;
        }

        await this.sendEmbedResponse(interaction, 'Sending lyrics...', 'Green');
    }

    private async sendEmbedResponse(
        interaction: ChatInputCommandInteraction<CacheType>,
        response: string,
        color: ColorResolvable
    ): Promise<InteractionResponse<boolean> | Message<boolean>> {
        const embedResponse = new EmbedBuilder();
        embedResponse.setDescription(response).setColor(color);
        return await interaction[interaction.deferred ? 'editReply' : 'reply']({ embeds: [embedResponse.toJSON()] });
    }

    private async getPlayerSearch(song: string): Promise<Track | null> {
        try {
            const player = useMainPlayer();
            const result: SearchResult = await player.search(song);

            if (!result.tracks.length) {
                return null;
            }

            return result.tracks.map((track) => track)[0];
        } catch (error) {
            console.error('Error getting player search: ', error);
            return null;
        }
    }

    private async getGeniusLyrics(song: string): Promise<LyricsData | null> {
        try {
            const lyrics = lyricsExtractor(process.env.GENIUS_API_KEY!, true);
            return await lyrics.search(song);
        } catch (error) {
            console.error('Error getting lyrics from Genius: ', error);
            return null;
        }
    }
}
