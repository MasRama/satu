import { Command, PREFIX } from './index';
import WhatsApp from '../services/WhatsApp';

export const start: Command = {
    name: 'start',
    description: 'Start the bot and get welcome message',
    execute: async (msg) => {
        const chat = msg.key.remoteJid;
        if (!chat) return;

        await WhatsApp.client.sendMessage(chat, { 
            text: `🤖 Bot is now active!\n\nAvailable commands:\n${PREFIX}ping - Check bot status\n${PREFIX}start - Show this message` 
        });
    }
};
