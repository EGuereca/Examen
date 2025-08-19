import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'boats'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('game_id').unsigned().references('id').inTable('games').onDelete('CASCADE')
      table.integer('position').defaultTo(0) // Posición en pantalla (0-100)
      table.integer('owner_id').unsigned().notNullable() // Jugador actual
      table.enum('direction', ['forward', 'backward']).defaultTo('forward')

      table.timestamp('created_at')
      table.timestamp('updated_at').defaultTo(this.db.rawQuery('CURRENT_TIMESTAMP').knexQuery)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}