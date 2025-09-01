<script>
  let count = 0
  
  function increment() {
    count += 1
  }
  
  function decrement() {
    count -= 1
  }
  
  function reset() {
    count = 0
  }
</script>

<div class="counter-container">
  <h1>Svelte Counter Component</h1>
  <p>Count: {count}</p>
  <button on:click={increment}>Increment</button>
  <button on:click={decrement}>Decrement</button>
  <button on:click={reset}>Reset</button>
</div>

<style>
  .counter-container {
    padding: 20px;
    font-family: Arial, sans-serif;
  }
  
  button {
    margin: 0 5px;
    padding: 5px 10px;
  }
</style>