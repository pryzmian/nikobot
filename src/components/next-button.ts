import {
    CacheType,
    ColorResolvable,
    EmbedBuilder,
    GuildMember,
    InteractionResponse,
    Message,
    type MessageComponentInteraction
} from 'discord.js';
import { BaseComponent } from '../structures/components/Component.js';
import { BaseComponentParams } from '../types/component/BaseComponent.js';
import { useQueue } from 'discord-player';

export default class SkipButton extends BaseComponent {
    public constructor() {
        super({
            name: 'next-button'
        });
    }

    public async execute(params: BaseComponentParams): Promise<void> {
        const { interaction, referenceId } = params;
        const memberChannel = (interaction.member as GuildMember).voice.channel;
        const botChannel = interaction.guild?.members.me?.voice.channel;

        if (!memberChannel) {
            await this.sendEmbedResponse(
                interaction,
                'You need to be in a voice channel interact with the player!',
                '#2B2D31'
            );
            return;
        }

        if (botChannel && memberChannel?.id !== botChannel.id) {
            await this.sendEmbedResponse(
                interaction,
                'You need to be in the same voice channel as me to interact with the player!',
                '#2B2D31'
            );
            return;
        }

        const queue = useQueue(interaction.guildId!);

        if (!queue) {
            await this.sendEmbedResponse(
                interaction,
                'There are no tracks currently playing and no tracks in the queue, try adding some tracks!',
                '#2B2D31'
            );
            return;
        }

        if (queue && !queue.currentTrack) {
            await this.sendEmbedResponse(interaction, 'There are no tracks currently playing to skip!', '#2B2D31');
            return;
        }

        if (queue && queue.currentTrack?.id !== referenceId) {
            await this.sendEmbedResponse(interaction, 'That track is no longer in the queue!', '#2B2D31');
            return;
        }

        if (queue && queue.node.isPaused()) {
            await this.sendEmbedResponse(
                interaction,
                'You need to resume the player first before skipping to the next track',
                '#2B2D31'
            );
            return;
        }

        try {
            queue.node.skip();
        } catch (error) {
            console.error('(button-skip) An error occurred while skipping the current track:', error);
            return;
        }
    }

    private async sendEmbedResponse(
        interaction: MessageComponentInteraction<CacheType>,
        response: string,
        color: ColorResolvable
    ): Promise<InteractionResponse<boolean> | Message<boolean>> {
        const embedResponse = new EmbedBuilder();
        embedResponse.setDescription(response).setColor(color);
        return await interaction.reply({ embeds: [embedResponse.toJSON()], ephemeral: true });
    }
}
