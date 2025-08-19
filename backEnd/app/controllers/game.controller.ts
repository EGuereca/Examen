import Game from '../models/game.js'
import GamePlayer from '../models/gamePlayer.js'
import Boat from '../models/boat.js'

export async function findGameOrNull(gameId: number) {
  return Game.find(gameId)
}

export async function joinGame(gameId: number, userId: number, socketId: string) {
  const game = await Game.find(gameId)
  if (!game) return { error: 'Juego no encontrado' as const }

  const player = await GamePlayer.updateOrCreate(
    { gameId, userId },
    { socketId, ready: false }
  )

  return { game, player }
}

export async function chooseBoat(gameId: number, userId: number, boatChoice: string | null) {
  const player = await GamePlayer.query()
    .where('game_id', gameId)
    .where('user_id', userId)
    .first()

  if (!player) return { error: 'Jugador no encontrado en el juego' as const }

  player.boatChoice = boatChoice
  player.ready = true
  await player.save()

  return { player }
}

export async function markGameReadyIfAllReady(gameId: number) {
  const players = await GamePlayer.query().where('game_id', gameId)
  const allReady = players.length >= 2 && players.every((p) => p.ready)
  if (!allReady) return { changed: false }

  const game = await Game.find(gameId)
  if (!game) return { changed: false }
  if (game.status !== 'waiting') return { changed: false }

  game.status = 'ready'
  await game.save()
  return { changed: true }
}

export async function startGame(gameId: number, userId: number) {
  const game = await Game.find(gameId)
  if (!game) return { error: 'Juego no encontrado' as const }
  if (game.creatorId !== userId) return { error: 'Solo el creador puede iniciar' as const }
  if (game.status !== 'ready') return { error: 'Aún no todos han elegido barco' as const }

  game.status = 'in_progress'
  await game.save()

  const players = await GamePlayer.query().where('game_id', gameId).orderBy('id', 'asc')
  if (players.length < 2) return { error: 'Se requieren al menos 2 jugadores' as const }

  let boat = await Boat.query().where('game_id', gameId).first()
  if (!boat) {
    boat = await Boat.create({
      gameId,
      position: 0,
      ownerId: players[0].userId,
      direction: 'forward',
    })
  }

  return { boat }
}

export async function boatTick(gameId: number) {
  const game = await Game.find(gameId)
  if (!game || game.status !== 'in_progress') return { stop: true as const }

  const boat = await Boat.query().where('game_id', gameId).first()
  if (!boat) return { stop: true as const }

  boat.position += 5

  if (boat.position >= 100) {
    const players = await GamePlayer.query().where('game_id', gameId).orderBy('id', 'asc')
    if (players.length === 0) return { stop: true as const }
    const currentIndex = players.findIndex((p) => p.userId === boat.ownerId)
    const nextIndex = (currentIndex + 1) % players.length
    boat.position = 0
    boat.ownerId = players[nextIndex].userId
  }

  await boat.save()
  return { boat }
}

export async function clickBoat(gameId: number, userId: number) {
  const game = await Game.find(gameId)
  const boat = await Boat.query().where('game_id', gameId).first()
  if (!game || !boat) return { winner: false }

  if (boat.ownerId === userId) {
    game.status = 'finished'
    game.winnerId = userId
    await game.save()
    return { winner: true }
  }
  return { winner: false }
}

export async function markDisconnected(socketId: string): Promise<{ player: GamePlayer | null }> {
  const player = await GamePlayer.query().where('socket_id', socketId).first()
  if (!player) return { player: null }

  player.ready = false
  await player.save()
  return { player }
}


export async function markGameWaitingIfNotAllReady(gameId: number) {
  const players = await GamePlayer.query().where('game_id', gameId)
  const allReady = players.length >= 2 && players.every((p) => p.ready)
  if (allReady) return { changed: false }

  const game = await Game.find(gameId)
  if (!game) return { changed: false }
  if (game.status !== 'ready') return { changed: false }

  game.status = 'waiting'
  await game.save()
  return { changed: true }
}


