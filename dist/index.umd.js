(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react')) :
  typeof define === 'function' && define.amd ? define(['exports', 'react'], factory) :
  (factory((global.useContextSelector = {}),global.react));
}(this, (function (exports,React) {
  React = React && React.hasOwnProperty('default') ? React['default'] : React;

  var forcedReducer = function (state) { return state + 1; };

  var useForceUpdate = function () { return React.useReducer(forcedReducer, 0)[1]; };

  var calculateChangedBits = function () { return 0; };

  var identity = function (x) { return x; };

  var CONTEXT_LISTENERS = Symbol('CONTEXT_LISTENERS');

  var createProvider = function (OrigProvider, listeners) { return React.memo(function (ref) {
    var value = ref.value;
    var children = ref.children;

    React.useLayoutEffect(function () {
      listeners.forEach(function (listener) { return listener(value); });
    }, [value]);
    return React.createElement(OrigProvider, {
      value: value
    }, children);
  }); }; // createContext


  var createContext = function (defaultValue) {
    var context = React.createContext(defaultValue, calculateChangedBits);
    var listeners = new Set(); // shared listeners (not ideal)

    context[CONTEXT_LISTENERS] = listeners; // hacked provider

    context.Provider = createProvider(context.Provider, listeners); // no support for consumer

    delete context.Consumer;
    return context;
  }; // useContextSelector

  var useContextSelector = function (context, selector) {
    var listeners = context[CONTEXT_LISTENERS];

    if (!listeners) {
      throw new Error('useContextSelector requires special context');
    }

    var forceUpdate = useForceUpdate();
    var value = React.useContext(context);
    var selected = selector(value);
    var ref = React.useRef(null);
    React.useLayoutEffect(function () {
      ref.current = {
        selector: selector,
        value: value,
        selected: selected
      };
    });
    React.useLayoutEffect(function () {
      var callback = function (nextValue) {
        try {
          if (ref.current.value === nextValue || Object.is(ref.current.selected, ref.current.selector(nextValue))) {
            return;
          }
        } catch (e) {// ignored (stale props or some other reason)
        }

        ref.current.value = nextValue;
        forceUpdate();
      };

      listeners.add(callback);
      return function () {
        listeners.delete(callback);
      };
    }, [forceUpdate, listeners]);
    return selected;
  }; // useContext

  var useContext = function (context) { return useContextSelector(context, identity); };

  exports.createContext = createContext;
  exports.useContextSelector = useContextSelector;
  exports.useContext = useContext;

})));
//# sourceMappingURL=index.umd.js.map
