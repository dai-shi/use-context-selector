import React, { useCallback, useState, StrictMode } from 'react';

import { render, fireEvent, cleanup } from '@testing-library/react';

import { createContext, useContext } from '../src/index';

describe('tearing spec', () => {
  afterEach(cleanup);

  it('should not tear with parent', () => {
    const initialState = {
      count: 0,
    };
    const context = createContext(initialState);
    const Counter: React.FC<{ parentCount: number }> = ({ parentCount }) => {
      const count = useContext(context, useCallback((v) => v.count, []));
      if (parentCount !== count) throw new Error('tears!!!');
      return (
        <div>
          <div>{parentCount}</div>
          <div>{count}</div>
        </div>
      );
    };
    const Parent: React.FC = () => {
      const [state, setState] = useState(initialState);
      const increment = () => setState((s) => ({
        ...s,
        count: s.count + 1,
      }));
      return (
        <context.Provider value={state}>
          <Counter parentCount={state.count} />
          <button type="button" onClick={increment}>+1</button>
        </context.Provider>
      );
    };
    const App = () => (
      <StrictMode>
        <Parent />
      </StrictMode>
    );
    const { getAllByText } = render(<App />);
    expect(() => {
      fireEvent.click(getAllByText('+1')[0]);
    }).not.toThrow();
  });
});
