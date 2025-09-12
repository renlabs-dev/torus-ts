"use client";

import { useState } from "react";

export default function TestClientNoLayoutPage() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>Test Client Component without Layout</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

