<template>
<div class="container">
<div class="content">
<h2 class="header">New Game:</h2>
  <div class="gamemodes">
    <b-button v-for="(mode, index) in gamemodes" :key="index" @click="selectGamemode(mode)" :variant="mode === gamemode ? 'primary' : 'secondary'" class="mode-button">{{ mode }}</b-button>
  </div>
  <div class="form-group">
    <label for="rounds">Number of Rounds: {{ numRounds }}</label>
    <input type="range" id="rounds" min="1" max="20" v-model="numRounds" class="form-control">
  </div>
  <div class="form-group">
    <label for="numPlayers">Number of Players: {{ numPlayers }}</label>
    <input type="range" id="numPlayers" :min="1" :max="20" v-model="numPlayers" class="form-control">
  </div>
  <div class="form-group">
    <label for="playerNames">Player Names (Separate With Commas):</label>
    <b-form-input id="playerNames" v-model="playerNames" placeholder="Enter player names" class="form-control"></b-form-input>
  </div>
  <div class="form-group">
    <label for="gameId">Game ID (Leave Blank For Random):</label>
    <b-form-input id="gameId" v-model="gameId" placeholder="" class="form-control"></b-form-input>
  </div>
  <b-button @click="newGame" variant="primary" class="start-game-btn">Start Game</b-button>
</div>
</div>
</template>

<style scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 75vh;
  animation: fadeInUp 0.75s ease; /* Animation effect */
}

.content {
  max-width: 600px;
  width: 100%;
}

.header {
  text-align: center;
  font-family: Arial, sans-serif;
  font-size: 36px; /* Increased font size */
  color: #333; /* Dark gray color */
  margin-bottom: 20px;
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

.gamemodes {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.mode-button {
  flex: 1;
}

.form-group {
  margin-bottom: 20px;
}

input[type="range"] {
  width: 100%;
}

.start-game-btn {
  width: 100%;
}
</style>
<script setup lang="ts">
//import { onMounted, ref, computed, Ref, ComputedRef } from 'vue'
import {Ref, ref, ComputedRef, computed, onMounted} from 'vue'
//import { GameSetup } from '../model';
//import {GameSetup, GameState} from '../../../server/model'

const gameId: Ref<string> = ref("")
const gamemodes: Ref<string[]> = ref(["all", "east", "west", "gardens"])
const gamemode: Ref<string> = ref("all")
const numRounds: Ref<number> = ref(5)
const numPlayers: Ref<number> = ref(1)
const playerNames: Ref<string> = ref('')
const players: ComputedRef<string[]> = computed( () => playerNames.value.split(',').map(name => name.trim()))
const paddedGameId: ComputedRef<string> = computed( () => gameId.value.padStart(24, '0'))

onMounted(getGamemodes)

function selectGamemode(mode: string) {
  gamemode.value = mode
}

async function getGamemodes() {
    gamemodes.value = await (await fetch("/api/gamemodes")).json()
}

async function newGame() {
    let url = "/api/game"
    if (gameId.value.trim().length > 0){
        url = "/api/game/" + encodeURIComponent(paddedGameId.value)
    }
    let redirectId = (await (await fetch(
        url,
        {
            headers: {
                "Content-Type": "application/json",
            },
            method: "PUT",
            body: JSON.stringify({
                players: players.value,
                mode: gamemode.value,
                numRounds: numRounds.value,
                numPlayers: numPlayers.value,
            })
        }
    )).json())
    window.location.href = `/game/${redirectId}`
}


</script>