import {
  useCallback,
  useRef,
  useState,
  // createContext,
  // useContext,
} from 'react';
import type { ReactNode } from 'react';
import {
  createContext,
  useContext,
  useContextUpdate,
} from 'use-context-selector';

// const useContextUpdate = () => (fn: any) => fn();

type State = {
  result: number;
  promise: Promise<void> | null;
};

const useValue = () => {
  const countRef = useRef(0);
  const [state, setState] = useState<State>({
    result: countRef.current,
    promise: null,
  });
  const increment = useCallback(() => {
    countRef.current += 1;
    const nextState: State = {
      result: countRef.current,
      promise: new Promise<void>((resolve) => {
        setTimeout(() => {
          nextState.promise = null;
          resolve();
        }, 1000);
      }),
    };
    setState(nextState);
  }, []);
  return { state, increment };
};

const MyContext = createContext<ReturnType<typeof useValue> | null>(null);

export const Provider = ({ children }: { children: ReactNode }) => (
  <MyContext.Provider value={useValue()}>{children}</MyContext.Provider>
);

export const useMyState = () => {
  const update = useContextUpdate(MyContext);
  const value = useContext(MyContext);
  if (value === null) {
    throw new Error('Missing Provider');
  }
  return {
    state: value.state,
    increment: useCallback(() => {
      update(value.increment, { suspense: true });
    }, [update, value.increment]),
  };
};
