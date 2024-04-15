import { BaseEvent } from '../../structures/Event.js';
import { NikoClient } from '../../structures/Client.js';
import { ChannelType, Events, Message } from 'discord.js';
import { ChatHistoryDocument, ChatHistoryModel } from '../../database/models/ChatBot.js';
import { Content, GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

// Regular expression to match mentions
const mentionRegex = new RegExp(/^<@!?(\d+)>/);

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
        if (this.shouldIgnoreMessage(message)) {
            return;
        }

        const mentionMatch = message.content.match(mentionRegex);
        if (!mentionMatch || mentionMatch[1] !== message.client.user.id) {
            return;
        }

        const prompt = this.extractPrompt(message.content, mentionMatch);

        await message.channel.sendTyping();

        if (!prompt) {
            await this.replyDefaultGreeting(message);
            return;
        }
        
        try {
            await this.handleChat(message, prompt);
        } catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('Response was blocked due to SAFETY')) {
                    await this.replyErrorMessage(
                        message,
                        'Lo siento, no puedo responder a eso. Por favor, intenta con otra pregunta.'
                    );
                }
            }
        }
    }

    private shouldIgnoreMessage(message: Message): boolean {
        return message.author.bot || message.channel.type === ChannelType.DM;
    }

    private extractPrompt(messageContent: string, mentionMatch: RegExpMatchArray): string {
        const args = messageContent.slice(mentionMatch[0].length).trim().split(/ +/g);
        return args.join(' ').toLowerCase();
    }

    private async replyDefaultGreeting(message: Message): Promise<void> {
        await message.reply({
            content: 'Hola, soy Niko! ¿En qué puedo ayudarte?'
        });
    }

    private async handleChat(message: Message, userInput: string): Promise<void> {
        const chatHistory = await this.getOrCreateChatHistory(message.guildId!);

        const safetySettings = [
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_NONE
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_NONE
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_NONE
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_NONE
            },
            {
                category: HarmCategory.HARM_CATEGORY_UNSPECIFIED,
                threshold: HarmBlockThreshold.BLOCK_NONE
            }
        ];

        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro', ...safetySettings });

        const chat = model.startChat({
            history: [
                ...(chatHistory.history.map((line, index) => ({
                    role: index % 2 === 0 ? 'user' : 'model',
                    parts: [{ text: line.parts[0].text }]
                })) as Content[])
            ],
            generationConfig: {
                maxOutputTokens: 1000
            }
        });

        const result = await chat.sendMessage(userInput);
        const text = result.response.text();

        const botChatMessage: Content = { role: 'model', parts: [{ text }] };
        const userChatMessage: Content = { role: 'user', parts: [{ text: userInput }] };

        chatHistory.history.push(userChatMessage, botChatMessage);
        await chatHistory.save();

        await this.sendResponseInChunks(message, text);
    }

    private async getOrCreateChatHistory(guildId: string): Promise<ChatHistoryDocument> {
        let chatHistory = await ChatHistoryModel.findOne({ guildId });
        if (!chatHistory) {
            chatHistory = new ChatHistoryModel({ guildId, history: [] });
        }
        return chatHistory as ChatHistoryDocument;
    }

    private async sendResponseInChunks(message: Message, text: string): Promise<void> {
        const chunks = [];
        for (let i = 0; i < text.length; i += 2000) {
            chunks.push(text.substring(i, i + 2000));
        }

        for (const chunk of chunks) {
            await message.reply({ content: chunk });
        }
    }

    private async replyErrorMessage(message: Message, description: string): Promise<void> {
        await message.reply({
            content: description
        });
    }
}
