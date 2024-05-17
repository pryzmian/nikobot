import { Content } from '@google/generative-ai';
import { Document, Schema, model } from 'mongoose';

// Define interface for chat part

type ChatHistoryDocument = {
    guildId: string;
    history: Content[];
} & Document;

const ChatBotHistory = new Schema<ChatHistoryDocument>({
    guildId: { type: String, required: true, unique: true },
    history: [
        {
            role: { type: String, enum: ['user', 'model'] },
            parts: [{ text: { type: String } }]
        }
    ]
});

const ChatHistoryModel = model<ChatHistoryDocument>('ChatBotHistory', ChatBotHistory);

export { ChatHistoryModel, ChatHistoryDocument };
