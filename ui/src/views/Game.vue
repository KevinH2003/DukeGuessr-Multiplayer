<template>
    <div>Game!</div>
    <div>{{ gameId }}</div>
    <div>{{ test }}</div>
    <b-button @click="newGame"></b-button>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, Ref, ComputedRef } from 'vue'
import {GameState} from '../../../server/model'

interface Props {
  gameId: string
}

// default values for props
const props = withDefaults(defineProps<Props>(), {
  gameId: "",
})

const gameState: Ref<GameState | null> = ref(null)
const test: Ref<string> = ref("10")

async function refresh() {
    gameState.value = await (await fetch(
        "/api/game/" + encodeURIComponent(props.gameId)
    )).json()
}

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