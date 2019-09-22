import React from 'react';

const CONTEXT_LISTENERS = Symbol('C_L');

const createProvider = (OrigProvider, listeners) => React.memo(({ value, children }) => {
  // we call listeners in render intentionally.
  // listeners are not technically pure, but
  // otherwise we can't get benefits from concurrent mode.
  // we make sure to work with double or more invocation of listeners.
  listeners.forEach((listener) => {
    listener(value);
  });
  return React.createElement(OrigProvider, { value }, children);
});

/**
 * This creates a special context for `useContextSelector`.
 * @param {*} defaultValue
 * @returns {React.Context}
 * @example
 * const PersonContext = createContext({ firstName: '', familyName: '' });
 */
export const createContext = (defaultValue) => {
  // make changedBits always zero
  const context = React.createContext(defaultValue, () => 0);
  // shared listeners (not ideal)
  context[CONTEXT_LISTENERS] = new Set();
  // hacked provider
  context.Provider = createProvider(context.Provider, context[CONTEXT_LISTENERS]);
  // no support for consumer
  delete context.Consumer;
  return context;
};

/**
 * This hook returns context selected value by selector.
 * It will only accept context created by `createContext`.
 * It will trigger re-render if only the selected value is referencially changed.
 * @param {React.Context} context
 * @param {Function} selector
 * @returns {*}
 * @example
 * const firstName = useContextSelector(PersonContext, state => state.firstName);
 */
export const useContextSelector = (context, selector) => {
  const listeners = context[CONTEXT_LISTENERS];
  if (!listeners) {
    throw new Error(process.env.NODE_ENV !== 'production' ? 'useContextSelector requires special context' : '');
  }
  const [, forceUpdate] = React.useReducer(c => c + 1, 0);
  const value = React.useContext(context);
  const selected = selector(value);
  const ref = React.useRef(null);
  React.useLayoutEffect(() => {
    ref.current = {
      f: selector, // last selector "f"unction
      v: value, // last "v"alue
      s: selected, // last "s"elected value
    };
  });
  React.useLayoutEffect(() => {
    const callback = (nextValue) => {
      try {
        if (ref.current.v === nextValue
          || Object.is(ref.current.s, ref.current.f(nextValue))) {
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
  }, [listeners]);
  return selected;
};

/**
 * This hook returns the entire context value.
 * Use this instead of React.useContext for consistent behavior.
 * @param {React.Context} context
 * @returns {*}
 * @example
 * const person = useContext(PersonContext);
 */
// this is not best implemented for performance,
// but this wouldn't be used very often.
export const useContext = context => useContextSelector(context, x => x);
