import { Command } from './index';
import WhatsApp from '../services/WhatsApp';

export const ping: Command = {
    name: 'ping',
    description: 'Checks if the bot is running',
    execute: async (msg) => {
        const chat = msg.key.remoteJid;
        if (!chat) return;

        const sections = [{
            title: "Section 1",
            rows: [
                {title: "Option 1", rowId: "option1"},
                {title: "Option 2", rowId: "option2"}
            ]
        }]

        await WhatsApp.client.sendMessage(chat, {
            text: "Here's your list",
            buttonText: "Click Me!",
            sections: sections
        });

        // Alternative simple response:
        // await WhatsApp.client.sendMessage(chat, { 
        //     text: 'Pong! 🏓\nBot is running!' 
        // });
    }
};
