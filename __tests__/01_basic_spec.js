import React, { useRef, useState, StrictMode } from 'react';

import { render, fireEvent, cleanup } from '@testing-library/react';

import {
  createContext,
  useContextSelector,
} from '../src/index';

describe('basic spec', () => {
  afterEach(cleanup);

  it('counter', () => {
    const initialState = {
      count1: 0,
      count2: 0,
    };
    const context = createContext(null);
    const Counter1 = () => {
      const count1 = useContextSelector(context, (v) => v[0].count1);
      const setState = useContextSelector(context, (v) => v[1]);
      const increment = () => setState((s) => ({
        ...s,
        count1: s.count1 + 1,
      }));
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
      const setState = useContextSelector(context, (v) => v[1]);
      const increment = () => setState((s) => ({
        ...s,
        count2: s.count2 + 1,
      }));
      const renderCount = useRef(0);
      renderCount.current += 1;
      return (
        <div>
          <span>{count2}</span>
          <button type="button" onClick={increment}>+1</button>
          <span>{renderCount.current}</span>
        </div>
      );
    };
    const StateProvider = ({ children }) => {
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
    const { getAllByText, container } = render(<App />);
    expect(container).toMatchSnapshot();
    fireEvent.click(getAllByText('+1')[0]);
    expect(container).toMatchSnapshot();
  });
});
