import path from 'node:path';
import { NikoClient } from '../../structures/Client.js';
import { BaseEvent } from '../../structures/events/Event.js';
import { promises as fs, Dirent } from 'node:fs';

export async function registerEvents(client: NikoClient): Promise<void> {
    const timeNow = performance.now();

    const eventsPath = path.resolve('./dist/listeners');
    const eventFiles = await getEventFiles(eventsPath);

    // Pre-create an empty array for improved performance
    const eventModules: BaseEvent[] = [];

    for (const eventFile of eventFiles) {
        try {
            const { default: Event } = await import(eventFile.filePath);
            const event = new Event(client); // Create the event instance directly

            delete require.cache[eventFile.filePath]; // Clear the cache to avoid memory leaks

            // Early type check (optional but can improve safety)
            if (!(event instanceof BaseEvent)) {
                throw new Error(`Event file '${eventFile.filePath}' does not export a BaseEvent subclass`);
            }

            eventModules.push(event); // Add to the pre-created array

            // Set max listeners only when necessary (avoids unnecessary overhead)
            if (event.emitter) {
                event.emitter.setMaxListeners((event.emitter.getMaxListeners() || 0) + 1);
            }

            event.emitter?.[event.once ? 'once' : 'on'](event.name as string, event.execute.bind(event));
        } catch (error) {
            if (error instanceof Error) {
                console.error(`Error registering event '${eventFile.filePath}':`, error);
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
    const files: Dirent[] = await fs.readdir(directory, { withFileTypes: true });
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
