import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'players'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('game_id')
      .unsigned()
      .references('id')
      .inTable('games')
      .onDelete('CASCADE')

      table.integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users') // 🔹 referencia a tu tabla existente
        .onDelete('CASCADE')

      table.string('socket_id').nullable()
      table.string('boat_choice').nullable()
      table.boolean('ready').defaultTo(false)

      table.timestamp('created_at')
      table.timestamp('updated_at').defaultTo(this.db.rawQuery('CURRENT_TIMESTAMP').knexQuery)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}