# Changelog

All notable changes to Stream Chat Hub are documented in this file.

## [0.5.0]

### Added

- Third-party Twitch emotes support:
  - 7TV
  - BetterTTV
  - FrankerFaceZ
- Individual switches for each third-party emote service
- Third-party emote settings in the Message Filters section
- Emote provider names in hover tooltips
- Text fallback when an emote image cannot be loaded
- OBS overlay fallback for unavailable emote images
- Twitch Shared Chat source-channel detection
- Safe migration for older settings files without emote settings

### Changed

- Third-party emote caches are reset when service settings change
- Twitch reconnects automatically after changing emote service settings
- Message rendering now preserves the emote provider
- Updated Russian and English interface text
- Updated project documentation and roadmap direction

### Fixed

- Incorrect Shared Chat channel attribution
- Duplicate Twitch connection during development startup
- Failed emote images leaving broken image placeholders
- Compatibility with settings files created before version 0.5.0

## [0.4.1]

### Added

- Diagnostics and logs improvements
- Diagnostic archive export
- Safe settings export without authentication tokens
- Update-related improvements

### Fixed

- General stability and interface issues
