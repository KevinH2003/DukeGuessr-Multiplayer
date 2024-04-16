<template>
    <div>Home!</div>
    <div>{{ test }}</div>
    <b-button @click="newGame"></b-button>
</template>

<script setup lang="ts">
//import { onMounted, ref, computed, Ref, ComputedRef } from 'vue'
import {Ref, ref} from 'vue'
//import {GameSetup, GameState} from '../../../server/model'

const test: Ref<string> = ref("10")

async function newGame() {
    test.value = await (await fetch(
        "/api/game/000000000000000000000002",
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