import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseEvent } from '../../structures/Event.js';
import { NikoClient } from '../../structures/Client.js';
import { ChannelType, Events, Message } from 'discord.js';

// Regular expression to match mentions
const mentionRegex = /^<@!?(\d+)>/;

export default class MessageCreateEvent extends BaseEvent {
    /**
     * Creates an instance of MessageCreateEvent.
     * @param {NikoClient} client - The client instance.
     */
    public constructor(client: NikoClient) {
        super(client, {
            event: Events.MessageCreate,
            once: false
        });
    }

    /**
     * Executes the message create event handler.
     * @param {Message} message - The Discord message object.
     * @returns {Promise<void>} A Promise that resolves when execution is complete.
     */
    public async execute(message: Message): Promise<void> {
        // Ignore messages from bots or in DMs
        if (message.author.bot || message.channel.type === ChannelType.DM) {
            return;
        }

        // Check if the message mentions the bot
        const mentionMatch = message.content.match(mentionRegex);
        if (!mentionMatch || mentionMatch[1] !== message.client.user.id) {
            return;
        }

        // Extract arguments from the message
        const args = message.content.slice(mentionMatch[0].length).trim().split(/ +/g);
        const prompt = args.join(' ').toLowerCase();

        // Send typing indicator
        await message.channel.sendTyping();

        // Handle empty prompt
        if (mentionMatch && !prompt) {
            await message.reply({
                content: 'Hola, soy Niko! ¿En qué puedo ayudarte?'
            });
            return;
        }

        try {
            // Initialize Google Generative AI instance
            const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
            // Get generative model (Gemini Pro)
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

            // Generate content based on the prompt
            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text;

            // Optimize chunking based on response length
            const chunks = [];
            for (let i = 0; i < text().length; i += 2000) {
                chunks.push(text().substring(i, i + 2000));
            }

            // Reply with the generated chunks
            for (const chunk of chunks) {
                await message.reply({ content: chunk });
            }
        } catch (error) {
            console.error('Error generating content: ', error);
            // Reply with error message
            await message.reply({
                content:
                    'Lo siento, no pude generar una respuesta en este momento. Por favor, intenta de nuevo más tarde.'
            });
        }
    }

    private async handleChat(message: Message, client: NikoClient) {
        
    }
}
