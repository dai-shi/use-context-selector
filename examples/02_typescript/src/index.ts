import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';

const ele = document.getElementById('app');
if (!ele) throw new Error('no app');
createRoot(ele).render(React.createElement(App));
