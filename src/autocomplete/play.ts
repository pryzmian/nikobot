import type { AutocompleteInteraction } from 'discord.js';
import { BaseAutocomplete } from '../structures/autocomplete/Autocomplete.js';
import { Playlist, QueryType, Track, useMainPlayer } from 'discord-player';

export default class PlayAutocomplete extends BaseAutocomplete {
    public constructor() {
        super({
            name: 'play'
        });
    }

    public async execute(interaction: AutocompleteInteraction): Promise<void> {
        const song = interaction.options.getFocused().toLowerCase();

        if (!song) {
            await interaction.respond([]);
            return;
        }

        const player = useMainPlayer();
        const searchResults = await player.search(song, {
            requestedBy: interaction.user,
            fallbackSearchEngine: QueryType.YOUTUBE_SEARCH
        });

        let tracks;

        if (searchResults.hasPlaylist()) {
            tracks = [
                {
                    name: `Playlist: ${this.spliceName(searchResults.playlist!)}`,
                    value: searchResults.playlist!.url
                }
            ].slice(0, 1);
        } else {
            tracks = searchResults.tracks.slice(0, 5).map((track) => ({
                name: `${this.spliceName(track)} (Author: ${track.author})`,
                value: track.url
            }));
        }

        try {
            await interaction.respond(tracks);
        } catch (error) {
            return;
        }
    }

    private spliceName(ctx: Track | Playlist): string {
        return ctx.title.length > 100 ? `${ctx.title.substring(0, 50)}...` : ctx.title;
    }
}
