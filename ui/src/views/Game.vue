<template>
    <div>Game!</div>
	<div>{{ username }}</div>
    <div class="image-wrapper">
        <div class="image-container">
            <b-img :src="gameState?.locations[0].imageUrl" thumbnail rounded fluid alt="Image"></b-img>
        </div>
        <div class="image-container">
            <b-img :src="gameState?.locations[1].imageUrl" thumbnail rounded fluid alt="Image"></b-img>
        </div>
    </div>
    <b-row>
        <b-col v-for="(input, index) in inputs" :key="index" cols="auto" class="button-container">
            <b-button @click="guess(input)" class="button">{{ input.lat }}</b-button>
        </b-col>
    </b-row>
    <div>{{ JSON.stringify(gameState) }}</div>
    <div>{{ JSON.stringify(user) }}</div>
    <b-button @click="newGame"></b-button>
</template>

<style>
.image-wrapper {
    display: flex;
    flex-wrap: wrap;
}
.image-container {
    overflow: hidden; /* Prevent image from overflowing container */
    margin-left: auto;
    margin-right: auto;
    justify-content: center; /* Center horizontally */
    align-items: center; /* Center vertically */
    display: grid;
    place-items: center;
    aspect-ratio: 1 / 1;
}

.image-container b-img {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    object-fit: cover; /* Maintain aspect ratio and cover container */ 
    object-position: center;
}

.button-container {
	width: auto;
	margin-left: auto;
    margin-right: auto;
}

.button {
	max-width: fit-content;
	min-width: 10vw;
}

@media (min-aspect-ratio: 1/1) {
  .image-container {
    width: auto;
    height: 75vh;
  }
}

@media (max-aspect-ratio: 1/1) {
  .image-container {
    width: 75vw;
    height: auto;
  }
}

@media (max-width: 768px) {
  .image-wrapper {
    flex-direction: column;
  }
}
</style>

<script setup lang="ts">
import { ref, Ref, computed, ComputedRef, inject, onMounted,  } from 'vue'
import { GameState, User, Guess, Coordinates } from '../model'
import { io } from 'socket.io-client'

interface Props {
    gameId: string
}
// default values for props
const props = withDefaults(defineProps<Props>(), {
    gameId: "",
})

const user:Ref<User> | undefined = inject("user")
const username: ComputedRef<string | undefined> = computed(() => user?.value.preferred_username)

const gameState: Ref<GameState | null> = ref(null)
const inputs: Coordinates[] = [
	{
		lat: 1,
		long: 1,
		elev: 1,
	},
	{
		lat: 2,
		long: 2,
		elev: 2,
	},
	{
		lat: 3,
		long: 3,
		elev: 3,
	},
]
const socket = io({ transports: ["websocket"] })
console.log("Username:", JSON.stringify(username.value))
socket.emit("username", username)

console.log("Game:", JSON.stringify(props.gameId))
socket.emit("game-id", props.gameId)

socket.on("gamestate", (state: GameState) => {
  	gameState.value = state
})

const newGame = () => {
  	socket.emit("new-game")
}

const guess = (coords: Coordinates) => {
  	socket.emit("guess", coords)
}

</script>