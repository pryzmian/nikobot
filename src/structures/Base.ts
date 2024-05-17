import { Database } from '../classes/MongoClient.js';
import { Emojis } from '../types/configTypes.js';
import config from 'config';
import { useDatabase } from '../utils/hooks/useDatabase.js';

export abstract class Base {
    public readonly icons: Emojis;
    public db: Database | null = null;

    public constructor() {
        this.icons = config.get('emojis');
        this.db = useDatabase();
    }
}
