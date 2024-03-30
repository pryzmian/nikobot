import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    Events,
    Interaction,
    InteractionType,
    MessageComponentInteraction
} from 'discord.js';
import { BaseEvent } from '../../structures/Event.js';
import { NikoClient } from '../../structures/Client.js';

export default class InteractionCreateEvent extends BaseEvent {
    constructor(client: NikoClient) {
        super(client, {
            event: Events.InteractionCreate,
            once: false
        });
    }

    public async execute(interaction: Interaction) {
        switch (interaction.type) {
            case InteractionType.ApplicationCommand:
                await this.handleApplicationCommandInteraction(interaction as ChatInputCommandInteraction);
                break;
            case InteractionType.MessageComponent:
                await this.handleMessageComponentInteraction(interaction as MessageComponentInteraction);
                break;
            case InteractionType.ApplicationCommandAutocomplete:
                await this.handleAutocompleteInteraction(interaction as AutocompleteInteraction);
                break;
            default:
                return; // Early return for unknown interaction types
        }
    }

    private async handleApplicationCommandInteraction(interaction: ChatInputCommandInteraction) {
        const command = this.client.commands.get(interaction.commandName);
        if (!command) {
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await this.handleErrorReply(interaction, 'There was an error while executing this command!');
        }
    }

    private async handleMessageComponentInteraction(interaction: MessageComponentInteraction) {
        const component = this.client.components.get(interaction.customId);
        if (!component) {
            return;
        }

        try {
            await component.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this component!', ephemeral: true });
        }
    }

    private async handleAutocompleteInteraction(interaction: AutocompleteInteraction) {
        const autocomplete = this.client.autocomplete.get(interaction.commandName);
        if (!autocomplete) {
            return;
        }

        try {
            await autocomplete.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.respond([
                { name: 'There was an error while executing this autocomplete!', value: 'autocomplete_error' }
            ]);
        }
    }

    private async handleErrorReply(interaction: ChatInputCommandInteraction, content: string) {
        if (interaction.replied && interaction.deferred) {
            await interaction.editReply({ content });
        } else {
            await interaction.reply({ content, ephemeral: true });
        }
    }
}
