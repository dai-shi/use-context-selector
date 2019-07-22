import React from 'react';

const CONTEXT_LISTENERS = Symbol('CONTEXT_LISTENERS');

const createProvider = (OrigProvider, listeners) => React.memo(({ value, children }) => {
  // we call listeners in render intentionally.
  // listeners are not technically pure, but
  // otherwise we can't get benefits from concurrent mode.
  // we make sure to work with double or more invocation of listeners.
  listeners.some(listener => {
    listener(value)
  });
  return React.createElement(OrigProvider, { value }, children);
});

// createContext

export const createContext = (defaultValue) => {
  const context = React.createContext(defaultValue, () => 0);
  // shared listeners (not ideal)
  context[CONTEXT_LISTENERS] = new Set();
  // hacked provider
  context.Provider = createProvider(context.Provider, context[CONTEXT_LISTENERS]);
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
  const forceUpdate = React.useReducer(state => state + 1, 0)[1];
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

export const useContext = context => useContextSelector(context, x => x);
