import { useReducer } from 'react';

import { createContext } from 'use-context-selector';

const initialState = {
  count: 0,
  person: {
    age: 0,
    firstName: '',
    lastName: '',
  },
};

type State = typeof initialState;

type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'setFirstName'; firstName: string }
  | { type: 'setLastName'; lastName: string }
  | { type: 'setAge'; age: number };

type Dispatch = (action: Action) => void;

const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case 'increment':
      return {
        ...state,
        count: state.count + 1,
      };
    case 'decrement':
      return {
        ...state,
        count: state.count - 1,
      };
    case 'setFirstName':
      return {
        ...state,
        person: {
          ...state.person,
          firstName: action.firstName,
        },
      };
    case 'setLastName':
      return {
        ...state,
        person: {
          ...state.person,
          lastName: action.lastName,
        },
      };
    case 'setAge':
      return {
        ...state,
        person: {
          ...state.person,
          age: action.age,
        },
      };
    default:
      throw new Error('unknown action type');
  }
};

export const useValue = () => useReducer(reducer, initialState);

export const MyContext = createContext<[State, Dispatch]>([
  initialState,
  () => null,
]);
