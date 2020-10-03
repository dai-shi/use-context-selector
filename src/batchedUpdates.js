/* eslint-disable */

let batchedUpdates;

if (REACT_NATIVE) {
  batchedUpdates = require('react-native').unstable_batchedUpdates;
} else {
  batchedUpdates = require('react-dom').unstable_batchedUpdates;
}

export { batchedUpdates };
