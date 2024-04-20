<template>
    <div>
        <div>
            <b-button v-for="(mode, index) in gamemodes" :key="index" @click="selectGamemode(mode)" :class="{ 'selected': mode === gamemode }">{{ mode }}</b-button>
        </div>
        <div>
            <label for="rounds">Number of Rounds:</label>
            <input type="range" id="rounds" min="1" max="20" v-model="numRounds">
            <span>{{ numRounds }}</span>
        </div>
        <div>
            <label for="numPlayers">Number of Players:</label>
            <input type="range" id="numPlayers" :min="1" :max="20" v-model="numPlayers">
            <span>{{ numPlayers }}</span>
        </div>
        <div>
            <label for="playerName">Player Names (Separate With Commas):</label>
            <b-form-input id="playerNames" v-model="playerNames" placeholder="Enter player names"></b-form-input>
        </div>
        <div>
            <label for="gameId">Game ID (Leave Blank For Random):</label>
            <b-form-input id="gameId" v-model="gameId" placeholder=""></b-form-input>
        </div>
        <b-button @click="newGame">Start Game</b-button>
    </div>
</template>


<style scoped>
button {
  margin-right: 10px;
}

.selected {
  font-weight: bold;
}

input[type="range"] {
  width: 200px;
}

span {
  margin-left: 10px;
}
</style>

<script setup lang="ts">
//import { onMounted, ref, computed, Ref, ComputedRef } from 'vue'
import {Ref, ref, ComputedRef, computed, onMounted} from 'vue'
import { GameSetup } from '../model';
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