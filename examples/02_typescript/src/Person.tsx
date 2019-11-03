import React from 'react';

import { useContextSelector } from 'use-context-selector';

import { MyContext } from './state';

const Person = () => {
  const person = useContextSelector(MyContext, v => v[0].person);
  const dispatch = useContextSelector(MyContext, v => v[1]);
  return (
    <div>
      {Math.random()}
      <div>
        First Name:
        <input
          value={person.firstName}
          onChange={(event) => {
            const firstName = event.target.value;
            dispatch({ firstName, type: 'setFirstName' });
          }}
        />
      </div>
      <div>
        Last Name:
        <input
          value={person.lastName}
          onChange={(event) => {
            const lastName = event.target.value;
            dispatch({ lastName, type: 'setLastName' });
          }}
        />
      </div>
      <div>
        Age:
        <input
          value={person.age}
          onChange={(event) => {
            const age = Number(event.target.value) || 0;
            dispatch({ age, type: 'setAge' });
          }}
        />
      </div>
    </div>
  );
};

export default Person;
