import fs from 'fs';
import path from 'path';
import { Command } from './index';
import { fileURLToPath } from 'url';

export async function loadCommands(commandsDir: string = __dirname): Promise<Command[]> {
    const commands: Command[] = [];
    
    async function scanDir(dir: string) {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                // Recursively scan subdirectories
                await scanDir(filePath);
            } else if (file.endsWith('.ts') && !file.endsWith('.d.ts') && file !== 'index.ts' && file !== 'loader.ts') {
                try {
                    // Convert file path to module path
                    const relativePath = path.relative(__dirname, filePath);
                    const modulePath = './' + relativePath.replace(/\\/g, '/').replace('.ts', '');
                    
                    // Dynamic import for the command file
                    const commandModule = await import(modulePath);
                    
                    // Look for exported command in the module
                    for (const exportedItem of Object.values(commandModule)) {
                        if (isCommand(exportedItem)) {
                            commands.push(exportedItem);
                            break; // Only take the first valid command from each file
                        }
                    }
                } catch (error) {
                    console.error(`Error loading command from ${file}:`, error);
                }
            }
        }
    }

    // Type guard to check if an object is a Command
    function isCommand(obj: any): obj is Command {
        return obj 
            && typeof obj === 'object'
            && typeof obj.name === 'string'
            && typeof obj.description === 'string'
            && typeof obj.execute === 'function';
    }
    
    await scanDir(commandsDir);
    return commands;
}
