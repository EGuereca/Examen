import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import GamePlayer from './gamePlayer.js'
import Boat from './boat.js'

export default class Game extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare creatorId: number

  @column()
  declare status: 'waiting' | 'ready' | 'in_progress' | 'finished'

  @column()
  declare winnerId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'creatorId' })
  declare creator: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'winnerId' })
  declare winner: BelongsTo<typeof User>

  @hasMany(() => GamePlayer, { foreignKey: 'gameId' })
  declare players: HasMany<typeof GamePlayer>

  @hasMany(() => Boat, { foreignKey: 'gameId' })
  declare boats: HasMany<typeof Boat>
}
