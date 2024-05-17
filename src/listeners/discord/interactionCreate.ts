import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    Events,
    Interaction,
    InteractionType,
    MessageComponentInteraction
} from 'discord.js';
import { BaseEvent } from '../../structures/events/Event.js';
import { NikoClient } from '../../structures/Client.js';

export default class InteractionCreateEvent extends BaseEvent {
    /**
     * Creates an instance of InteractionCreateEvent.
     * @param {NikoClient} client - The client instance.
     */
    constructor(client: NikoClient) {
        super(client, {
            name: Events.InteractionCreate
        });
    }

    /**
     * Executes the interaction create event handler.
     * @param {Interaction} interaction - The Discord interaction object.
     * @returns {Promise<void>} A Promise that resolves when execution is complete.
     */
    public async execute(interaction: Interaction): Promise<void> {
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

    /**
     * Handles application command interactions.
     * @param {ChatInputCommandInteraction} interaction - The chat input command interaction object.
     * @returns {Promise<void>} A Promise that resolves when execution is complete.
     */
    private async handleApplicationCommandInteraction(interaction: ChatInputCommandInteraction): Promise<void> {
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

    /**
     * Handles message component interactions.
     * @param {MessageComponentInteraction} interaction - The message component interaction object.
     * @returns {Promise<void>} A Promise that resolves when execution is complete.
     */
    private async handleMessageComponentInteraction(interaction: MessageComponentInteraction): Promise<void> {
        const [componentId, referenceId] = interaction.customId.split('_');
        const component = this.client.components.get(componentId);
        if (!component) {
            return;
        }

        try {
            await component.execute({ interaction, referenceId });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this component!', ephemeral: true });
        }
    }

    /**
     * Handles autocomplete interactions.
     * @param {AutocompleteInteraction} interaction - The autocomplete interaction object.
     * @returns {Promise<void>} A Promise that resolves when execution is complete.
     */
    private async handleAutocompleteInteraction(interaction: AutocompleteInteraction): Promise<void> {
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

    /**
     * Handles error replies for chat input command interactions.
     * @param {ChatInputCommandInteraction} interaction - The chat input command interaction object.
     * @param {string} content - The content of the error reply.
     * @returns {Promise<void>} A Promise that resolves when execution is complete.
     */
    private async handleErrorReply(interaction: ChatInputCommandInteraction, content: string): Promise<void> {
        if (interaction.replied && interaction.deferred) {
            await interaction.editReply({ content });
        } else {
            await interaction.reply({ content, ephemeral: true });
        }
    }
}
