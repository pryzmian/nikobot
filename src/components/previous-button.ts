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
import { useHistory, useQueue } from 'discord-player';

export default class PreviousButton extends BaseComponent {
    public constructor() {
        super({
            name: 'previous-button'
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
        const history = useHistory(interaction.guildId!);

        if (!queue) {
            await this.sendEmbedResponse(
                interaction,
                'There are no tracks playing to play the previous track!',
                '#2B2D31'
            );
            return;
        }

        if (queue && queue.currentTrack?.id !== referenceId) {
            await this.sendEmbedResponse(interaction, 'That track is no longer in the queue!', '#2B2D31');
            return;
        }

        if (queue && queue.node.isPaused()) {
            await this.sendEmbedResponse(
                interaction,
                'You need to resume the player first before playing the previous track',
                '#2B2D31'
            );
            return;
        }

        if (history?.size === 0) {
            await this.sendEmbedResponse(interaction, 'There are no previous tracks to play!', '#2B2D31');
            return;
        }

        try {
            queue.emit('playerFinish', queue, queue.currentTrack!);
            await history?.back();
        } catch (error) {
            console.error('(button-previous) An error occurred while playing the previous track:', error);
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
