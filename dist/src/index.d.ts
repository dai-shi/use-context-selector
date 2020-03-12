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
