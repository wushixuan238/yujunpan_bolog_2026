---
title: "React Hooks 使用指南"
description: "深入了解 React Hooks 的使用方法和最佳实践"
date: "2024-11-04"
tags: ["react", "hooks", "frontend"]
category: "frontend"
slug: "react-hooks-guide"
published: true
---

## React Hooks 简介

React Hooks 是 React 16.8 引入的新特性，让你在不编写 class 的情况下使用 state 和其他 React 特性。

### useState

最基础的 Hook，用于在函数组件中添加状态：

\`\`\`tsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
\`\`\`

### useEffect

处理副作用的 Hook：

\`\`\`tsx
import { useState, useEffect } from 'react';

function DataFetcher() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('https://api.example.com/data')
      .then(res => res.json())
      .then(setData);
  }, []); // 空数组表示只在组件挂载时执行

  return <div>{data ? JSON.stringify(data) : 'Loading...'}</div>;
}
\`\`\`

### 自定义 Hooks

你可以创建自己的 Hooks 来复用逻辑：

\`\`\`tsx
function useLocalStorage(key: string, initialValue: any) {
  const [value, setValue] = useState(() => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
\`\`\`

## 最佳实践

1. **遵循 Hooks 规则**：只在顶层调用 Hooks
2. **依赖数组要完整**：useEffect 的依赖数组要包含所有使用的值
3. **合理拆分 useEffect**：不同的副作用应该使用不同的 useEffect

Happy coding! 🚀