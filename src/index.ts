/* eslint-disable @typescript-eslint/ban-ts-ignore */

import {
  ComponentType,
  Context as ContextOrig,
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
  useLayoutEffect,
  useEffect,
  useMemo,
  // @ts-ignore
  useMutableSource,
  useRef,
} from 'react';
import {
  unstable_UserBlockingPriority as UserBlockingPriority,
  unstable_NormalPriority as NormalPriority,
  unstable_runWithPriority as runWithPriority,
} from 'scheduler';

const isClient = (
  typeof window !== 'undefined'
  && !/ServerSideRendering/.test(window.navigator && window.navigator.userAgent)
);

const useIsomorphicLayoutEffect = isClient ? useLayoutEffect : useEffect;

const SOURCE_SYMBOL = Symbol();
const VALUE_PROP = 'v';
const LISTENERS_PROP = 'l';

// @ts-ignore
type ContextValue<Value> = {
  [SOURCE_SYMBOL]: any;
};

export interface Context<Value> {
  Provider: ComponentType<{ value: Value }>;
  displayName?: string;
}

const createProvider = <Value>(ProviderOrig: Provider<ContextValue<Value>>) => {
  const RefProvider: FC<{ value: Value }> = ({ value, children }) => {
    const ref = useRef({
      [VALUE_PROP]: value,
      [LISTENERS_PROP]: new Set<() => void>(),
    });
    useIsomorphicLayoutEffect(() => {
      ref.current[VALUE_PROP] = value;
      runWithPriority(NormalPriority, () => {
        ref.current[LISTENERS_PROP].forEach((listener) => listener());
      });
    });
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
  const context = createContextOrig({ [SOURCE_SYMBOL]: source });
  (context as unknown as Context<Value>).Provider = createProvider(context.Provider);
  delete context.Consumer; // no support for Consumer
  return context as unknown as Context<Value>;
}

const subscribe = (
  ref: MutableRefObject<{ [LISTENERS_PROP]: Set<() => void> }>,
  callback: () => void,
) => {
  const listeners = ref.current[LISTENERS_PROP];
  listeners.add(callback);
  return () => listeners.delete(callback);
};

export function useContext<Value>(context: Context<Value>): Value
export function useContext<Value, Selected>(
  context: Context<Value>,
  selector: (value: Value) => Selected,
): Selected

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
    context as unknown as ContextOrig<ContextValue<Value>>,
  );
  if (process.env.NODE_ENV !== 'production') {
    if (!source) {
      throw new Error('This useContext requires special context for selector support');
    }
  }
  const getSnapshot = useCallback(
    (ref: MutableRefObject<{ [VALUE_PROP]: Value }>) => selector(ref.current[VALUE_PROP]),
    [selector],
  );
  return useMutableSource(source, getSnapshot, subscribe);
}

type AnyCallback = (...args: any) => any;

/**
 * A utility function to wrap a callback function with higher priority
 *
 * Use this for a callback that will change a value,
 * which will be fed into context provider.
 *
 * @example
 * import { wrapCallbackWithPriority } from 'use-context-selector';
 *
 * const wrappedCallback = wrapCallbackWithPriority(callback);
 */
export function wrapCallbackWithPriority<Callback extends AnyCallback>(callback: Callback) {
  const callbackWithPriority = (...args: any) => (
    runWithPriority(UserBlockingPriority, () => callback(...args))
  );
  return callbackWithPriority as Callback;
}
