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

  // Validar pantalla elegida
  const allPlayers = await GamePlayer.query().where('game_id', gameId)
  const screenNumber = Number(boatChoice)
  if (!Number.isFinite(screenNumber) || screenNumber < 1) {
    return { error: 'Pantalla inválida' as const }
  }
  if (screenNumber > allPlayers.length) {
    return { error: 'Pantalla fuera de rango' as const }
  }
  const taken = allPlayers.some((p) => p.userId !== userId && String(p.boatChoice) === String(screenNumber))
  if (taken) {
    return { error: 'Pantalla ya seleccionada por otro jugador' as const }
  }

  player.boatChoice = String(screenNumber)
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
  // Determinar el usuario inicial según la pantalla elegida (boatChoice numérico más bajo)
  const playersWithScreen = players
    .map((p) => ({ player: p, screen: Number(p.boatChoice) }))
    .filter((x) => Number.isFinite(x.screen))
    .sort((a, b) => a.screen - b.screen)

  const startOwnerId = (playersWithScreen[0]?.player?.userId) ?? players[0].userId

  if (!boat) {
    boat = await Boat.create({
      gameId,
      position: 0,
      ownerId: startOwnerId,
      direction: 'forward',
    })
  } else {
    boat.position = 0
    boat.ownerId = startOwnerId
    boat.direction = 'forward'
    await boat.save()
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

    // Ordenar por número de pantalla (boatChoice numérico asc), luego resto por id
    const withScreen = players
      .map((p) => ({ player: p, screen: Number(p.boatChoice) }))
    const orderedByScreen = withScreen
      .filter((x) => Number.isFinite(x.screen))
      .sort((a, b) => a.screen - b.screen)
      .map((x) => x.player)
    const withoutScreen = players.filter((p) => !Number.isFinite(Number(p.boatChoice)))
    const orderedPlayers = [...orderedByScreen, ...withoutScreen]

    const currentIndex = orderedPlayers.findIndex((p) => p.userId === boat.ownerId)
    const nextIndex = (currentIndex + 1) % orderedPlayers.length
    boat.position = 0
    boat.ownerId = orderedPlayers[nextIndex].userId
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

export async function endGameAssignCreatorWinner(gameId: number) {
  const game = await Game.find(gameId)
  if (!game) return { changed: false }
  if (game.status !== 'in_progress') return { changed: false }

  game.status = 'finished'
  game.winnerId = game.creatorId
  await game.save()
  return { changed: true, winnerId: game.creatorId }
}


