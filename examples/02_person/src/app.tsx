import { StrictMode } from 'react';
import type { ReactNode } from 'react';

import { useValue, MyContext } from './state';
import Counter from './counter';
import Person from './person';

const Provider = ({ children }: { children: ReactNode }) => (
  <MyContext.Provider value={useValue()}>{children}</MyContext.Provider>
);

const Body = () => (
  <div>
    <h1>Counter</h1>
    <Counter />
    <Counter />
    <h1>Person</h1>
    <Person />
    <Person />
  </div>
);

const App = () => (
  <StrictMode>
    <Provider>
      <Body />
    </Provider>
  </StrictMode>
);

export default App;
