import React from 'react';
import {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  createRoot,
} from 'react-dom';

import App from './App';

const ele = document.getElementById('app');
if (!ele) throw new Error('no app');
createRoot(ele).render(React.createElement(App));
