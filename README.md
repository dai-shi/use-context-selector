# use-context-selector

[![Build Status](https://travis-ci.com/dai-shi/use-context-selector.svg?branch=master)](https://travis-ci.com/dai-shi/use-context-selector)
[![npm version](https://badge.fury.io/js/use-context-selector.svg)](https://badge.fury.io/js/use-context-selector)
[![bundle size](https://badgen.net/bundlephobia/minzip/use-context-selector)](https://bundlephobia.com/result?p=use-context-selector)

React useContextSelector hook in userland

## Introduction

React Context and useContext is often used to avoid prop drilling,
however it's known that there's a performance issue.
When a context value is changed, all components that useContext
will re-render.

[useContextSelector](https://github.com/gnoff/rfcs/pull/2) is recently proposed.
While waiting for the process, this library provides the API in userland.

## Install

```bash
npm install use-context-selector
```

## Usage

```javascript
import React, { useState } from 'react';
import ReactDOM from 'react-dom';

import { createContext, useContextSelector } from 'use-context-selector';

const context = createContext(null);

const Counter1 = () => {
  const count1 = useContextSelector(context, v => v[0].count1);
  const setState = useContextSelector(context, v => v[1]);
  const increment = () => setState(s => ({
    ...s,
    count1: s.count1 + 1,
  }));
  return (
    <div>
      {Math.random()}
      <span>Count1: {count1}</span>
      <button type="button" onClick={increment}>+1</button>
    </div>
  );
};

const Counter2 = () => {
  const count2 = useContextSelector(context, v => v[0].count2);
  const setState = useContextSelector(context, v => v[1]);
  const increment = () => setState(s => ({
    ...s,
    count2: s.count2 + 1,
  }));
  return (
    <div>
      {Math.random()}
      <span>Count2: {count2}</span>
      <button type="button" onClick={increment}>+1</button>
    </div>
  );
};

const StateProvider = ({ children }) => {
  const [state, setState] = useState({ count1: 0, count2: 0 });
  return (
    <context.Provider value={[state, setState]}>
      {children}
    </context.Provider>
  );
};

const App = () => (
  <StateProvider>
    <Counter1 />
    <Counter2 />
  </StateProvider>
);

ReactDOM.render(<App />, document.getElementById('app'));
```

## Technical memo

React context by nature triggers propagation of component re-rendering
if a value is changed. To avoid this, this libraries use undocumented
feature of `calculateChangedBits`. It then uses a subscription model
to force update when a component needs to re-render.

## Limitations

- Subscriptions are context-based. So, even if there are multiple context providers in a component tree, all components are subscribed to all providers. This may lead false positives (extra re-renders).
- In order to stop propagation, `children` of a context provider has to be either created outside of the provider or memoized with `React.memo`.
- Context consumers are not supported.

## Examples

The [examples](examples) folder contains working examples.
You can run one of them with

```bash
PORT=8080 npm run examples:minimal
```

and open <http://localhost:8080> in your web browser.

You can also try them in codesandbox.io:
[01](https://codesandbox.io/s/github/dai-shi/use-context-selector/tree/master/examples/01_minimal)
[02](https://codesandbox.io/s/github/dai-shi/use-context-selector/tree/master/examples/02_typescript)

## Related projects

- [react-tracked](https://github.com/dai-shi/react-tracked)
- [reactive-react-redux](https://github.com/dai-shi/reactive-react-redux)
