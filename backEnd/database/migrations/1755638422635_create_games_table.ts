import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'games'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('creator_id').unsigned().notNullable()
      table.enum('status', ['waiting', 'ready', 'in_progress', 'finished']).defaultTo('waiting')
      table.integer('winner_id').unsigned().nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at').defaultTo(this.db.rawQuery('CURRENT_TIMESTAMP').knexQuery)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}