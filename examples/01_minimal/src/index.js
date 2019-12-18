import React, { useReducer, StrictMode } from 'react';
import ReactDOM from 'react-dom';

import {
  createContext,
  useContextSelector,
} from 'use-context-selector';

const initialState = {
  count: 0,
  text: 'hello',
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'increment': return { ...state, count: state.count + 1 };
    case 'decrement': return { ...state, count: state.count - 1 };
    case 'setText': return { ...state, text: action.text };
    default: throw new Error(`unknown action type: ${action.type}`);
  }
};

const context = createContext(null);

const Counter = () => {
  const count = useContextSelector(context, (v) => v[0].count);
  const dispatch = useContextSelector(context, (v) => v[1]);
  return (
    <div>
      {Math.random()}
      <div>
        <span>Count: {count}</span>
        <button type="button" onClick={() => dispatch({ type: 'increment' })}>+1</button>
        <button type="button" onClick={() => dispatch({ type: 'decrement' })}>-1</button>
      </div>
    </div>
  );
};

const TextBox = () => {
  const text = useContextSelector(context, (v) => v[0].text);
  const dispatch = useContextSelector(context, (v) => v[1]);
  return (
    <div>
      {Math.random()}
      <div>
        <span>Text: {text}</span>
        <input value={text} onChange={(event) => dispatch({ type: 'setText', text: event.target.value })} />
      </div>
    </div>
  );
};

const Provider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <context.Provider value={[state, dispatch]}>
      {children}
    </context.Provider>
  );
};

const App = () => (
  <StrictMode>
    <Provider>
      <h1>Counter</h1>
      <Counter />
      <Counter />
      <h1>TextBox</h1>
      <TextBox />
      <TextBox />
    </Provider>
  </StrictMode>
);

ReactDOM.createRoot(document.getElementById('app')).render(<App />);
