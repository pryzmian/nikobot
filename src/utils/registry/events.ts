import fs from 'node:fs/promises';
import path from 'node:path';
import { NikoClient } from '../../NikoClient.js';
import { BaseEvent } from '../../structures/Event.js';

export async function registerEvents(client: NikoClient): Promise<void> {
  console.debug('Registering events');
  const timeNow = performance.now();

  const eventsPath = path.resolve('./dist/listeners');
  const events = await getEventFiles(eventsPath);

  const eventModules = await Promise.all<BaseEvent>(
    events.map(async (event) => {
      const { default: Event } = await import(event.filePath);
      return new Event(client);
    })
  );

  for (const event of eventModules) {
    try {
      const emitter = event.emitter!;
      const maxListeners = emitter.getMaxListeners();
      if (maxListeners !== 0) emitter.setMaxListeners(maxListeners + 1);
      emitter[event.once ? 'once' : 'on'](event.event as string, event.run.bind(event));
      console.debug(`Registered event ${event.event as string} from ${emitter}`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error registering event ${event.event as string}:`, error);
      } else {
        throw error;
      }
    }
  }

  const timeEnd = performance.now();
  const totalTime = timeEnd - timeNow;

  console.info(`Registered ${eventModules.length} events in ${totalTime}ms`);
}

async function getEventFiles(directory: string): Promise<{ filePath: string }[]> {
  const files = await fs.readdir(directory, { withFileTypes: true });
  const eventFiles: { filePath: string }[] = [];

  for (const file of files) {
    if (file.isDirectory()) {
      const subDirectoryFiles = await getEventFiles(path.join(directory, file.name));
      eventFiles.push(...subDirectoryFiles);
    } else if (file.isFile() && file.name.endsWith('.js')) {
      eventFiles.push({ filePath: path.resolve(directory, file.name) });
    }
  }

  return eventFiles;
}