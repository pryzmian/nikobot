import 'dotenv/config';

import { NikoClient } from './NikoClient.js';
const client = new NikoClient();

(async () => { 
  await client.login(process.env.DISCORD_BOT_TOKEN!);
})();