import { proto } from '@whiskeysockets/baileys';
import chalk from 'chalk';
export { loadCommands } from './loader';
import { logger } from '../utils/logger';

export const PREFIX = '#';

export interface Command {
    name: string;
    description: string;
    execute: (msg: proto.IWebMessageInfo) => Promise<void>;
}

const commands = new Map<string, Command>();

export const registerCommand = (command: Command) => {
    commands.set(command.name, command);
};

export const registerCommands = (commandList: Command[]) => {
    for (const command of commandList) {
        registerCommand(command);
    }
    logger.info(`Using prefix: ${chalk.cyan(PREFIX)}`);
    logger.info(`Registered ${commandList.length} commands: ${commandList.map(cmd => cmd.name).join(', ')}`);
};

export const handleCommand = async (msg: proto.IWebMessageInfo) => {
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

    if (!text.startsWith(PREFIX)) {
        return;
    }

    const args = text.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) {
        return;
    }

    const command = commands.get(commandName);
    
    if (!command) {
        return;
    }

    try {
        logger.command(msg, commandName);
        await command.execute(msg);
    } catch (error) {
        logger.error(`Error executing command ${commandName}:`, error);
    }
};
