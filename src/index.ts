/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-ignore */

import {
  Context,
  FC,
  MutableRefObject,
  Provider,
  createElement,
  createContext as createContextOrig,
  memo,
  useCallback,
  useContext as useContextOrig,
  useMemo,
  useRef,
} from 'react';

const createMutableSource = 'NOT_AVAILABLE_YET' as any;
const useMutableSource = 'NOT_AVAILABLE_YET' as any;

const SOURCE_SYMBOL = Symbol();

// @ts-ignore
type ContextValue<Value> = {
  [SOURCE_SYMBOL]: any;
};

const createProvider = <Value>(ProviderOrig: Provider<ContextValue<Value>>) => {
  const RefProvider: FC<{ value: Value }> = ({ value, children }) => {
    const ref = useRef({ value, listeners: new Set<() => void>() });
    ref.current.value = value;
    ref.current.listeners.forEach((listener) => listener());
    const contextValue = useMemo(() => {
      const source = createMutableSource(ref, () => ref.current.value);
      return { [SOURCE_SYMBOL]: source };
    }, []);
    return createElement(ProviderOrig, { value: contextValue }, children);
  };
  return memo(RefProvider);
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
  const context = createContextOrig(
    { [SOURCE_SYMBOL]: source },
  ) as unknown as Context<Value>; // HACK typing
  context.Provider = createProvider(
    context.Provider as unknown as Provider<ContextValue<Value>>, // HACK typing
  ) as Provider<Value>;
  delete context.Consumer; // no support for consumer
  return context;
};

/**
 * This hook returns context selected value by selector.
 *
 * It will only accept context created by `createContext`.
 * It will trigger re-render if only the selected value is referentially changed.
 * The selector should be stable for better performance.
 * Either define selector outside render or use `useCallback`.
 *
 * The selector should return referentially equal result for same input for better performance.
 *
 * @example
 * const firstName = useContextSelector(PersonContext, state => state.firstName);
 */
export const useContextSelector = <Value, Selected>(
  context: Context<Value>,
  selector: (value: Value) => Selected,
) => {
  const { [SOURCE_SYMBOL]: source } = useContextOrig(
    context,
  ) as unknown as ContextValue<Value>; // HACK typing
  if (!source) {
    throw new Error('useContextSelector requires special context');
  }
  const getSnapshot = useCallback(
    (ref: MutableRefObject<{ value: Value }>) => selector(ref.current.value),
    [selector],
  );
  const subscribe = useCallback((
    ref: MutableRefObject<{ value: Value; listeners: Set<() => void> }>,
    callback: () => void,
  ) => {
    const { listeners } = ref.current;
    listeners.add(callback);
    return () => listeners.delete(callback);
  }, []);
  return useMutableSource(source, getSnapshot, subscribe);
};

const identity = <T>(x: T) => x;

/**
 * This hook returns the entire context value.
 *
 * @example
 * const person = useContext(PersonContext);
 */
export const useContext = <Value>(context: Context<Value>) => (
  useContextSelector(context, identity)
);
