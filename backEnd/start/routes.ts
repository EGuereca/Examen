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

import { middleware } from './kernel.js'

router.group(() => {
  router.post('/login', [AuthController, 'login'])
  router.post('/register', [AuthController, 'register'])
  router.get('/me', [AuthController, 'me'])
  router.post('/logout', [AuthController, 'logout'])
}).prefix('/api/auth')

router.get('/', async () => {
  return {
    hello: 'world',
  }
})
