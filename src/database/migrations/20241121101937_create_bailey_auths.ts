import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("bailey_auths", (table) => {
        table.string("id").primary();
        table.text("data");
        table.bigInteger("created_at").index();
        table.bigInteger("updated_at").index();
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("bailey_auths");
}
