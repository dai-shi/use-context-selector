import {
  ComponentType,
  Context as ContextOrig,
  MutableRefObject,
  Provider,
  ReactNode,
  createElement,
  createContext as createContextOrig,
  useContext as useContextOrig,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
} from 'react';
import {
  unstable_NormalPriority as NormalPriority,
  unstable_runWithPriority as runWithPriority,
} from 'scheduler';

import { batchedUpdates } from './batchedUpdates';

const CONTEXT_VALUE = Symbol();
const ORIGINAL_PROVIDER = Symbol();

const isSSR = typeof window === 'undefined'
  || /ServerSideRendering/.test(window.navigator && window.navigator.userAgent);

const useIsomorphicLayoutEffect = isSSR ? useEffect : useLayoutEffect;

// for preact that doesn't have runWithPriority
const runWithNormalPriority = runWithPriority
  ? (thunk: () => void) => runWithPriority(NormalPriority, thunk)
  : (thunk: () => void) => thunk();

type Version = number;

type ContextValue<Value> = {
  [CONTEXT_VALUE]: {
    /* "v"alue     */ v: MutableRefObject<Value>;
    /* versio"n"   */ n: MutableRefObject<Version>;
    /* "l"isteners */ l: Set<(action: readonly [Version] | readonly [Version, Value]) => void>;
    /* "u"pdate    */ u: (thunk: () => void) => void;
  };
};

export interface Context<Value> {
  Provider: ComponentType<{ value: Value; children: ReactNode }>;
  displayName?: string;
}

const createProvider = <Value>(
  ProviderOrig: Provider<ContextValue<Value>>,
) => {
  const ContextProvider = ({ value, children }: { value: Value; children: ReactNode }) => {
    const valueRef = useRef(value);
    const versionRef = useRef(0);
    const contextValue = useRef<ContextValue<Value>>();
    if (!contextValue.current) {
      const listeners = new Set<(action: readonly [Version] | readonly [Version, Value]) => void>();
      const update = (thunk: () => void) => {
        batchedUpdates(() => {
          versionRef.current += 1;
          listeners.forEach((listener) => listener([versionRef.current]));
          thunk();
        });
      };
      contextValue.current = {
        [CONTEXT_VALUE]: {
          /* "v"alue     */ v: valueRef,
          /* versio"n"   */ n: versionRef,
          /* "l"isteners */ l: listeners,
          /* "u"pdate    */ u: update,
        },
      };
    }
    useIsomorphicLayoutEffect(() => {
      valueRef.current = value;
      versionRef.current += 1;
      runWithNormalPriority(() => {
        (contextValue.current as ContextValue<Value>)[CONTEXT_VALUE].l.forEach((listener) => {
          listener([versionRef.current, value]);
        });
      });
    }, [value]);
    return createElement(ProviderOrig, { value: contextValue.current }, children);
  };
  return ContextProvider;
};

const identity = <T>(x: T) => x;

/**
 * This creates a special context for `useContextSelector`.
 *
 * @example
 * import { createContext } from 'use-context-selector';
 *
 * const PersonContext = createContext({ firstName: '', familyName: '' });
 */
export function createContext<Value>(defaultValue: Value) {
  const context = createContextOrig<ContextValue<Value>>({
    [CONTEXT_VALUE]: {
      /* "v"alue     */ v: { current: defaultValue },
      /* versio"n"   */ n: { current: -1 },
      /* "l"isteners */ l: new Set(),
      /* "u"pdate    */ u: (f) => f(),
    },
  });
  (context as unknown as {
    [ORIGINAL_PROVIDER]: Provider<ContextValue<Value>>;
  })[ORIGINAL_PROVIDER] = context.Provider;
  (context as unknown as Context<Value>).Provider = createProvider(context.Provider);
  delete (context as any).Consumer; // no support for Consumer
  return context as unknown as Context<Value>;
}

/**
 * This hook returns context selected value by selector.
 *
 * It will only accept context created by `createContext`.
 * It will trigger re-render if only the selected value is referentially changed.
 *
 * The selector should return referentially equal result for same input for better performance.
 *
 * @example
 * import { useContextSelector } from 'use-context-selector';
 *
 * const firstName = useContextSelector(PersonContext, state => state.firstName);
 */
export function useContextSelector<Value, Selected>(
  context: Context<Value>,
  selector: (value: Value) => Selected,
) {
  const contextValue = useContextOrig(
    context as unknown as ContextOrig<ContextValue<Value>>,
  )[CONTEXT_VALUE];
  if (typeof process === 'object' && process.env.NODE_ENV !== 'production') {
    if (!contextValue) {
      throw new Error('useContextSelector requires special context');
    }
  }
  const {
    /* "v"alue     */ v: { current: value },
    /* versio"n"   */ n: { current: version },
    /* "l"isteners */ l: listeners,
  } = contextValue;
  const selected = selector(value);
  const [state, dispatch] = useReducer((
    prev: readonly [Value, Selected],
    next?: // undefined from render below
      | readonly [Version] // from useContextUpdate
      | readonly [Version, Value], // from provider effect
  ) => {
    if (!next) {
      return [value, selected] as const;
    }
    if (next[0] === version) {
      if (Object.is(prev[1], selected)) {
        return prev; // bail out
      }
      return [value, selected] as const;
    }
    try {
      if (next.length === 2) {
        if (Object.is(prev[0], next[1])) {
          return prev; // do not update
        }
        const nextSelected = selector(next[1]);
        if (Object.is(prev[1], nextSelected)) {
          return prev; // do not update
        }
        return [next[1], nextSelected] as const;
      }
    } catch (e) {
      // ignored (stale props or some other reason)
    }
    return [...prev] as const; // schedule update
  }, [value, selected] as const);
  if (!Object.is(state[1], selected)) {
    // schedule re-render
    // this is safe because it's self contained
    dispatch();
  }
  useIsomorphicLayoutEffect(() => {
    listeners.add(dispatch);
    return () => {
      listeners.delete(dispatch);
    };
  }, [listeners]);
  return state[1];
}

/**
 * This hook returns the entire context value.
 * Use this instead of React.useContext for consistent behavior.
 *
 * @example
 * import { useContext } from 'use-context-selector';
 *
 * const person = useContext(PersonContext);
 */
export function useContext<Value>(context: Context<Value>) {
  return useContextSelector(context, identity);
}

/**
 * This hook returns an update function that accepts a thunk function
 *
 * Use this for a function that will change a value in
 * [Concurrent Mode](https://reactjs.org/docs/concurrent-mode-intro.html).
 * Otherwise, there's no need to use this hook.
 *
 * @example
 * import { useContextUpdate } from 'use-context-selector';
 *
 * const update = useContextUpdate();
 * update(() => setState(...));
 */
export function useContextUpdate<Value>(context: Context<Value>) {
  const contextValue = useContextOrig(
    context as unknown as ContextOrig<ContextValue<Value>>,
  )[CONTEXT_VALUE];
  if (typeof process === 'object' && process.env.NODE_ENV !== 'production') {
    if (!contextValue) {
      throw new Error('useContextUpdate requires special context');
    }
  }
  const { u: update } = contextValue;
  return update;
}

/**
 * This is a Provider component for bridging multiple react roots
 *
 * @example
 * const valueToBridge = useBridgeValue(PersonContext);
 * return (
 *   <Renderer>
 *     <BridgeProvider context={PersonContext} value={valueToBridge}>
 *       {children}
 *     </BridgeProvider>
 *   </Renderer>
 * );
 */
export const BridgeProvider = ({ context, value, children }:{
  context: Context<any>;
  value: any;
  children: ReactNode;
}) => {
  const { [ORIGINAL_PROVIDER]: ProviderOrig } = context as unknown as {
    [ORIGINAL_PROVIDER]: Provider<unknown>;
  };
  if (typeof process === 'object' && process.env.NODE_ENV !== 'production') {
    if (!ProviderOrig) {
      throw new Error('BridgeProvider requires special context');
    }
  }
  return createElement(ProviderOrig, { value }, children);
};

/**
 * This hook return a value for BridgeProvider
 */
export const useBridgeValue = (context: Context<any>) => {
  const bridgeValue = useContextOrig(context as unknown as ContextOrig<ContextValue<unknown>>);
  if (typeof process === 'object' && process.env.NODE_ENV !== 'production') {
    if (!bridgeValue[CONTEXT_VALUE]) {
      throw new Error('useBridgeValue requires special context');
    }
  }
  return bridgeValue as any;
};
