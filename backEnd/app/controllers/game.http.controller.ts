import type { HttpContext } from '@adonisjs/core/http'
import Game from '../models/game.js'
import GamePlayer from '../models/gamePlayer.js'

export default class GameHttpController {
  // POST /games
  public async create({ auth, response }: HttpContext) {
    const user = await auth.use('api').authenticate()
    const game = await Game.create({ creatorId: user.id, status: 'waiting' })
    return response.created({ message: 'Game created', data: game })
  }

  // GET /games
  public async index({ response }: HttpContext) {
    const games = await Game.query().orderBy('id', 'desc')
    return response.ok({ data: games })
  }

  // POST /games/:id/join
  public async join({ auth, params, response }: HttpContext) {
    const user = await auth.use('api').authenticate()
    const gameId = Number(params.id)

    const game = await Game.query().where('id', gameId).preload('players').first()
    if (!game) return response.notFound({ message: 'Juego no encontrado' })

    const player = await GamePlayer.updateOrCreate(
      { gameId, userId: user.id },
      { socketId: null, ready: false }
    )

    return response.ok({ message: 'Joined', data: { game, player } })
  }
}


