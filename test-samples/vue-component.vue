<template>
  <div class="counter-container">
    <h1>Vue Counter Component</h1>
    <p>Count: {{ count }}</p>
    <button @click="increment">Increment</button>
    <button @click="decrement">Decrement</button>
    <button @click="reset">Reset</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const count = ref(0)

const increment = () => {
  count.value++
}

const decrement = () => {
  count.value--
}

const reset = () => {
  count.value = 0
}
</script>

<style scoped>
.counter-container {
  padding: 20px;
  font-family: Arial, sans-serif;
}

button {
  margin: 0 5px;
  padding: 5px 10px;
}
</style>