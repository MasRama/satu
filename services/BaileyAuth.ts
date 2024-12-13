import { initAuthCreds, BufferJSON, AuthenticationCreds, AuthenticationState, SignalDataTypeMap, proto } from "@masrama/baileys";
import db from './Database';

export const BaileyAuth = async (): Promise<{ 
    state: AuthenticationState, 
    saveCreds: () => Promise<void>,
    removeData: (id: string) => Promise<void>
}> => {
    const writeData = async (data: any, id: string) => {
        const check = await db.from("bailey_auths").where("id", id).select("id").first();

        if (!check) {
            await db.table("bailey_auths").insert({
                id: id,
                data: JSON.stringify(data, BufferJSON.replacer),
                updated_at: Date.now(),
                created_at: Date.now()
            });
        } else {
            await db.from("bailey_auths").where("id", id).update({
                data: JSON.stringify(data, BufferJSON.replacer),
                updated_at: Date.now()
            });
        }
    };

    const readData = async (id: string) => {
        const auth = await db.from("bailey_auths").where("id", id).first();
        if (auth) {
            return JSON.parse(auth.data, BufferJSON.reviver);
        }
        return null;
    };

    const removeData = async (id: string) => {
        await db.from("bailey_auths").where("id", id).delete();
    };

    const creds: AuthenticationCreds = await readData('creds.json') || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data: { [_: string]: SignalDataTypeMap[typeof type] } = {};
                    await Promise.all(
                        ids.map(
                            async id => {
                                let value = await readData(`${type}-${id}.json`);
                                if (type === 'app-state-sync-key' && value) {
                                    value = proto.Message.AppStateSyncKeyData.fromObject(value);
                                }
                                data[id] = value;
                            }
                        )
                    );
                    return data;
                },
                set: async (data: Partial<{ [K in keyof SignalDataTypeMap]: { [id: string]: SignalDataTypeMap[K] } }>) => {
                    const tasks: Promise<void>[] = [];
                    for (const category in data) {
                        const categoryData = data[category as keyof SignalDataTypeMap];
                        if (categoryData) {
                            for (const id in categoryData) {
                                const value = categoryData[id];
                                const file = `${category}-${id}.json`;
                                tasks.push(value ? writeData(value, file) : removeData(file));
                            }
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: () => {
            return writeData(creds, 'creds.json');
        },
        removeData
    };
};
