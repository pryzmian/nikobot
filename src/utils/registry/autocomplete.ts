import fs from 'node:fs/promises';
import path from 'node:path';
import { NikoClient } from '../../structures/Client.js';
import { BaseAutocomplete } from '../../structures/Autocomplete.js';

export async function registerAutocomplete(client: NikoClient): Promise<void> {
    const timeNow = performance.now();

    const autocompletePath = path.resolve('./dist/autocomplete');
    const autocomplete = await fs.readdir(autocompletePath);

    const autocompleteModules = await Promise.all<BaseAutocomplete>(
        autocomplete
            .filter((file) => file.endsWith('.js'))
            .map(async (autocomplete) => {
                const { default: Autocomplete } = await import(`../../autocomplete/${autocomplete}`);
                return new Autocomplete();
            })
    );

    for (const autocomplete of autocompleteModules) {
        try {
            const componentPath = path.resolve(autocompletePath);
            delete require.cache[require.resolve(`${componentPath}/${autocomplete.name}`)];

            client.autocomplete.delete(autocomplete.name);
            client.autocomplete.set(autocomplete.name, autocomplete);
        } catch (error) {
            if (error instanceof Error) {
                console.error(`Error getting autocomplete data from ${autocomplete.name ?? 'Unknown'}:`, error);
            } else {
                throw error;
            }
        }
    }

    const timeEnd = performance.now();
    const totalTime = timeEnd - timeNow;

    console.info(`Registered ${autocompleteModules.length} autocomplete interactions in ${totalTime}ms`);
}
