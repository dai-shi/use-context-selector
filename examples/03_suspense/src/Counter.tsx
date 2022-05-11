import React, { useTransition } from 'react';

import { useMyState } from './Provider';

const Counter = () => {
  const [isPending, startTransition] = useTransition();
  const { state, increment } = useMyState();
  if (state.promise) {
    throw state.promise;
  }
  const onClick = () => {
    startTransition(increment);
  };
  return (
    <div>
      {Math.random()}
      <div>
        <span>Count: {state.result}</span>
        <button type="button" onClick={onClick}>+1</button>
        {isPending && 'Pending...'}
      </div>
    </div>
  );
};

export default Counter;
