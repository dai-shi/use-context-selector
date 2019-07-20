import React from 'react';

// utils

const forcedReducer = state => state + 1;
const useForceUpdate = () => React.useReducer(forcedReducer, 0)[1];

const calculateChangedBits = () => 0;

const identity = x => x;

const CONTEXT_LISTENERS = Symbol('CONTEXT_LISTENERS');

const createProvider = (OrigProvider, listeners) => React.memo(({ value, children }) => {
  // we call listeners in render intentionally.
  // listeners are not technically pure, but
  // otherwise we can't get benefits from concurrent mode.
  // we make sure to work with double or more invocation of listeners.
  listeners.forEach(listener => listener(value));
  return React.createElement(OrigProvider, { value }, children);
});

// createContext

export const createContext = (defaultValue) => {
  const context = React.createContext(defaultValue, calculateChangedBits);
  const listeners = new Set();
  // shared listeners (not ideal)
  context[CONTEXT_LISTENERS] = listeners;
  // hacked provider
  context.Provider = createProvider(context.Provider, listeners);
  // no support for consumer
  delete context.Consumer;
  return context;
};

// useContextSelector

export const useContextSelector = (context, selector) => {
  const listeners = context[CONTEXT_LISTENERS];
  if (!listeners) {
    throw new Error('useContextSelector requires special context');
  }
  const forceUpdate = useForceUpdate();
  const value = React.useContext(context);
  const selected = selector(value);
  const ref = React.useRef(null);
  React.useLayoutEffect(() => {
    ref.current = { selector, value, selected };
  });
  React.useLayoutEffect(() => {
    const callback = (nextValue) => {
      try {
        if (ref.current.value === nextValue
          || Object.is(ref.current.selected, ref.current.selector(nextValue))) {
          return;
        }
      } catch (e) {
        // ignored (stale props or some other reason)
      }
      forceUpdate();
    };
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  }, [forceUpdate, listeners]);
  return selected;
};

// useContext

export const useContext = context => useContextSelector(context, identity);
