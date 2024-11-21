import knex from 'knex';
import config from '../knexfile';
import { logger } from './utils/logger';

const db = knex(config.development);

async function main() {
    try {
        // Mengambil semua data dari tabel bailey_auth
        const authData = await db('bailey_auths').select('*');
        logger.info(`Bailey Auth Data: ${JSON.stringify(authData)}`);

        // Contoh query spesifik
        const latestAuth = await db('bailey_auths')
            .select('*')
            .orderBy('created_at', 'desc')
            .first();
        logger.info(`Latest Auth: ${JSON.stringify(latestAuth)}`);

        // Contoh menghitung total records
        const count = await db('bailey_auths').count('* as total').first();
        logger.info(`Total Records: ${JSON.stringify(count)}`);

    } catch (error) {
        logger.error('Error querying database:', error);
    } finally {
        await db.destroy(); // Menutup koneksi database
    }
}

main();