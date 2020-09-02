/* eslint-disable @typescript-eslint/ban-ts-comment */

import {
  ComponentType,
  Context as ContextOrig,
  FC,
  MutableRefObject,
  Provider,
  createElement,
  createContext as createContextOrig,
  // @ts-ignore
  unstable_createMutableSource as createMutableSource,
  useCallback,
  useContext as useContextOrig,
  useLayoutEffect,
  useEffect,
  useMemo,
  // @ts-ignore
  unstable_useMutableSource as useMutableSource,
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

const FUNCTION_SYMBOL = Symbol();
// eslint-disable-next-line @typescript-eslint/ban-types
const functionMap = new WeakMap<Function, { [FUNCTION_SYMBOL]: Function }>();

// @ts-ignore
type ContextValue<Value> = {
  [SOURCE_SYMBOL]: any;
};

type RefValue<Value> = MutableRefObject<{
  v: number; // "v" = version
  p: Value; // "p" = primary value
  s: Value; // "s" = secondary value
  l: Set<() => void>; // "l" = listeners
}>;

export interface Context<Value> {
  Provider: ComponentType<{ value: Value }>;
  displayName?: string;
}

const createProvider = <Value>(ProviderOrig: Provider<ContextValue<Value>>) => {
  const RefProvider: FC<{ value: Value }> = ({ value, children }) => {
    const ref: RefValue<Value> = useRef({
      v: 0, // "v" = version
      p: value, // "p" = primary value
      s: value, // "s" = secondary value
      l: new Set<() => void>(), // "l" = listeners
    });
    const contextValue = useMemo(() => ({
      [SOURCE_SYMBOL]: createMutableSource(ref, () => ref.current.v),
    }), []);
    useIsomorphicLayoutEffect(() => {
      ref.current.v += 1; // increment version
      if (contextValue[SOURCE_SYMBOL]._workInProgressVersionSecondary !== null) {
        ref.current.s = value; // update secondary value
      } else {
        ref.current.p = value; // update primary value
      }
      runWithPriority(NormalPriority, () => {
        ref.current.l.forEach((listener) => listener());
      });
    });
    return createElement(ProviderOrig, { value: contextValue }, children);
  };
  return RefProvider;
};

const identity = <T>(x: T) => x;

const createDefaultSource = <Value>(defaultValue: Value) => {
  const ref: RefValue<Value> = {
    current: {
      v: -1, // "v" = version
      p: defaultValue, // "p" = primary value
      s: defaultValue, // "s" = secondary value
      l: new Set<() => void>(), // "l" = listeners
    },
  };
  return createMutableSource(ref, () => ref.current.v);
};

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
  const context = createContextOrig<ContextValue<Value>>({
    [SOURCE_SYMBOL]: createDefaultSource(defaultValue),
  });
  (context as unknown as Context<Value>).Provider = createProvider(context.Provider);
  delete context.Consumer; // no support for Consumer
  return context as unknown as Context<Value>;
}

const subscribe = (
  ref: RefValue<unknown>,
  callback: () => void,
) => {
  const listeners = ref.current.l;
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
    (ref: RefValue<Value>) => {
      const value = source._workInProgressVersionSecondary !== null ? ref.current.s : ref.current.p;
      const selected = selector(value);
      if (typeof selected === 'function') {
        if (functionMap.has(selected)) {
          return functionMap.get(selected);
        }
        const wrappedFunction = { [FUNCTION_SYMBOL]: selected };
        functionMap.set(selected, wrappedFunction);
        return wrappedFunction;
      }
      return selected;
    },
    [selector, source],
  );
  const snapshot = useMutableSource(source, getSnapshot, subscribe);
  if (snapshot && (snapshot as { [FUNCTION_SYMBOL]: unknown })[FUNCTION_SYMBOL]) {
    return snapshot[FUNCTION_SYMBOL];
  }
  return snapshot;
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
