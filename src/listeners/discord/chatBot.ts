import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseEvent } from '../../structures/Event.js';
import { NikoClient } from '../../structures/Client.js';
import { ChannelType, Events, Message } from 'discord.js';

const mentionRegex = /^<@!?(\d+)>/;

export default class MessageCreateEvent extends BaseEvent {
    public constructor(client: NikoClient) {
        super(client, {
            event: Events.MessageCreate,
            once: false
        });
    }

    public async execute(message: Message): Promise<void> {
        if (message.author.bot || message.channel.type === ChannelType.DM) {
            return;
        }

        const mentionMatch = message.content.match(mentionRegex);
        if (!mentionMatch || mentionMatch[1] !== message.client.user.id) {
            return;
        }

        const args = message.content.slice(mentionMatch[0].length).trim().split(/ +/g);
        const prompt = args.join(' ').toLowerCase();

        await message.channel.sendTyping();

        if (mentionMatch && !prompt) {
            await message.reply({
                content: 'Hola, soy Niko! ¿En qué puedo ayudarte?'
            });
            return;
        }

        try {
            const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text;

            if (message.reference?.messageId) {
                const referencedMessage = await message.fetchReference();
                if (referencedMessage.author.id === message.client.user.id) {
                    await message.reply({
                        content: text()
                    });
                }
            }

            // Optimize chunking based on response length
            const chunks = [];
            for (let i = 0; i < text().length; i += 2000) {
                chunks.push(text().substring(i, i + 2000));
            }

            for (const chunk of chunks) {
                await message.reply({ content: chunk });
            }
        } catch (error) {
            console.error('Error generating content: ', error);
            await message.reply({
                content:
                    'Lo siento, no pude generar una respuesta en este momento. Por favor, intenta de nuevo más tarde.'
            });
        }
    }
}
