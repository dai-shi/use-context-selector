"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useContext = exports.useContextSelector = exports.createContext = void 0;

var _react = _interopRequireDefault(require("react"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// utils
var forcedReducer = function forcedReducer(state) {
  return state + 1;
};

var useForceUpdate = function useForceUpdate() {
  return _react["default"].useReducer(forcedReducer, 0)[1];
};

var calculateChangedBits = function calculateChangedBits() {
  return 0;
};

var identity = function identity(x) {
  return x;
};

var CONTEXT_LISTENERS = Symbol('CONTEXT_LISTENERS');

var createProvider = function createProvider(OrigProvider, listeners) {
  return _react["default"].memo(function (_ref) {
    var value = _ref.value,
        children = _ref.children;

    _react["default"].useLayoutEffect(function () {
      listeners.forEach(function (listener) {
        return listener(value);
      });
    }, [value]);

    return _react["default"].createElement(OrigProvider, {
      value: value
    }, children);
  });
}; // createContext


var createContext = function createContext(defaultValue) {
  var context = _react["default"].createContext(defaultValue, calculateChangedBits);

  var listeners = new Set(); // shared listeners (not ideal)

  context[CONTEXT_LISTENERS] = listeners; // hacked provider

  context.Provider = createProvider(context.Provider, listeners); // no support for consumer

  delete context.Consumer;
  return context;
}; // useContextSelector


exports.createContext = createContext;

var useContextSelector = function useContextSelector(context, selector) {
  var listeners = context[CONTEXT_LISTENERS];

  if (!listeners) {
    throw new Error('useContextSelector requires special context');
  }

  var forceUpdate = useForceUpdate();

  var value = _react["default"].useContext(context);

  var selected = selector(value);

  var ref = _react["default"].useRef(null);

  _react["default"].useLayoutEffect(function () {
    ref.current = {
      selector: selector,
      value: value,
      selected: selected
    };
  });

  _react["default"].useLayoutEffect(function () {
    var callback = function callback(nextValue) {
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
      listeners["delete"](callback);
    };
  }, [forceUpdate, listeners]);

  return selected;
}; // useContext


exports.useContextSelector = useContextSelector;

var useContext = function useContext(context) {
  return useContextSelector(context, identity);
};

exports.useContext = useContext;