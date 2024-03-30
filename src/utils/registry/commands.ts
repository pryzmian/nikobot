import 'dotenv/config';

import fs from 'node:fs/promises';
import path from 'node:path';
import { NikoClient } from '../../structures/Client.js';
import { BaseCommand } from '../../structures/Command.js';
import { REST, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes } from 'discord.js';
import type { SystemOptions } from '../../types/configTypes.js';
import config from 'config';

export async function registerCommands(client: NikoClient): Promise<void> {
    const timeNow = performance.now();

    const systemOptions: SystemOptions = config.get('systemOptions');
    const userCommandsArray: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
    const systemCommandsArray: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];

    const baseCommandsPath = path.resolve('./dist/commands');
    const commands = await fs.readdir(baseCommandsPath);

    const commandModules = await Promise.all<BaseCommand>(
        commands
            .filter((file) => file.endsWith('.js'))
            .map(async (command) => {
                const { default: Command } = await import(`../../commands/${command}`);
                return new Command();
            })
    );

    for (const command of commandModules) {
        try {
            const commandPath = path.resolve('./dist/commands/');
            delete require.cache[require.resolve(`${commandPath}/${command.data.name}`)];

            client.commands.delete(command.data.name);
            client.commands.set(command.data.name, command);

            command.isSystemCommand
                ? systemCommandsArray.push(command.toJSON())
                : userCommandsArray.push(command.toJSON());
        } catch (error) {
            if (error instanceof Error) {
                console.error(error, `Error getting command data for command ${command.data.name ?? 'Unknown'}:`);
            } else {
                throw error;
            }
        }
    }

    if (!process.env.DISCORD_APPLICATION_ID || !process.env.DISCORD_BOT_TOKEN) {
        console.error(
            'Missing required environment variables for deploying commands. Please ensure DISCORD_APPLICATION_ID and DISCORD_BOT_TOKEN are set in your environment variable file (.env)'
        );
        process.exit(1);
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN!);

    // Register global commands (user commands)
    try {
        await rest.put(Routes.applicationCommands(process.env.DISCORD_APPLICATION_ID!), {
            body: userCommandsArray.flat()
        });
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error registering system application (/) commands:', error);
        }
    }

    // Register system commands (if any system guild IDs are provided in the config file)
    if (systemOptions.systemGuildIds.length > 0) {
        try {
            for (const guildId of systemOptions.systemGuildIds) {
                await rest.put(Routes.applicationGuildCommands(process.env.DISCORD_APPLICATION_ID!, guildId), {
                    body: systemCommandsArray.flat()
                });
            }

            console.debug(
                `Registered ${systemCommandsArray.length} system application (/) commands for ${systemOptions.systemGuildIds.length} guilds`
            );
        } catch (error) {
            if (error instanceof Error) {
                console.error('Error registering system application (/) commands:', error);
            }
        }
    }

    const timeEnd = performance.now();
    const totalTime = timeEnd - timeNow;

    console.info(`Registered ${commandModules.length} application (/) commands in ${totalTime}ms`);
}
