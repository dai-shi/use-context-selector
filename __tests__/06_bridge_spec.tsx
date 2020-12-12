import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useState,
  StrictMode,
} from 'react';

import {
  render, fireEvent, cleanup, screen,
} from '@testing-library/react';

import {
  createContext,
  useContext,
  useBridgeValue,
  BridgeProvider,
} from '../src/index';

describe('Bridge spec', () => {
  afterEach(cleanup);

  it('counter', () => {
    const initialState = {
      count: 0,
    };
    type State = typeof initialState;
    const context = createContext<[
      State,
      Dispatch<SetStateAction<State>>,
    ]>(
      [initialState, () => null],
    );
    const Counter = () => {
      const count = useContext(context, useCallback((v) => v[0].count, []));
      const setState = useContext(context, useCallback((v) => v[1], []));
      const increment = () => {
        setState((s) => ({
          ...s,
          count: s.count + 1,
        }));
      };
      return (
        <div>
          <span>{count}</span>
          <button type="button" onClick={increment}>+1</button>
        </div>
      );
    };
    const AnotherCounter = () => {
      const count = useContext(context, useCallback((v) => v[0].count, []));
      return (
        <div>
          <span data-testid="anothercounter">{count}</span>
        </div>
      );
    };
    const StateProvider: React.FC = ({ children }) => {
      const [state, setState] = useState(initialState);
      return (
        <context.Provider value={[state, setState]}>
          {children}
        </context.Provider>
      );
    };
    const DifferentRoot: React.FC = () => {
      const bridgeValue = useBridgeValue(context);
      return (
        <BridgeProvider context={context} value={bridgeValue}>
          <AnotherCounter />
        </BridgeProvider>
      );
    };
    const App = () => (
      <StrictMode>
        <StateProvider>
          <Counter />
          <DifferentRoot />
        </StateProvider>
      </StrictMode>
    );
    const { container } = render(<App />);
    expect(container).toMatchSnapshot();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('anothercounter').textContent).toEqual('1');
    expect(container).toMatchSnapshot();
  });
});
