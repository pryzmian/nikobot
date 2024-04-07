import { Content, GoogleGenerativeAI } from '@google/generative-ai';
import { BaseEvent } from '../../structures/Event.js';
import { NikoClient } from '../../structures/Client.js';
import { ChannelType, Events, Message } from 'discord.js';
import { ChatHistoryModel } from '../../database/models/ChatBot.js';

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
            const userRepliedToBot =
                message.reference?.messageId && (await message.fetchReference()).author.id === message.client.user.id;
            if (mentionMatch || (userRepliedToBot && (await message.fetchReference()).author.id === message.client.user.id)) {
                await this.handleChat(message, prompt);
            }
        } catch (error) {
            console.error('Error generating content: ', error);
            // Reply with error message
            await message.reply({
                content:
                    'Lo siento, no pude generar una respuesta en este momento. Por favor, intenta de nuevo más tarde.'
            });
            return;
        }
    }

    private async handleChat(message: Message, userInput: string): Promise<void> {
        try {
            // Check if the guild has a chat history
            let chatHistory = await ChatHistoryModel.findOne({ guildId: message.guildId! });

            if (!chatHistory) {
                // Create a new chat history if it doesn't exist
                chatHistory = new ChatHistoryModel({
                    guildId: message.guildId!,
                    history: []
                });
            }

            // Create a new instance of GoogleGenerativeAI with your API key
            const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

            // Get the generative model (gemini-pro)
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

            // Start a new chat session with the model, passing the updated chat history
            const chat = model.startChat({
                history: [
                    ...chatHistory.history.map(
                        (line, index) =>
                            ({
                                role: index % 2 === 0 ? 'user' : 'model',
                                parts: [{ text: line.parts[0].text }]
                            }) as Content
                    )
                ]
            });

            // Send the user's message to the model and get the response
            const result = await chat.sendMessage(userInput);
            const response = result.response;
            const text = response.text();

            // Save bot response to chat history
            const botChatMessage: Content = {
                role: 'model',
                parts: [{ text }]
            };

            // Save user input to chat history
            const userChatMessage: Content = {
                role: 'user',
                parts: [{ text: userInput }]
            };

            chatHistory.history.push(userChatMessage);
            chatHistory.history.push(botChatMessage);

            // Update and save chat history to the database after receiving the response
            await chatHistory.save();

            // Optimize chunking based on response length and send response chunks
            const chunks = [];
            for (let i = 0; i < text.length; i += 2000) {
                chunks.push(text.substring(i, i + 2000));
            }

            for (const chunk of chunks) {
                await message.reply({ content: chunk });
            }
        } catch (error) {
            console.error('Error handling chat:', error);
            await message.reply({
                content:
                    'Lo siento, no pude generar una respuesta en este momento. Por favor, intenta de nuevo más tarde.'
            });
            return;
        }
    }
}
