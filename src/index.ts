/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-ignore */

import {
  Context,
  FC,
  MutableRefObject,
  Provider,
  createElement,
  createContext as createContextOrig,
  // @ts-ignore
  createMutableSource,
  memo,
  useCallback,
  useContext as useContextOrig,
  useMemo,
  // @ts-ignore
  useMutableSource,
  useRef,
} from 'react';

const SOURCE_SYMBOL = Symbol();
const VALUE_PROP = 'v';
const LISTENERS_PROP = 'l';

// @ts-ignore
type ContextValue<Value> = {
  [SOURCE_SYMBOL]: any;
};

const createProvider = <Value>(ProviderOrig: Provider<ContextValue<Value>>) => {
  const RefProvider: FC<{ value: Value }> = ({ value, children }) => {
    const ref = useRef({
      [VALUE_PROP]: value,
      [LISTENERS_PROP]: new Set<() => void>(),
    });
    ref.current[VALUE_PROP] = value;
    ref.current[LISTENERS_PROP].forEach((listener) => listener());
    const contextValue = useMemo(() => ({
      [SOURCE_SYMBOL]: createMutableSource(ref, () => ref.current[VALUE_PROP]),
    }), []);
    return createElement(ProviderOrig, { value: contextValue }, children);
  };
  return memo(RefProvider);
};

const identity = <T>(x: T) => x;

/**
 * This creates a special context for selector-enabled `useContext`.
 *
 * It doesn't pass its value but a ref of the value.
 * Unlike the original context provider, this context provider
 * expects the context value to be immutable and stable.
 *
 * @example
 * import { createContext } from 'use-context-selector';
 *
 * const PersonContext = createContext({ firstName: '', familyName: '' });
 */
export function createContext<Value>(defaultValue: Value) {
  const source = createMutableSource({ current: defaultValue }, () => defaultValue);
  const context = createContextOrig(
    { [SOURCE_SYMBOL]: source, [VALUE_PROP]: defaultValue },
  ) as unknown as Context<Value>; // HACK typing
  context.Provider = createProvider(
    context.Provider as unknown as Provider<ContextValue<Value>>, // HACK typing
  ) as Provider<Value>;
  delete context.Consumer; // no support for Consumer
  return context;
}

const subscribe = (
  ref: MutableRefObject<{ [LISTENERS_PROP]: Set<() => void> }>,
  callback: () => void,
) => {
  const listeners = ref.current[LISTENERS_PROP];
  listeners.add(callback);
  return () => listeners.delete(callback);
};

export function useContext<Value>(context: Context<Value>): Value;
export function useContext<Value, Selected>(
  context: Context<Value>,
  selector: (value: Value) => Selected,
): Selected;

/**
 * This hook returns context value with optional selector.
 *
 * It will only accept context created by `createContext`.
 * It will trigger re-render if only the selected value is referentially changed.
 * The selector must be stable.
 * Either define selector outside render or wrap with `useCallback`.
 *
 * The selector should return referentially equal result for same input for better performance.
 *
 * @example
 * import { useContext } from 'use-context-selector';
 *
 * const firstName = useContext(PersonContext, state => state.firstName);
 */
export function useContext<Value, Selected>(
  context: Context<Value>,
  selector: (value: Value) => Selected = identity as (value: Value) => Selected,
) {
  const { [SOURCE_SYMBOL]: source } = useContextOrig(
    context,
  ) as unknown as ContextValue<Value>; // HACK typing
  if (!source) {
    throw new Error('This useContext requires special context');
  }
  const getSnapshot = useCallback(
    (ref: MutableRefObject<{ [VALUE_PROP]: Value }>) => selector(ref.current[VALUE_PROP]),
    [selector],
  );
  return useMutableSource(source, getSnapshot, subscribe);
}
