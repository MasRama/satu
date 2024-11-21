import chalk from 'chalk';
import { proto } from '@whiskeysockets/baileys';

class Logger {
    private getTimestamp(): string {
        const now = new Date();
        return chalk.gray(`[${now.toLocaleString('id-ID')}]`);
    }

    private formatPhoneNumber(jid: string | null | undefined): string {
        if (!jid) return 'unknown';
        return jid.split('@')[0];
    }

    private getMessageType(msg: proto.IWebMessageInfo): { type: string; content?: string } {
        const messageTypes = msg.message || {};
        
        if (messageTypes.conversation) {
            return { type: 'text', content: messageTypes.conversation };
        }
        if (messageTypes.extendedTextMessage) {
            return { type: 'text', content: messageTypes.extendedTextMessage.text || '' };
        }
        if (messageTypes.imageMessage) {
            return { 
                type: 'image', 
                content: messageTypes.imageMessage?.caption ? `[Photo] ${messageTypes.imageMessage.caption}` : '[Photo]'
            };
        }
        if (messageTypes.videoMessage) {
            return { 
                type: 'video', 
                content: messageTypes.videoMessage?.caption ? `[Video] ${messageTypes.videoMessage.caption}` : '[Video]'
            };
        }
        if (messageTypes.documentMessage) {
            return { 
                type: 'document', 
                content: `[Document] ${messageTypes.documentMessage.fileName || 'unnamed'}`
            };
        }
        if (messageTypes.audioMessage) {
            return { 
                type: 'audio',
                content: messageTypes.audioMessage.ptt ? '[Voice Note]' : '[Audio]'
            };
        }
        if (messageTypes.stickerMessage) {
            return { type: 'sticker', content: '[Sticker]' };
        }
        if (messageTypes.contactMessage) {
            return { 
                type: 'contact',
                content: `[Contact] ${messageTypes.contactMessage.displayName || 'unnamed'}`
            };
        }
        if (messageTypes.locationMessage) {
            return { 
                type: 'location',
                content: `[Location] ${messageTypes.locationMessage.name || 'unnamed'}`
            };
        }

        return { type: 'unknown', content: '[Unknown Message Type]' };
    }

    public info(message: string): void {
        console.log(`${this.getTimestamp()} ${chalk.blue('ℹ')} ${message}`);
    }

    public success(message: string): void {
        console.log(`${this.getTimestamp()} ${chalk.green('✓')} ${message}`);
    }

    public error(message: string, error?: any): void {
        console.error(`${this.getTimestamp()} ${chalk.red('✗')} ${message}`);
        if (error) {
            console.error(chalk.red(error));
        }
    }

    public command(msg: proto.IWebMessageInfo, commandName: string): void {
        const sender = this.formatPhoneNumber(msg.key.remoteJid);
        console.log(
            `${this.getTimestamp()} ${chalk.yellow('⚡')} Command ${chalk.cyan(commandName)} executed by ${chalk.yellow(sender)}`
        );
    }

    public message(msg: proto.IWebMessageInfo): void {
        const sender = this.formatPhoneNumber(msg.key.remoteJid);
        const { type, content } = this.getMessageType(msg);
        
        const typeIcon = {
            'text': '💬 ',
            'image': '🖼️  ',  
            'video': '🎥 ',   
            'audio': '🎵 ',
            'document': '📄 ',
            'sticker': '🎨 ',
            'contact': '👤 ',
            'location': '📍 ',
            'unknown': '❓ '
        }[type] || '❓ ';

        console.log(
            `${this.getTimestamp()} ${chalk.blue('←')} ${typeIcon}${chalk.yellow(sender)}: ${content}`
        );
    }

    public outgoing(to: string, content: any): void {
        const receiver = this.formatPhoneNumber(to);
        let messageContent: string;

        if (typeof content === 'string') {
            messageContent = content;
        } else if (content.text) {
            messageContent = content.text;
        } else if (content.image) {
            messageContent = content.caption ? `[Photo] ${content.caption}` : '[Photo]';
        } else if (content.video) {
            messageContent = content.caption ? `[Video] ${content.caption}` : '[Video]';
        } else if (content.audio) {
            messageContent = '[Audio]';
        } else if (content.sticker) {
            messageContent = '[Sticker]';
        } else if (content.document) {
            messageContent = `[Document] ${content.fileName || 'unnamed'}`;
        } else {
            messageContent = JSON.stringify(content);
        }

        console.log(
            `${this.getTimestamp()} ${chalk.green('→')} ${chalk.yellow(receiver)}: ${messageContent}`
        );
    }

    public connection(status: string): void {
        const icon = status === 'connected' ? chalk.green('●') : 
                    status === 'connecting' ? chalk.yellow('○') : 
                    status === 'disconnected' ? chalk.red('●') : chalk.blue('○');
        console.log(`${this.getTimestamp()} ${icon} WhatsApp ${chalk.cyan(status)}`);
    }
}

export const logger = new Logger();
