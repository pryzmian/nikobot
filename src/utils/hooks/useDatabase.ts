import { HooksRegistry, Symbols } from './registry.js';
import { Database } from '../../classes/MongoClient.js';

export function useDatabase() {
    const mongoose = HooksRegistry.get(Symbols.kDatabase) as Database | undefined;

    if (!mongoose) {
        throw new Error('Mongoose has not been initialized');
    }

    return mongoose;
}
