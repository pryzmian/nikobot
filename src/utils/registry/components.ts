import fs from 'node:fs/promises';
import path from 'node:path';
import { BaseComponent } from '../../structures/Component.js';
import { NikoClient } from '../../structures/Client.js';

export async function registerComponents(client: NikoClient): Promise<void> {
    const timeNow = performance.now();

    const componentsPath = path.resolve('./dist/components');
    const components = await fs.readdir(componentsPath);

    const componentModules = await Promise.all<BaseComponent>(
        components
            .filter((file) => file.endsWith('.js'))
            .map(async (component) => {
                const { default: Component } = await import(`../../components/${component}`);
                return new Component();
            })
    );

    for (const component of componentModules) {
        try {
            const componentPath = path.resolve(componentsPath);
            delete require.cache[require.resolve(`${componentPath}/${component.name}.js`)];

            client.components.delete(component.name);
            client.components.set(component.name, component);
        } catch (error) {
            if (error instanceof Error) {
                console.error(error, `Error getting component data from ${component.name ?? 'Unknown'}:`);
            } else {
                throw error;
            }
        }
    }

    const timeEnd = performance.now();
    const totalTime = timeEnd - timeNow;

    console.info(`Registered ${componentModules.length} component interactions in ${totalTime}ms`);
}
