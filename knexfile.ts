import type { Knex } from "knex";

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "better-sqlite3",
    connection: {
      filename: "./database.sqlite3"
    },
    useNullAsDefault: true,
    migrations: {
      extension: "ts",
      directory: "./src/database/migrations"
    }
  }
};

export default config;
