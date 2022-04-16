import { createElement, FC, PropsWithChildren } from 'react';
import { createContext, useContextSelector } from './index';

const MISSING_PROVIDER = Symbol('MISSING_PROVIDER');

export default function createProviderFromHook<THookValue, TProviderProps>(
  providerHook: (props: TProviderProps) => THookValue,
  defaultValue: THookValue | typeof MISSING_PROVIDER = MISSING_PROVIDER,
) {
  const context = createContext(defaultValue);

  const Provider: FC<PropsWithChildren<TProviderProps>> = (props) => {
    const value = providerHook(props);
    const { children } = props;
    return createElement(context.Provider, { value } as any, children);
  };

  const useSelector = <Selected>(selector: (value: THookValue) => Selected): Selected => (
    useContextSelector(context, (value) => {
      if (value === MISSING_PROVIDER) throw new Error('Cannot use this hook without a Provider');
      return selector(value);
    }));

  return [Provider, useSelector] as const;
}
