import React, { useReducer } from 'react';

import { render, fireEvent, cleanup } from '@testing-library/react';

import { createContext, useContextSelector } from '../src/index';

describe.skip('stale props spec', () => {
  afterEach(cleanup);

  it('ignores transient errors in selector (e.g. due to stale props)', () => {
    const Context = createContext(0);
    const Parent: React.FC = () => {
      const count = useContextSelector(Context, (c: number) => c);
      return <Child parentCount={count} />;
    };
    const Child: React.FC<{ parentCount: number }> = ({ parentCount }) => {
      const result = useContextSelector(Context, (c: number) => {
        if (c !== parentCount) {
          throw new Error();
        }
        return c + parentCount;
      });
      return <div>{result}</div>;
    };
    const App: React.FC = () => {
      const [count, dispatch] = useReducer((c: number) => c + 1, 0);
      return (
        <>
          <button type="button" onClick={dispatch}>increment</button>
          <Context.Provider value={count}>
            <Parent />
          </Context.Provider>
        </>
      );
    };
    const { getByText } = render(<App />);
    expect(() => {
      fireEvent.click(getByText('increment'));
    }).not.toThrow();
  });

  it('ensures consistency of state and props in selector', () => {
    let selectorSawInconsistencies = false;
    const Context = createContext(0);
    const Parent: React.FC = () => {
      const count = useContextSelector(Context, (c: number) => c);
      return <Child parentCount={count} />;
    };
    const Child: React.FC<{ parentCount: number }> = ({ parentCount }) => {
      const result = useContextSelector(Context, (c: number) => {
        selectorSawInconsistencies = selectorSawInconsistencies || c !== parentCount;
        return c + parentCount;
      });
      return <div>{result}</div>;
    };
    const App: React.FC = () => {
      const [count, dispatch] = useReducer((c: number) => c + 1, 0);
      return (
        <>
          <button type="button" onClick={dispatch}>increment</button>
          <Context.Provider value={count}>
            <Parent />
          </Context.Provider>
        </>
      );
    };
    const { getByText } = render(<App />);
    fireEvent.click(getByText('increment'));
    expect(selectorSawInconsistencies).toBe(false);
  });
});
