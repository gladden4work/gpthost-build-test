import React, { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>Simple Counter App</h1>
      <h2>Count: {count}</h2>
      <button onClick={() => setCount(count + 1)} style={{ margin: '10px' }}>Increment</button>
      <button onClick={() => setCount(count - 1)} style={{ margin: '10px' }}>Decrement</button>
      <button onClick={() => setCount(0)} style={{ margin: '10px' }}>Reset</button>
    </div>
  );
}