import { connectToDatabase } from '../database';
import { ChatHistoryModel } from '../database/ChatBotHistory';
import { HooksRegistry, Symbols } from '../utils/hooks/registry';

const database = connectToDatabase();

export class Database {
    public chatbot = ChatHistoryModel;

    public constructor(private mongo: typeof database) {
        this.mongo = mongo;
    }
}

HooksRegistry.set(Symbols.kDatabase, new Database(database));
