import * as React from 'react';
import {
  // @ts-ignore
  unstable_createRoot as createRoot,
} from 'react-dom';

import App from './App';

createRoot(document.getElementById('app')).render(React.createElement(App));
