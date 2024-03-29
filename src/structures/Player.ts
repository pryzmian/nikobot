import 'dotenv/config';

import { BridgeProvider, BridgeSource } from '@discord-player/extractor';
import { Player } from 'discord-player';
import { NikoClient } from '../NikoClient.js';

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
            cookie: process.env.YOUTUBE_COOKIE
          }
        }
      },
      skipFFmpeg: false,
      useLegacyFFmpeg: false
    });
  }

  public async init() {
    await this.extractors.loadDefault();
    console.debug('Loaded extractors:', this.extractors.size);
  }
}
