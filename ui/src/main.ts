import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { BootstrapVue, BootstrapVueIcons } from 'bootstrap-vue'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import App from './App.vue'
import Home from './views/Home.vue'
import Game from './views/Game.vue'

const routes = [
  {
    path: "/",
    component: Home,
  },
  {
	path: "/game/:gameId",
	component: Game,
	props: ({ params: { gameId }}: {params: { gameId: string }}) => ({
		gameId: gameId.padStart(24, '0') // Zero-padding gameId to 24 characters
	})
	//props: ({ params: { gameId }}: { params: { gameId: string } }) => ({ gameId })
  }
]

const router = createRouter({
	history: createWebHistory(),
	routes,
})

createApp(App)
	.use(BootstrapVue as any)
	.use(BootstrapVueIcons as any)
	.use(router)
	.mount('#app')
