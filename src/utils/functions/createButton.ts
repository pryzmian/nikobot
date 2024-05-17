import {
    APIActionRowComponent,
    APIButtonComponent,
    APIMessageActionRowComponent,
    ButtonBuilder,
    ButtonStyle
} from 'discord.js';

export function createButton(
    customId: string,
    emoji: string,
    style: ButtonStyle,
    actionRow: APIActionRowComponent<APIMessageActionRowComponent> | null
): APIButtonComponent {
    const button: APIButtonComponent = new ButtonBuilder()
        .setCustomId(customId)
        .setEmoji(emoji)
        .setStyle(style)
        .toJSON();

    actionRow!.components.push(button);

    return button;
}
