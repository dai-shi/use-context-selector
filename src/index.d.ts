import * as React from 'react';

export const createContext: <T>(defaultValue: T) => React.Context<T>;

export const useContextSelector: <T, S>(
  context: React.Context<T>,
  selector: (value: T) => S,
) => S;

export const useContext: <T>(
  context: React.Context<T>,
) => T;
