// eslint-disable-next-line spaced-comment
/// <reference types="react-dom/experimental" />

import React from 'react';
import { createRoot } from 'react-dom';

import App from './App';

const ele = document.getElementById('app');
if (!ele) throw new Error('no app');
createRoot(ele).render(React.createElement(App));
