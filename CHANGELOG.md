# Change Log

## [Unreleased]

## [1.4.1] - 2022-06-07
### Changed
- fix(build): build script for React Native #83

## [1.4.0] - 2022-05-17
### Added
- experimental suspense/transition support #80

## [1.3.10] - 2022-04-12
### Changed
- Fix types for @types/react@18 (#75)

## [1.3.9] - 2021-09-20
### Changed
- Fix build config (obsoleting v1.3.8 which isn't built correctly)

## [1.3.8] - 2021-09-18
### Changed
- Fix package.json properly for ESM
- Refactor version check with triple equal (#54)

## [1.3.7] - 2021-01-24
### Changed
- Fix extra commits introduced in v1.3.6 (#39)

## [1.3.6] - 2021-01-23
### Changed
- Fix cases rendered from parent (#38)

## [1.3.5] - 2021-01-06
### Changed
- More strict type for useContextUpdate return value
### Added
- Preact support with scheduler=false (#36)

## [1.3.4] - 2020-12-12
### Changed
- Refactor useBridgeValue because it does not depend on changedBits=0

## [1.3.3] - 2020-12-11
### Changed
- Fix an edge case with render bail out (with useContextUpdate)

## [1.3.2] - 2020-12-03
### Changed
- Fix useBridgeValue typing

## [1.3.1] - 2020-12-03
### Changed
- Refactor for efficiency and bundle size
- Check typeof process for `NODE_ENV`

## [1.3.0] - 2020-12-01
### Changed
- No longer depends on changedBits=0 behavior
  - Tearing with parent can't be avoided
- Migrate to TypeScript

## [1.2.12] - 2020-11-29
### Changed
- Re-implement without latest ref for value/selected to fix edge cases

## [1.2.11] - 2020-11-09
### Changed
- Fix default context value

## [1.2.10] - 2020-10-17
### Added
- Peer dependencies for React Native

## [1.2.9] - 2020-10-16
### Changed
- Fix compile script for ESM build

## [1.2.8] - 2020-10-08
### Changed
- Fix incomplete useBridgeValue implementation

## [1.2.7] - 2020-10-08
### Changed
- Fix missing useBridgeValue type

## [1.2.6] - 2020-10-08
### Added
- useBridgeValue for BridgeProvider

## [1.2.5] - 2020-10-03
### Changed
- Again fix bundle for React Native (#27)

## [1.2.4] - 2020-10-03
### Changed
- Fix bundle for React Native (#26)

## [1.2.3] - 2020-10-03
### Changed
- Fix back porting bug in v1.2.0-v1.2.2

## [1.2.2] - 2020-10-02
### Added
- useIsomorphicLayoutEffect for SSR (#25)

## [1.2.1] - 2020-10-01
### Added
- Type definition for useContextUpdate

## [1.2.0] - 2020-10-01
### Added
- useContextUpdate for state branching support

## [1.1.4] - 2020-09-22
### Added
- BridgeProvider for multiple react roots

## [1.1.3] - 2020-09-17
### Changed
- useIsoLayoutEffect for SSR

## [1.1.2] - 2020-07-02
### Changed
- Modern build

## [1.1.1] - 2020-03-02
### Changed
- Avoid React render warning in test (#15)

## [1.1.0] - 2020-02-24
### Changed
- A workaround for React render warning (#13)

## [1.0.1] - 2019-09-27
### Changed
- Shave more bytes in the production environment (#6)

## [1.0.0] - 2019-08-02
### Changed
- Fix API v1

## [0.4.0] - 2019-07-23
### Changed
- Shave bytes (#2)

## [0.3.0] - 2019-07-20
### Changed
- No useLayoutEffect for invoking listeners (which leads de-opt sync mode)

## [0.2.0] - 2019-07-07
### Changed
- Use microbundle

## [0.1.0] - 2019-07-05
### Added
- Initial release
