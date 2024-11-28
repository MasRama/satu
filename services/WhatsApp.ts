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
import { RateLimiter } from 'limiter';
import Queue from 'better-queue';
import { performance } from 'perf_hooks';

interface MessageQueueItem {
    to: string;
    content: any;
    retries?: number;
}

class WhatsApp {
    public qr_string: string = "";
    public client: any;
    public ready: boolean = false;
    public status: 'disconnected' | 'connecting' | 'connected' | 'qr' = 'disconnected';
    private retryCount: number = 0;
    private maxRetries: number = 3;
    private messageQueue: Queue<MessageQueueItem>;
    private rateLimiter: RateLimiter;
    private metrics = {
        messagesSent: 0,
        messagesReceived: 0,
        errors: 0,
        lastError: null as Error | null,
        avgResponseTime: 0,
        totalResponseTime: 0
    };
    private lastMessageTime: Map<string, number> = new Map();
    private readonly MIN_GROUP_INTERVAL = 3000; // 3 seconds minimum between messages to same group

    constructor() {
        // Rate limit: 5 messages per second (more conservative)
        this.rateLimiter = new RateLimiter({
            tokensPerInterval: 5,
            interval: 1000
        });

        // Initialize message queue with safety limits
        this.messageQueue = new Queue(async (task: MessageQueueItem, cb) => {
            try {
                // Check group message interval
                const now = Date.now();
                const lastTime = this.lastMessageTime.get(task.to) || 0;
                if (now - lastTime < this.MIN_GROUP_INTERVAL) {
                    await new Promise(resolve => setTimeout(resolve, this.MIN_GROUP_INTERVAL - (now - lastTime)));
                }

                await this.rateLimiter.removeTokens(1);
                await this._sendMessage(task.to, task.content);
                this.lastMessageTime.set(task.to, Date.now());
                cb(null, true);
            } catch (error) {
                const maxRetries = 3;
                if (!task.retries) task.retries = 0;
                
                if (task.retries < maxRetries) {
                    task.retries++;
                    setTimeout(() => {
                        this.messageQueue.push(task);
                    }, 2000 * (task.retries)); // Exponential backoff
                    cb(null, false);
                } else {
                    logger.error(`Failed to send message after ${maxRetries} retries:`, error);
                    cb(error);
                }
            }
        }, {
            concurrent: 3, // Reduced concurrent processing
            maxRetries: 3,
            retryDelay: 2000,
            maxTimeout: 10000,
            maxSize: 5000 // Maximum queue size
        } as any);

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
                            this.metrics.messagesReceived++;
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

    private async _sendMessage(to: string, content: any) {
        const start = performance.now();
        try {
            await this.client.sendMessage(to, content);
            this.metrics.messagesSent++;
            
            const responseTime = performance.now() - start;
            this.metrics.totalResponseTime += responseTime;
            this.metrics.avgResponseTime = this.metrics.totalResponseTime / this.metrics.messagesSent;
            
            logger.outgoing(to, content);
        } catch (error) {
            this.metrics.errors++;
            this.metrics.lastError = error as Error;
            throw error;
        }
    }

    public async sendMessage(to: string, content: any) {
        if (!this.ready) {
            throw new Error('WhatsApp client is not ready');
        }

        return new Promise((resolve, reject) => {
            this.messageQueue.push({ to, content }, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
        });
    }

    public async reconnect() {
        if (this.status === 'disconnected') {
            await this.initialize();
        }
    }

    public getMetrics() {
        return {
            ...this.metrics,
            queueSize: (this.messageQueue as any).length(),
            status: this.status,
            uptime: process.uptime()
        };
    }
}

export default new WhatsApp();
