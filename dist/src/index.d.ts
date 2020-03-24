import { Context } from 'react';
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
export declare function createContext<Value>(defaultValue: Value): Context<Value>;
export declare function useContext<Value>(context: Context<Value>): Value;
export declare function useContext<Value, Selected>(context: Context<Value>, selector: (value: Value) => Selected): Selected;
declare type AnyCallback = (...args: any) => any;
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
export declare function wrapCallbackWithPriority<Callback extends AnyCallback>(callback: Callback): Callback;
export {};
