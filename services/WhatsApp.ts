import { Boom } from '@hapi/boom';
import makeWASocket, { 
    fetchLatestBaileysVersion, 
    DisconnectReason, 
    isJidBroadcast,
    WAMessageKey,
    proto
} from '@whiskeysockets/baileys';
import { BaileyAuth } from './BaileyAuth';
import P from 'pino';
import QRCode from 'qrcode';
import { handleCommand, loadCommands, registerCommands } from '../commands';
import { logger } from '../utils/logger';
import db from './Database';

class WhatsApp {
    public qr_string: string = "";
    public client: any;
    public ready: boolean = false;
    public status: 'disconnected' | 'connecting' | 'connected' | 'qr' = 'disconnected';
    private retryCount: number = 0;
    private maxRetries: number = 3;

    constructor() {
        this.initialize();
    }

    private async deleteSession() {
        try {
            // Hapus sesi langsung dari database
            await db.from("bailey_auths").where("id", 'creds.json').delete();
            logger.info('Session deleted successfully');
            this.retryCount = 0;
            this.ready = false;
            // Reinitialize after deleting session
            await this.initialize();
        } catch (error) {
            logger.error('Error deleting session:', error);
        }
    }

    private async initialize() {
        try {
            const { version, isLatest } = await fetchLatestBaileysVersion();
            logger.info(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

            const { state, saveCreds, removeData } = await BaileyAuth();

            this.client = makeWASocket({
                version,
                printQRInTerminal: false,
                auth: state,
                logger: P({ level: 'silent' }) as any,
                browser: ['Satu', 'Chrome', '10.15.7'],
                generateHighQualityLinkPreview: false,
                shouldIgnoreJid: jid => isJidBroadcast(jid)
            });

            // Auto-register all commands
            const commands = await loadCommands();
            registerCommands(commands);

            this.client.ev.on('connection.update', async (update: any) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    this.status = 'qr';
                    this.qr_string = await QRCode.toString(qr, { 
                        type: 'terminal', 
                        small: true,
                        scale: 1,
                        margin: 0 
                    });
                    logger.info('Scan QR code to connect:');
                    console.log(this.qr_string);
                }

                if (connection === 'close') {
                    this.status = 'disconnected';
                    const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                    
                    logger.error('Connection closed', lastDisconnect?.error);
                    logger.info(`Reconnecting: ${shouldReconnect}`);
                    
                    if (shouldReconnect) {
                        this.retryCount++;
                        if (this.retryCount >= this.maxRetries) {
                            logger.info(`Max retries (${this.maxRetries}) reached. Deleting session...`);
                            await this.deleteSession();
                        } else {
                            logger.info(`Retry attempt ${this.retryCount}/${this.maxRetries}`);
                            await this.initialize();
                        }
                    } else {
                        // If logged out, delete session immediately
                        logger.info('Logged out. Deleting session...');
                        await this.deleteSession();
                    }
                } else if (connection === 'connecting') {
                    this.status = 'connecting';
                    logger.connection('connecting');
                } else if (connection === 'open') {
                    this.status = 'connected';
                    this.ready = true;
                    logger.connection('connected');
                }
            });

            this.client.ev.on('messages.upsert', async (m: any) => {
                if (m.type === 'notify') {
                    for (const msg of m.messages) {
                        if (!msg.key.fromMe) {
                            logger.message(msg);
                            await handleCommand(msg);
                        }
                    }
                }
            });

            this.client.ev.on('creds.update', saveCreds);
        } catch (error) {
            logger.error('Error in initialize:', error);
            throw error;
        }
    }

    public async sendMessage(to: string, content: any) {
        if (!this.ready) {
            throw new Error('WhatsApp client is not ready');
        }

        try {
            logger.outgoing(to, content);
            await this.client.sendMessage(to, content);
        } catch (error) {
            logger.error('Error sending message:', error);
            throw error;
        }
    }

    public async reconnect() {
        if (this.status === 'disconnected') {
            await this.initialize();
        }
    }
}

export default new WhatsApp();
