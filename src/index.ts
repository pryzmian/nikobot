import 'dotenv/config';
import './classes/MongoClient.js';

import { NikoClient } from './structures/Client.js';
const client = new NikoClient();

(async () => {
    await client.login(process.env.DISCORD_BOT_TOKEN!).then(() => {
        console.log(`Logged in as ${client.user?.username}!`);
    });
})();
