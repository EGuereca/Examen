import { createServer } from 'node:http'
import { Server as SocketIOServer } from 'socket.io'
import {
  joinGame,
  chooseBoat as chooseBoatAction,
  markGameReadyIfAllReady,
  startGame as startGameAction,
  boatTick,
  clickBoat as clickBoatAction,
  markDisconnected,
} from '../app/controllers/game.controller.js'

// Puerto para WebSocket
const PORT = 3334

// Crear servidor HTTP vacío (no se usa para HTTP)
const httpServer = createServer()

// Inicializar Socket.IO sobre ese servidor
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
  },
})

// Un loop por partida para mover el barco
const gameLoops = new Map<number, NodeJS.Timeout>()

async function startBoatLoop(gameId: number) {
  if (gameLoops.has(gameId)) return

  const interval = setInterval(async () => {
    const tick = await boatTick(gameId)
    if ('stop' in tick && tick.stop) {
      clearInterval(interval)
      gameLoops.delete(gameId)
      return
    }
    io.to(`game:${gameId}`).emit('updateBoat', tick.boat)
  }, 500)

  gameLoops.set(gameId, interval)
}

// Configurar eventos de conexión
io.on('connection', (socket) => {
  console.log(`🔌 Socket conectado: ${socket.id}`)

  // Unirse a una partida
  // payload: { gameId: number, userId: number }
  socket.on('join', async (payload: { gameId: number; userId: number }) => {
    const { gameId, userId } = payload || ({} as any)
    if (!gameId || !userId) return

    const joinResult = await joinGame(gameId, userId, socket.id)
    if ('error' in joinResult) {
      socket.emit('error', { msg: joinResult.error })
      return
    }

    socket.join(`game:${gameId}`)
    io.to(`game:${gameId}`).emit('playerJoined', { userId })
    console.log(`✅ Socket ${socket.id} se unió a game:${gameId}`)
  })

  // Seleccionar barco
  // payload: { gameId: number, userId: number, boatChoice: string }
  socket.on('chooseBoat', async (payload: { gameId: number; userId: number; boatChoice: string }) => {
    const { gameId, userId, boatChoice } = payload || ({} as any)
    if (!gameId || !userId) return

    const res = await chooseBoatAction(gameId, userId, boatChoice)
    if ('error' in res) return

    io.to(`game:${gameId}`).emit('playerReady', { userId, boatChoice })

    const readyRes = await markGameReadyIfAllReady(gameId)
    if (readyRes.changed) io.to(`game:${gameId}`).emit('gameReady', { gameId })
  })

  // Iniciar juego (solo creador)
  // payload: { gameId: number, userId: number }
  socket.on('startGame', async (payload: { gameId: number; userId: number }) => {
    const { gameId, userId } = payload || ({} as any)
    if (!gameId || !userId) return

    const res = await startGameAction(gameId, userId)
    if ('error' in res) {
      socket.emit('error', { msg: res.error })
      return
    }

    io.to(`game:${gameId}`).emit('start', { boat: res.boat })
    await startBoatLoop(gameId)
  })

  // Click al barco
  // payload: { gameId: number, userId: number }
  socket.on('clickBoat', async (payload: { gameId: number; userId: number }) => {
    const { gameId, userId } = payload || ({} as any)
    if (!gameId || !userId) return

    const res = await clickBoatAction(gameId, userId)
    if (res.winner) {
      const loop = gameLoops.get(gameId)
      if (loop) {
        clearInterval(loop)
        gameLoops.delete(gameId)
      }
      io.to(`game:${gameId}`).emit('winner', { winner: userId })
    }
  })

  socket.on('disconnect', async () => {
    console.log(`❌ Socket desconectado: ${socket.id}`)
    // Opcional: marcar jugador como no listo si se desconecta
    const res = await markDisconnected(socket.id)
    if (res.player) io.to(`game:${res.player.gameId}`).emit('playerReady', { userId: res.player.userId, boatChoice: res.player.boatChoice })
  })
})

// Levantar solo el socket, sin conectar a MongoDB
httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.IO corriendo en http://localhost:${PORT}`)
})


