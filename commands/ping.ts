import { Command } from './index';
import WhatsApp from '../services/WhatsApp';

export const ping: Command = {
    name: 'ping',
    description: 'Checks if the bot is running',
    execute: async (msg) => {
        const chat = msg.key.remoteJid;
        if (!chat) return;

        await WhatsApp.client.sendMessage(chat, { 
            text: 'Pong! 🏓\nBot is running!' 
        });
    }
};
