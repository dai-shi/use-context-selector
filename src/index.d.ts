import { Context, FC } from 'react';

export const createContext: <T>(defaultValue: T) => Context<T>;

export const useContextSelector: <T, S>(
  context: Context<T>,
  selector: (value: T) => S,
) => S;

export const useContext: <T>(
  context: Context<T>,
) => T;

export const useContextUpdate: <T>(
  context: Context<T>,
) => (thunk: () => void) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const BridgeProvider: FC<{ context: Context<any>; value: any }>;
