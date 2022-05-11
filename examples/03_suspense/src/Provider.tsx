import React, {
  ReactNode,
  useState,
  // createContext,
  // useContext,
} from 'react';

import { createContext, useContext } from 'use-context-selector';

const useValue = () => {
  const [state, setState] = useState<{
    result: number;
    promise: Promise<void> | null;
  }>({ result: 1, promise: null });
  const increment = () => {
    const nextState = { ...state };
    nextState.promise = new Promise<void>((resolve) => {
      setTimeout(() => {
        nextState.result += 1;
        nextState.promise = null;
        resolve();
      }, 1000);
    });
    setState(nextState);
  };
  return { state, increment };
};

const MyContext = createContext<ReturnType<typeof useValue> | null>(null);

export const Provider = ({ children }: { children: ReactNode }) => (
  <MyContext.Provider value={useValue()}>
    {children}
  </MyContext.Provider>
);

export const useMyState = () => {
  const value = useContext(MyContext);
  if (value === null) {
    throw new Error('Missing Provider');
  }
  return value;
};
