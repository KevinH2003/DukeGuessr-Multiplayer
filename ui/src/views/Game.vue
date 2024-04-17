<template>
    <div>Game!</div>
    <div class="image-container">
        <b-img :src="gameState?.locations[0].imageUrl" thumbnail rounded fluid alt="Image"></b-img>
    </div>
    <div>{{ JSON.stringify(gameState) }}</div>
    <div>{{ JSON.stringify(user) }}</div>
    <b-button @click="newGame"></b-button>
</template>

<style>
.image-container {
  max-width: 25vw; 
  max-height: 25vw; 
  overflow: hidden; /* Prevent image from overflowing container */
  margin-left: auto;
  margin-right: auto;
  justify-content: center; /* Center horizontally */
  align-items: center; /* Center vertically */
}

.image-container b-img {
  max-width: 25vw;
  max-height: 25vw; 
  object-fit: cover; /* Maintain aspect ratio and cover container */
  object-position: center;
}
</style>

<script setup lang="ts">
import { ref, Ref, computed, ComputedRef, inject, onMounted,  } from 'vue'
import { GameState, User } from '../model'
import { io } from 'socket.io-client'

interface Props {
  gameId: string
}
// default values for props
const props = withDefaults(defineProps<Props>(), {
  gameId: "",
})

const user:Ref<User> | undefined = inject("user")
const username: Ref<string | undefined> = computed(() => user?.value.preferred_username)

const socket = io({ transports: ["websocket"] })

console.log("Game:", JSON.stringify(props.gameId))
socket.emit("game-id", props.gameId)

console.log("Username:", JSON.stringify(username.value))
socket.emit("username", username)

const gameState: Ref<GameState | null> = ref(null)
const test: Ref<string> = ref("10")

async function refresh() {
    gameState.value = await (await fetch(
        "/api/game/" + encodeURIComponent(props.gameId)
    )).json()

    if (!gameState){
        await newGame()
    }
}

onMounted(refresh)

async function newGame() {
    test.value = await (await fetch(
        "/api/game/" + encodeURIComponent(props.gameId),
        {
            headers: {
                "Content-Type": "application/json",
            },
            method: "PUT",
            body: JSON.stringify({
                players: ["p1", "p2"],
                mode: "west",
                numRounds: 5,
            })
        }
    )).json()
}

</script>