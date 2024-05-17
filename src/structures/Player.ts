import 'dotenv/config';

import { BridgeProvider, BridgeSource } from '@discord-player/extractor';
import { Player } from 'discord-player';
import { NikoClient } from './Client.js';
import { RedisQueryCache } from '../classes/QueryCache.js';
import fs from 'node:fs';

export class NikoPlayer extends Player {
    public constructor(client: NikoClient) {
        super(client, {
            bridgeProvider: new BridgeProvider(BridgeSource.Auto),
            ytdlOptions: {
                highWaterMark: 1 << 25,
                quality: 'highestaudio',
                filter: 'audioonly',
                requestOptions: {
                    headers: {
                        cookie: JSON.parse(fs.readFileSync('cookies.json').toString())
                    }
                }
            },
            skipFFmpeg: false,
            useLegacyFFmpeg: false,
            queryCache: new RedisQueryCache(client.redis)
        });
    }

    public async init() {
        await this.extractors.loadDefault();
        console.debug('Loaded extractors:', this.extractors.size);
    }
}
