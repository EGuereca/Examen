import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Game from './game.js'
import User from './user.js'

export default class Boat extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare gameId: number | null

  @column()
  declare position: number

  @column()
  declare ownerId: number

  @column()
  declare direction: 'forward' | 'backward'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Game, { foreignKey: 'gameId' })
  declare game: BelongsTo<typeof Game>

  @belongsTo(() => User, { foreignKey: 'ownerId' })
  declare owner: BelongsTo<typeof User>
}
