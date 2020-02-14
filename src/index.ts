/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-ignore */

import React from 'react';

const createMutableSource = (React as any).createMutableSource as any;
const useMutableSource = (React as any).useMutableSource as any;

const SUPPORT_CONTEXT_SELECTOR = Symbol();

// @ts-ignore
type ContextValue<Value> = {
  source: any;
  [SUPPORT_CONTEXT_SELECTOR]: boolean;
};

const createProvider = <Value>(OrigProvider: React.Provider<ContextValue<Value>>) => {
  const Provider: React.FC<{ value: Value }> = ({ value, children }) => {
    const ref = React.useRef({ value, listeners: new Set<() => void>() });
    ref.current.value = value;
    ref.current.listeners.forEach((listener) => listener());
    const source = React.useMemo(() => createMutableSource(ref, {
      getVersion: () => ref.current.value,
    }), []);
    const contextValue = React.useMemo(() => ({
      source,
      [SUPPORT_CONTEXT_SELECTOR]: true,
    }), [source]);
    return React.createElement(OrigProvider, { value: contextValue }, children);
  };
  return React.memo(Provider);
};

/**
 * This creates a special context for `useContextSelector`.
 *
 * It doesn't pass its value but a ref of the value.
 * Unlike the original context provider, this context provider
 * expects the context value to be immutable.
 *
 * @example
 * const PersonContext = createContext({ firstName: '', familyName: '' });
 */
export const createContext = <Value>(defaultValue: Value) => {
  const source = createMutableSource({ current: defaultValue }, {
    getVersion: () => defaultValue,
  });
  const context = React.createContext(
    { source, [SUPPORT_CONTEXT_SELECTOR]: true },
  ) as unknown as React.Context<Value>; // HACK typing
  context.Provider = createProvider(
    context.Provider as unknown as React.Provider<ContextValue<Value>>, // HACK typing
  ) as React.Provider<Value>;
  // no support for consumer
  delete context.Consumer;
  return context;
};

/**
 * This hook returns context selected value by selector.
 *
 * It will only accept context created by `createContext`.
 * It will trigger re-render if only the selected value is referencially changed.
 * The selector must be stable for better performance.
 * Either define selector outside render or use `useCallback`.
 *
 * @example
 * const firstName = useContextSelector(PersonContext, state => state.firstName);
 */
export const useContextSelector = <Value, Selected>(
  context: React.Context<Value>,
  selector: (value: Value) => Selected,
) => {
  const contextValue = React.useContext(context) as unknown as ContextValue<Value>; // HACK typing
  if (!contextValue[SUPPORT_CONTEXT_SELECTOR]) {
    throw new Error('useContextSelector requires special context');
  }
  const config = React.useMemo(() => ({
    getSnapshot: (
      ref: React.MutableRefObject<{ value: Value }>,
    ) => selector(ref.current.value),
    subscribe: (
      ref: React.MutableRefObject<{ value: Value; listeners: Set<() => void> }>,
      callback: () => void,
    ) => {
      let selected = selector(ref.current.value);
      const listener = () => {
        const nextSelected = selector(ref.current.value);
        if (!Object.is(selected, nextSelected)) {
          callback();
          selected = nextSelected;
        }
      };
      const { listeners } = ref.current;
      listeners.add(listener);
      return () => listeners.delete(callback);
    },
  }), [selector]);
  return useMutableSource(contextValue.source, config);
};

const identity = <T>(x: T) => x;

/**
 * This hook returns the entire context value.
 *
 * @example
 * const person = useContext(PersonContext);
 */
export const useContext = <Value>(context: React.Context<Value>) => (
  useContextSelector(context, identity)
);
