import React from 'react';

const CONTEXT_LISTENERS = Symbol();

const isSSR = typeof window === 'undefined'
  || /ServerSideRendering/.test(window.navigator && window.navigator.userAgent);

export const useIsoLayoutEffect = isSSR
  ? (fn) => fn()
  : React.useLayoutEffect;

const createProvider = (OrigProvider, listeners) => React.memo(({ value, children }) => {
  if (process.env.NODE_ENV !== 'production') {
    // we use layout effect to eliminate warnings.
    // but, this leads tearing with startTransition.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useIsoLayoutEffect(() => {
      listeners.forEach((listener) => {
        listener(value);
      });
    });
  } else {
    // we call listeners in render for optimization.
    // although this is not a recommended pattern,
    // so far this is only the way to make it as expected.
    // we are looking for better solutions.
    // https://github.com/dai-shi/use-context-selector/pull/12
    listeners.forEach((listener) => {
      listener(value);
    });
  }
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
 * It will trigger re-render if only the selected value is referentially changed.
 * @param {React.Context} context
 * @param {Function} selector
 * @returns {*}
 * @example
 * const firstName = useContextSelector(PersonContext, state => state.firstName);
 */
export const useContextSelector = (context, selector) => {
  const listeners = context[CONTEXT_LISTENERS];
  if (process.env.NODE_ENV !== 'production') {
    if (!listeners) {
      throw new Error('useContextSelector requires special context');
    }
  }
  const [, forceUpdate] = React.useReducer((c) => c + 1, 0);
  const value = React.useContext(context);
  const selected = selector(value);
  const ref = React.useRef(null);
  useIsoLayoutEffect(() => {
    ref.current = {
      f: selector, // last selector "f"unction
      v: value, // last "v"alue
      s: selected, // last "s"elected value
    };
  });
  useIsoLayoutEffect(() => {
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
export const useContext = (context) => useContextSelector(context, (x) => x);
