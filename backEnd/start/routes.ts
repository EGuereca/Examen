/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import AuthController from '../app/controllers/auth.controller.js'
import GameHttpController from '../app/controllers/game.http.controller.js'

import { middleware } from './kernel.js'

router.group(() => {
  router.post('/login', [AuthController, 'login'])
  router.post('/register', [AuthController, 'register'])
  router.get('/me', [AuthController, 'me'])
  router.post('/logout', [AuthController, 'logout'])
}).prefix('/auth')

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router.group(() => {
  router.post('/games', [GameHttpController, 'create']).use(middleware.auth())
  router.get('/games', [GameHttpController, 'index'])
  router.post('/games/:id/join', [GameHttpController, 'join']).use(middleware.auth())
}).prefix('/api')
