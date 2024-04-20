<template>
  <div class="container">
    <div class="content">
      <div class="player-scores">
        <div v-for="(player, index) in players" :key="index" class="player-score">{{ player }}: {{ scores[player] }}</div>
      </div>
      <div class="image-wrapper">
        <div class="image-container">
          <b-img :src="gameState?.locations[0].imageUrl" thumbnail rounded alt="Location 1"></b-img>
        </div>
        <div class="image-container">
          <b-img :src="gameState?.locations[1].imageUrl" thumbnail rounded alt="Location 2"></b-img>
        </div>
      </div>
      <b-row class="button-row">
        <b-col v-for="(input, index) in inputs" :key="index" class="button-container">
          <b-button @click="guess(input)" class="button" :variant="input === currentGuess ? 'primary' : 'secondary'">{{ input.lat }}</b-button>
        </b-col>
      </b-row>
      <div class="game-state">{{ JSON.stringify(gameState) }}</div>
      <b-button @click="newGame" variant="primary" class="start-button">Start New Game</b-button>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 85%;
  max-height: 85%;
  overflow: hidden;
}

.content {
  justify-content: center;
  align-items: center;
  width: 100%;
  max-height: 50%;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  animation: fadeInUp 0.75s ease;
}

.player-scores {
  display: flex;
  justify-content: center;
  align-items: center;
}

.player-score {
  font-size: 16px;
  margin-right: 10px;
  color: #555;
}

.image-wrapper {
  display: flex;
  max-height: 100%;
  justify-content: center;
  margin: 10px;
}

.image-container {
  flex: 1; /* Allow image containers to grow and shrink */
  margin: 10px;
  overflow: hidden; /* Prevent image from overflowing container */
  aspect-ratio: 1 / 1; /* Maintain aspect ratio */
}

.image-container b-img {
  width: 100%;
  height: 100%; /* Ensure the image fills the container */
  object-fit: cover;
  border-radius: 8px;
}

.button-row {
  margin-bottom: 10px;
}

.button-container {
  margin: 5px;
}

.button {
  width: 100%;
  font-size: 16px;
}

.start-button {
  width: 100%;
  font-size: 18px;
}

.game-state {
  font-size: small;
}

/* Ensure images are always squares */
@media (min-aspect-ratio: 1/1) {
  .image-container {
    width: auto;
    height: 75vh;
  }
}

@media (min-aspect-ratio: 1/1) {
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

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

<script setup lang="ts">
import { ref, Ref, computed, ComputedRef, inject, } from 'vue'
import { GameState, User, Coordinates } from '../model'
import { io } from 'socket.io-client'

interface Props {
  gameId: string
}
// default values for props
const props = withDefaults(defineProps<Props>(), {
  gameId: "",
})

const user:Ref<User> | undefined = inject("user")
const players: Ref<string[]> = ref(["klh124"])
const scores: Ref<{ [key: string]: number }> = ref({klh124: 5})
const currentGuess: Ref<Coordinates | undefined> = ref()

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
const socket = io({ transports: ["websocket"]})

console.log("Game:", JSON.stringify(props.gameId))
socket.emit("game-id", props.gameId)

socket.on("connect_error", (err: any) => {
  // the reason of the error, for example "xhr poll error"
  console.log(err.message);

  // some additional description, for example the status code of the initial HTTP response
  console.log(err.description);

  // some additional context, for example the XMLHttpRequest object
  console.log(err.context);
})

socket.on("gamestate", (state: GameState) => {
  console.log("Gamestate Received")
  gameState.value = state
})

socket.on("players", (playerArray: string[], playerScores: { [key: string]: number }) => {
  players.value = playerArray
  scores.value = playerScores
})

const newGame = () => {
  socket.emit("new-game")
}

const guess = (coords: Coordinates) => {
  currentGuess.value = coords
  socket.emit("guess", coords)
}

</script>