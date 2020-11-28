import React from 'react';
import {
  unstable_NormalPriority as NormalPriority,
  unstable_runWithPriority as runWithPriority,
} from 'scheduler';

import { batchedUpdates } from './batchedUpdates';

const VALUE_PROP = 'v';
const VERSION_PROP = 'p';
const LISTENERS_PROP = 'l';
const UPDATE_PROP = 'u';

const CONTEXT_VALUE = Symbol();
const ORIGINAL_PROVIDER = Symbol();

const isClient = (
  typeof window !== 'undefined'
  && !/ServerSideRendering/.test(window.navigator && window.navigator.userAgent)
);

const useIsomorphicLayoutEffect = isClient ? React.useLayoutEffect : React.useEffect;

const createProvider = (OrigProvider) => (
  React.memo(({ value, children }) => {
    const lastValueRef = React.useRef(value);
    const [version, setVersion] = React.useState(0);
    const versionRef = React.useRef(0);
    const listeners = React.useRef();
    if (!listeners.current) {
      listeners.current = new Set();
    }
    const update = React.useCallback((thunk) => {
      batchedUpdates(() => {
        versionRef.current += 1;
        setVersion(versionRef.current);
        listeners.current.forEach((listener) => listener([versionRef.current]));
        thunk();
      });
    }, []);
    useIsomorphicLayoutEffect(() => {
      if (!Object.is(lastValueRef.current, value)) {
        lastValueRef.current = value;
        versionRef.current += 1;
        setVersion(versionRef.current);
        runWithPriority(NormalPriority, () => {
          listeners.current.forEach((listener) => {
            listener([versionRef.current, value]);
          });
        });
      }
    }, [value]);
    const contextValue = {
      [VALUE_PROP]: value,
      [VERSION_PROP]: version,
      [LISTENERS_PROP]: listeners.current,
      [UPDATE_PROP]: update,
    };
    return React.createElement(
      OrigProvider,
      { value: { [CONTEXT_VALUE]: contextValue } },
      children,
    );
  })
);

/**
 * This creates a special context for `useContextSelector`.
 * @param {*} defaultValue
 * @returns {React.Context}
 * @example
 * const PersonContext = createContext({ firstName: '', familyName: '' });
 */
export const createContext = (defaultValue) => {
  // make changedBits always zero
  const context = React.createContext({
    [CONTEXT_VALUE]: {
      [VALUE_PROP]: defaultValue,
      [VERSION_PROP]: -1,
      [LISTENERS_PROP]: new Set(),
      [UPDATE_PROP]: (f) => f(),
    },
  }, () => 0);
  // original provider
  context[ORIGINAL_PROVIDER] = context.Provider;
  // hacked provider
  context.Provider = createProvider(context.Provider);
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
  const contextValue = React.useContext(context)[CONTEXT_VALUE];
  if (process.env.NODE_ENV !== 'production') {
    if (!contextValue) {
      throw new Error('useContextSelector requires special context');
    }
  }
  const {
    [VALUE_PROP]: value,
    [VERSION_PROP]: version,
    [LISTENERS_PROP]: listeners,
  } = contextValue;
  const selected = selector(value);
  const selectorRef = React.useRef(selector);
  useIsomorphicLayoutEffect(() => {
    selectorRef.current = selector;
  });
  const [, checkUpdate] = React.useReducer((prev, next /* [nextVersion, nextValue] */) => {
    try {
      if (next.length === 2 && prev.version !== version && (
        Object.is(prev.value, next[1])
        || Object.is(prev.selected, selectorRef.current(next[1])))) {
        return prev; // bail out
      }
    } catch (e) {
      // ignored (stale props or some other reason)
    }
    if (version < next[0]) {
      return { ...prev }; // schedule update
    }
    try {
      if (Object.is(prev.value, value)
        || Object.is(prev.selected, selected)) {
        return prev; // bail out
      }
    } catch (e) {
      // ignored (stale props or some other reason)
    }
    return { value, selected, version };
  }, { value, selected, version });
  useIsomorphicLayoutEffect(() => {
    listeners.add(checkUpdate);
    return () => {
      listeners.delete(checkUpdate);
    };
  }, [listeners]);
  return selected;
};

const identity = (x) => x;

/**
 * This hook returns the entire context value.
 * Use this instead of React.useContext for consistent behavior.
 * @param {React.Context} context
 * @returns {*}
 * @example
 * const person = useContext(PersonContext);
 */
export const useContext = (context) => useContextSelector(context, identity);

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
export const useContextUpdate = (context) => {
  const contextValue = React.useContext(context)[CONTEXT_VALUE];
  if (process.env.NODE_ENV !== 'production') {
    if (!contextValue) {
      throw new Error('useContextUpdate requires special context');
    }
  }
  const { [UPDATE_PROP]: update } = contextValue;
  return update;
};

/**
 * This is a Provider component for bridging multiple react roots
 * @param props
 * @param {React.Context} props.context
 * @param {*} props.value
 * @param {React.ReactNote} props.children
 * @returns {React.ReactElement}
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
export const BridgeProvider = ({ context, value, children }) => {
  const { [ORIGINAL_PROVIDER]: Provider } = context;
  if (process.env.NODE_ENV !== 'production') {
    if (!Provider) {
      throw new Error('BridgeProvider requires special context');
    }
  }
  return React.createElement(Provider, { value }, children);
};

/**
 * This hook return a value for BridgeProvider
 * @param {React.Context} context
 * @returns {*}
 */
export const useBridgeValue = (context) => {
  const bridgeValue = React.useContext(context);
  const contextValue = bridgeValue[CONTEXT_VALUE];
  if (process.env.NODE_ENV !== 'production') {
    if (!contextValue) {
      throw new Error('useBridgeValue requires special context');
    }
  }
  const {
    [LISTENERS_PROP]: listeners,
  } = contextValue;
  const [, forceUpdate] = React.useReducer((c) => c + 1, 0);
  useIsomorphicLayoutEffect(() => {
    listeners.add(forceUpdate);
    return () => {
      listeners.delete(forceUpdate);
    };
  }, [listeners]);
  return bridgeValue;
};
