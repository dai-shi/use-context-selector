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
  useMemo,
  // @ts-ignore
  unstable_useMutableSource as useMutableSource,
  useRef,
} from 'react';
import {
  unstable_ImmediatePriority as ImmediatePriority,
  unstable_NormalPriority as NormalPriority,
  unstable_runWithPriority as runWithPriority,
  unstable_getCurrentPriorityLevel as getCurrentPriorityLevel,
} from 'scheduler';

const isSSR = typeof window === 'undefined'
  || /ServerSideRendering/.test(window.navigator && window.navigator.userAgent);

const useIsoLayoutEffect = isSSR
  ? (fn: () => void) => fn()
  : useLayoutEffect;

const SOURCE_SYMBOL = Symbol();
const UPDATE_SYMBOL = Symbol();

const FUNCTION_SYMBOL = Symbol();
// eslint-disable-next-line @typescript-eslint/ban-types
const functionMap = new WeakMap<Function, { [FUNCTION_SYMBOL]: Function }>();

const ORIGINAL_PROVIDER = Symbol();

// @ts-ignore
type ContextValue<Value> = {
  [SOURCE_SYMBOL]: any;
  [UPDATE_SYMBOL]: <T>(thunk: () => T) => T;
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
    const priorityRef = useRef(NormalPriority);
    const contextValue = useMemo(() => ({
      [SOURCE_SYMBOL]: createMutableSource(ref, () => ref.current.v),
      [UPDATE_SYMBOL]: <T>(thunk: () => T) => {
        priorityRef.current = getCurrentPriorityLevel();
        return runWithPriority(ImmediatePriority, thunk);
      },
    }), []);
    useIsoLayoutEffect(() => {
      if (contextValue[SOURCE_SYMBOL]._workInProgressVersionSecondary !== null) {
        ref.current.s = value; // update secondary value
      } else {
        ref.current.p = value; // update primary value
      }
      ref.current.v += 1; // increment version
      runWithPriority(priorityRef.current, () => {
        ref.current.l.forEach((listener) => listener());
      });
      priorityRef.current = NormalPriority;
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
    [UPDATE_SYMBOL]: (thunk) => thunk(),
  });
  (context as unknown as {
    [ORIGINAL_PROVIDER]: Provider<ContextValue<Value>>;
  })[ORIGINAL_PROVIDER] = context.Provider;
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
      const value = source._workInProgressVersionSecondary !== null
        ? ref.current.s // "s" = secondary value
        : ref.current.p; // "p" = primary value
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

/**
 * This hook returns an update function that accepts a thunk function
 *
 * Use this for a function that will change a value.
 *
 * @example
 * import { useContextUpdate } from 'use-context-selector';
 *
 * const update = useContextUpdate();
 * update(() => setState(...));
 */
export function useContextUpdate(
  context: Context<unknown>,
) {
  const { [UPDATE_SYMBOL]: update } = useContextOrig(
    context as unknown as ContextOrig<ContextValue<unknown>>,
  );
  if (process.env.NODE_ENV !== 'production') {
    if (!update) {
      throw new Error('This useContext requires special context for selector support');
    }
  }
  return update;
}

/**
 * This is a Provider component for bridging multiple react roots
 *
 * @example
 * const valueToBridge = useContext(PersonContext);
 * return (
 *   <Renderer>
 *     <BridgeProvider context={PersonContext} value={valueToBridge}>
 *       {children}
 *     </BridgeProvider>
 *   </Renderer>
 * );
 */
export const BridgeProvider: React.FC<{
  context: Context<any>;
  value: any;
}> = ({ context, value, children }) => {
  const { [ORIGINAL_PROVIDER]: ProviderOrig } = context as unknown as {
    [ORIGINAL_PROVIDER]: Provider<unknown>;
  };
  if (process.env.NODE_ENV !== 'production') {
    if (!ProviderOrig) {
      throw new Error('BridgeProvider requires special context');
    }
  }
  return createElement(ProviderOrig, { value }, children);
};
