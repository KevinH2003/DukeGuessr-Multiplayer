<template>
  <div class="container">
    <div class="content">
      <div v-if="phase.localeCompare(`guessing`) == 0">
        <div class="player-scores">
          <div v-for="(player, index) in players" :key="index" class="player-score">{{ player }}: {{ scores[player] || 0 }}</div>
        </div>
        <div class="image-wrapper">
          <div class="image-container">
            <b-img :src="gameState?.locations[round].imageUrl" thumbnail rounded alt="Location 1"></b-img>
          </div>
        <!--
          <div class="image-container map-container">
            <b-img :src="gameState?.locations[1].imageUrl" thumbnail rounded alt="Location 2" @click="dropPin()"></b-img>
          </div>
        -->
        </div>
        <b-row class="button-row">
          <b-col v-for="(input, index) in inputs" :key="index" class="button-container">
            <b-button @click="setGuess(input?.name)" class="button" :variant="input?.name === currentGuess ? 'primary' : 'secondary'">{{ input?.name }}</b-button>
          </b-col>
        </b-row>
        <div v-for="(pin, index) in pins" :key="index" class="pin" :style="{ top: pin.value.y + 'px', left: pin.value.x + 'px' }">
          <!-- Optionally display pin details -->
          <span>{{ pin.value.lat }}, {{ pin.value.long }}</span>
        </div>
        <!--
          <div class="game-state">{{ JSON.stringify(gameState) }}</div>
        -->
        <b-button @click="guess" variant="primary" class="submit-button">Submit Guess!</b-button>
      </div>
      <div v-else>
        <h2>Final Results: </h2>
        <div v-if="players.length === 0">
          <p>No players</p>
        </div>
        <div v-else>
          <div v-for="(player, index) in sortedPlayers" :key="player" class="player-ranking">
            <span>{{ index + 1 }}. {{ player }}</span>
            <span>Score: {{ scores[player] || 0 }}</span>
          </div>
          <Home 
            :gameId="gameId" 
            :numPlayers="players.length" 
            :numRounds="gameState?.numRounds" 
            :gamemode="gameState?.mode"
            :playerNames="players.join(`, `)"
            >
          </Home>
        </div>
      </div>
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
  justify-content: center;
  margin: 10px;
}

.image-container {
  max-height: 70vh;
  max-width: 50vw;
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

.submit-button {
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

/*
@media (max-width: 768px) {
  .image-wrapper {
    flex-direction: column;
  }
}
*/

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
.map-container {
  position: relative;
}

/* Pins styling */
.pin {
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: red; /* Customize pin color */
  cursor: pointer; /* Show pointer cursor on hover */
  z-index: 1; /* Ensure pins are displayed above the map */
}

.player-ranking {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
  margin: 5px 0;
  border-radius: 8px;
  background-color: #f0f0f0;
}

.player-ranking span {
  font-size: 16px;
}

.player-ranking span:first-child {
  flex: 1;
  margin-left: 10px;
  font-weight: bold;
}

.player-ranking span:last-child {
  margin-left: 10px;
}
</style>

<script setup lang="ts">
//import { ref, Ref, computed, ComputedRef, inject, watch, } from 'vue'
import { ref, Ref, computed, ComputedRef, watch, } from 'vue'
import { io } from 'socket.io-client'
//import { useMouse } from '@vueuse/core'
//import { GameState, User, Coordinates, Player, Location, PlayerScores } from '../model'
import { GameState, Coordinates, Player, Location, PlayerScores } from '../model'
import Home from './Home.vue'

interface Props {
  gameId: string
}
// default values for props
const props = withDefaults(defineProps<Props>(), {
  gameId: "",
})

//const user:Ref<User> | undefined = inject("user")
//const username: ComputedRef<string> = computed( () => user?.value.preferred_username || "None")
const currentGuess: Ref<Coordinates | string | undefined> = ref()

const gameState: Ref<GameState | null> = ref(null)
const players: ComputedRef<string[]> = computed( () => gameState.value?.players || [])
const scores: ComputedRef<PlayerScores> = computed( () => gameState.value?.playerScores || {})
const locations: ComputedRef<Location[]> = computed( () => gameState.value?.locations || [])
const round: ComputedRef<number> = computed( () => gameState.value?.round || 0)
const phase: ComputedRef<string> = computed ( () => gameState.value?.phase || "guessing")
const inputs: ComputedRef<Location[]> = computed( () => gameState.value?.inputs || [])

const sortedPlayers = computed(() => {
  // Sort players based on their scores (descending order)
  return players.value.sort((a, b) => (scores.value[b] || 0) - (scores.value[a] || 0));
})

watch(phase, (newValue, oldValue) => {
  if (newValue != oldValue && (newValue.localeCompare("guessing") == 0)) {
    // Refresh the window
    window.location.reload();
  }
});

//const { x, y } = useMouse()
type Pin = {
  player: Player,
  lat: number,
  long: number,
  x: number,
  y: number,
}

const pins: Ref<ComputedRef<Pin>[]> = ref([]) // Store pins with lat/long coordinates
const rect = ref(document.querySelector('.map-container')?.getBoundingClientRect() || {left: 0, top: 0})

window.addEventListener('resize', () => {
  const oldRect = rect.value
  rect.value = document.querySelector('.map-container')?.getBoundingClientRect() || { left: 0, top: 0 };
  // Recalculate positions of pins
  pins.value.forEach(pin => {
    const offsetX = pin.value.x - oldRect.left;
    const offsetY = pin.value.y - oldRect.top;
    pin.value.x = offsetX + rect.value.left;
    pin.value.y = offsetY + rect.value.top;
  });
});
/*
const dropPin = () => {
  const offsetX = x.value - rect?.value.left
  const offsetY = y.value - rect?.value.top

  // Convert coordinates to latitude and longitude based on map dimensions
  // This logic may vary depending on the specifics of your map image
  const lat = offsetY
  const long = offsetX

  // Add pin to pins array
  const existingPinIndex = pins.value.findIndex(pin => pin.value.player === username.value);
  if (existingPinIndex !== -1) {
    pins.value.splice(existingPinIndex, 1)
  }
  const newPin = computed( () => {
    return {
      player: username.value,
      lat: lat,
      long: long,
      x: offsetX + rect.value.left,
      y: offsetY + rect.value.top,
    }
  })
  pins.value.push(newPin)

  // Optionally, emit an event or perform other actions
}
*/
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

socket.on("new-round", () => {
  console.log("New Round Received")
  currentGuess.value = undefined
})

const setGuess = (guess: Coordinates | string | undefined) => {
  currentGuess.value = guess
}

const guess = () => {
  socket.emit("guess", currentGuess.value)
}

</script>