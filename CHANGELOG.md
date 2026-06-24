# Changelog

All notable changes to Stream Chat Hub are documented in this file.

## [0.6.0]

### Added

- Interactive guided onboarding with:
  - dimmed background
  - highlighted interface areas
  - automatic section opening
  - focused explanations for sources, Twitch Login, OBS overlay, filters, application settings, chat controls, updates, and diagnostics
- Onboarding completion screen with instructions for restarting the tutorial
- One-time onboarding offer for users upgrading from versions below 0.5.0
- `lastLaunchedVersion` and `onboardingVersion` tracking for future migrations
- Unified **OBS Overlay** settings section
- OBS overlay presets:
  - Compact
  - Standard
  - Text Only
  - Custom
- Automatic switch to Custom after manually changing preset-controlled options
- Separate **Application Settings** section
- Option to inherit OBS overlay appearance inside the application
- Independent in-app chat appearance settings
- System font picker improvements
- Smarter chat scrolling:
  - auto-scroll only near the bottom
  - unread message counter while scrolled up
  - jump-to-latest button
- Authenticated stream status in the combined chat header
- Twitch viewer counter shown only for an authenticated live channel
- Current application version endpoint for migration checks

### Changed

- Reorganized OBS overlay settings into a single section
- Moved overlay appearance controls, OBS URL, and test layout controls together
- Reworked onboarding into a guided interface tour
- Replaced the tutorial restart switch with a compact button
- Improved layout and spacing of source rows
- Improved spacing between platform name and stream status
- Removed redundant Twitch Login success text from the Sources section
- Hidden stream status indicators for anonymous sources
- Hidden viewer counter before Twitch Login
- Improved in-app chat styling inheritance from OBS settings
- Improved responsive behavior in narrow and non-maximized windows
- Updated Russian and English translations
- Updated project documentation for version 0.6.0

### Fixed

- Chat text collapsing into a narrow column when platform icons were hidden
- Chat jumping to the bottom while the user was reading older messages
- Missing third-party emote switches after interface restructuring
- Guided tour elements overlapping each other
- Missing or inconsistent background dimming on some guided tour steps
- Oversized tutorial buttons
- Guided tour layout issues in small windows
- Large tour previews becoming unreadably small
- Horizontal scrollbars inside tutorial cards
- Source delete button moving to a new row
- Viewer counter being visible before authentication
- Incorrect spacing in authenticated stream status
- Legacy settings compatibility for newly added application appearance and onboarding fields

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
