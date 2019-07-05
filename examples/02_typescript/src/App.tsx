import * as React from 'react';
import { StrictMode } from 'react';

import { useValue, MyContext } from './state';
import Counter from './Counter';
import Person from './Person';

const Provider: React.FC = ({ children }) => {
  const [state, dispatch] = useValue();
  return (
    <MyContext.Provider value={[state, dispatch]}>
      {children}
    </MyContext.Provider>
  );
};
const App = () => (
  <StrictMode>
    <Provider>
      <h1>Counter</h1>
      <Counter />
      <Counter />
      <h1>Person</h1>
      <Person />
      <Person />
    </Provider>
  </StrictMode>
);

export default App;
