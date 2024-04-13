<template>
    <div>Game!</div>
    <div>{{ gameId }}</div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, Ref, ComputedRef } from 'vue'

interface Props {
  gameId: string
}

// default values for props
const props = withDefaults(defineProps<Props>(), {
  gameId: "",
})

</script>