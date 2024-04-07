import { Mongoose, connect } from 'mongoose';

const uri = process.env.DATABASE_URI as string;

export async function connectToDatabase(): Promise<Mongoose | undefined> {
    try {
        console.log('Successfully connected to the database');
        return await connect(uri, {
            dbName: 'nikobot'
        });
    } catch (error) {
        console.error('error when connecting to the database:', error);
        return undefined;
    }
}
