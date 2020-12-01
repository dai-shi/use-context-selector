import React, {
  Dispatch,
  SetStateAction,
  useRef,
  useState,
  StrictMode,
} from 'react';

import {
  render, fireEvent, cleanup, screen,
} from '@testing-library/react';

import {
  createContext,
  useContextSelector,
  useContextUpdate,
} from '../src/index';

describe('useContextUpdate spec', () => {
  afterEach(cleanup);

  it('counter', () => {
    const initialState = {
      count1: 0,
      count2: 0,
    };
    type State = typeof initialState;
    const context = createContext<[
      State,
      Dispatch<SetStateAction<State>>,
    ]>(
      [initialState, () => null],
    );
    const Counter1 = () => {
      const count1 = useContextSelector(context, (v) => v[0].count1);
      const setState = useContextSelector(context, (v) => v[1]);
      const update = useContextUpdate(context);
      const increment = () => update(() => {
        setState((s) => ({
          ...s,
          count1: s.count1 + 1,
        }));
      });
      const renderCount = useRef(0);
      renderCount.current += 1;
      return (
        <div>
          <span>{count1}</span>
          <button type="button" onClick={increment}>+1</button>
          <span>{renderCount.current}</span>
        </div>
      );
    };
    const Counter2 = () => {
      const count2 = useContextSelector(context, (v) => v[0].count2);
      const renderCount = useRef(0);
      renderCount.current += 1;
      return (
        <div>
          <span>{count2}</span>
          <span data-testid="counter2">{renderCount.current}</span>
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
    const App = () => (
      <StrictMode>
        <StateProvider>
          <Counter1 />
          <Counter2 />
        </StateProvider>
      </StrictMode>
    );
    const { container } = render(<App />);
    expect(container).toMatchSnapshot();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('counter2').textContent).toEqual('1');
    expect(container).toMatchSnapshot();
  });
});
