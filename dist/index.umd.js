!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports,require("react")):"function"==typeof define&&define.amd?define(["exports","react"],t):t((e=e||self).useContextSelector={},e.react)}(this,function(e,t){t=t&&t.hasOwnProperty("default")?t.default:t;var r=function(e){return e+1},n=function(){return 0},u=function(e){return e},o=Symbol("CONTEXT_LISTENERS"),c=function(e,n){var u=e[o];if(!u)throw new Error("useContextSelector requires special context");var c=t.useReducer(r,0)[1],f=t.useContext(e),i=n(f),a=t.useRef(null);return t.useLayoutEffect(function(){a.current={selector:n,value:f,selected:i}}),t.useLayoutEffect(function(){var e=function(e){try{if(a.current.value===e||Object.is(a.current.selected,a.current.selector(e)))return}catch(e){}c()};return u.add(e),function(){u.delete(e)}},[c,u]),i};e.createContext=function(e){var r=t.createContext(e,n),u=new Set;return r[o]=u,r.Provider=function(e,r){return t.memo(function(n){var u=n.value,o=n.children;return r.forEach(function(e){return e(u)}),t.createElement(e,{value:u},o)})}(r.Provider,u),delete r.Consumer,r},e.useContext=function(e){return c(e,u)},e.useContextSelector=c});
//# sourceMappingURL=index.umd.js.map
