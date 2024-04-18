import type { AutocompleteInteraction } from 'discord.js';
import { BaseAutocomplete } from '../structures/Autocomplete.js';
import { useMainPlayer } from 'discord-player';

export default class PingAutocomplete extends BaseAutocomplete {
    public constructor() {
        super({
            name: 'play'
        });
    }

    public async execute(interaction: AutocompleteInteraction): Promise<void> {
        const song = interaction.options.getString('song');
        if (!song) {
            await interaction.respond([]);
            return;
        }

        const player = useMainPlayer();
        const searchResults = await player.search(song, {
            requestedBy: interaction.user,
            fallbackSearchEngine: 'youtubeSearch'
        });

        let tracks;

        if (searchResults.hasPlaylist()) {
            tracks = [
                {
                    name: `Playlist: ${searchResults.playlist!.title}`,
                    value: searchResults.playlist!.url
                }
            ].slice(0, 1);
        } else {
            tracks = searchResults.tracks.slice(0, 10).map((track) => ({
                name: `${track.title} (Author: ${track.author})`,
                value: track.url
            }));
        }

        try {
            await interaction.respond(tracks);
        } catch (error) {
            console.error(error, 'An error occurred while executing the "play" autocomplete.');
        }
    }
}