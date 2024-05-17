import { Dirent, promises as fs } from 'node:fs';
import path from 'node:path';

async function getDirectoryFiles(directory: string): Promise<{ filePath: string }[]> {
    const files: Dirent[] = await fs.readdir(directory, { withFileTypes: true });
    const eventFiles: { filePath: string }[] = [];

    for (const file of files) {
        if (file.isDirectory()) {
            const subDirectoryFiles = await getDirectoryFiles(path.join(directory, file.name));
            eventFiles.push(...subDirectoryFiles);
        } else if (file.isFile() && file.name.endsWith('.js')) {
            eventFiles.push({ filePath: path.resolve(directory, file.name) });
        }
    }

    return eventFiles;
}

export { getDirectoryFiles };
