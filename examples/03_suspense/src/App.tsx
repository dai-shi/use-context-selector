import React, { StrictMode, Suspense } from 'react';

import { Provider } from './Provider';
import Counter from './Counter';

const Body = () => (
  <div>
    <h1>Counter</h1>
    <Counter />
    <Counter />
  </div>
);

const App = () => (
  <StrictMode>
    <Provider>
      <Suspense fallback="Loading...">
        <Body />
      </Suspense>
    </Provider>
  </StrictMode>
);

export default App;
