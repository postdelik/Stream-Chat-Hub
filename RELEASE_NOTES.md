# Release Notes

---

# Stream Chat Hub v0.4.1

## English

### Fixed
- Fixed automatic chat reconnection after restarting the app.
- Fixed chat messages being visually clipped in the app.
- Improved portable updater window title and installation status messages.

### Improved
- Portable updater now shows readable update steps instead of an empty console window.

---

## Русский

### Исправлено
- Исправлено автоматическое подключение чата после перезапуска приложения.
- Исправлено визуальное обрезание сообщений в чате приложения.
- Улучшено окно portable updater: теперь есть нормальное название и статусы установки.

### Улучшено
- Portable updater теперь показывает понятные этапы обновления вместо пустого консольного окна.

---
# Stream Chat Hub v0.4.0

## English

### Added
- Diagnostics and logs section.
- Diagnostics archive export.
- Save dialog for choosing where to save the diagnostics archive.
- Safe settings export without Twitch and YouTube tokens.
- App version and system information inside diagnostics archive.
- Local server logs.
- Update check logs.
- Renderer error logging.
- Main process error logging.
- Clear logs button.
- Initial native Twitch emotes rendering inside the app.
- Initial native Twitch emotes rendering inside OBS overlay.

### Improved
- Updates auto-check option now uses a slider instead of a checkbox.
- Diagnostics section layout.
- Diagnostics buttons layout.
- Application crash and error reporting.
- README documentation.

### Notes
- Diagnostics archives are designed to help with support and bug reports.
- Sensitive auth tokens are removed from exported settings.
- Native Twitch emotes are included as an early foundation for the full Emotes System planned for v0.5.0.

---

## Русский

### Добавлено
- Секция “Диагностика и логи”.
- Экспорт диагностического архива.
- Окно выбора места сохранения диагностического архива.
- Безопасный экспорт настроек без Twitch и YouTube токенов.
- Информация о версии приложения и системе внутри диагностического архива.
- Логи local server.
- Логи проверки обновлений.
- Логирование ошибок renderer.
- Логирование ошибок main process.
- Кнопка очистки логов.
- Первичное отображение нативных Twitch emotes внутри приложения.
- Первичное отображение нативных Twitch emotes в OBS overlay.

### Улучшено
- Настройка автопроверки обновлений теперь использует слайдер вместо checkbox.
- Внешний вид секции диагностики.
- Раскладка кнопок диагностики.
- Логирование падений и ошибок приложения.
- README документация.

### Примечания
- Диагностические архивы нужны для помощи с поддержкой и баг-репортами.
- Auth-токены удаляются из экспортируемых настроек.
- Нативные Twitch emotes добавлены как ранняя основа для полноценной Emotes System, запланированной на v0.5.0.

---

# Stream Chat Hub v0.4.0-alpha.1

## English

### Added
- Initial Twitch emotes support.
- Twitch emote tags parsing from chat messages.
- Native Twitch emotes rendering inside the app chat.
- Native Twitch emotes rendering inside the OBS overlay.
- Emote image support in shared chat message structure.

### Improved
- Chat message rendering now supports mixed text and emote images.
- OBS overlay message rendering now supports mixed text and emote images.
- Highlighted words continue to work together with emotes.

### Notes
- This is the first step toward the full Emotes System planned for v0.4.0.
- Current support is focused on native Twitch emotes.
- 7TV, BTTV, FFZ, emote settings, and emote size controls are planned next.

---

## Русский

### Добавлено
- Первая поддержка Twitch emotes.
- Парсинг Twitch emote tags из сообщений чата.
- Отображение нативных Twitch emotes внутри приложения.
- Отображение нативных Twitch emotes в OBS overlay.
- Поддержка emote-картинок в общей структуре сообщений.

### Улучшено
- Рендер сообщений теперь поддерживает смешанный текст и emote-картинки.
- OBS overlay теперь поддерживает смешанный текст и emote-картинки.
- Подсветка слов продолжает работать вместе с emotes.

### Примечания
- Это первый шаг к полноценной Emotes System для v0.4.0.
- Сейчас поддерживаются нативные Twitch emotes.
- 7TV, BTTV, FFZ, настройки emotes и размер emotes планируются дальше.

---

# Stream Chat Hub v0.3.0

## English

### Added
- Automatic update checks on startup.
- Update prompt when a new version is available.
- Option to disable update checks directly from the update prompt.
- Updates section with:
  - manual update check
  - auto-check toggle
  - current version display
  - latest version display
- Portable update flow for packaged Windows builds.
- Stable executable filename without version in the file name.
- Custom application icon.
- Custom SVG viewer counter icon.
- New update modal UI.

### Improved
- Language selection screen styling.
- Application window icon handling in development and packaged builds.
- Windows build configuration.
- Release workflow preparation.
- Viewer counter alignment.
- Default Electron menu is now hidden.

### Notes
- Auto-update installation is intended for packaged Windows portable builds.
- In development mode, the app can check for updates, but cannot replace itself.
- The portable updater downloads the new `.exe`, closes the current app, replaces the old executable, and starts the app again.

---

## Русский

### Добавлено
- Автоматическая проверка обновлений при запуске.
- Окно предложения обновления, если доступна новая версия.
- Возможность выключить проверку обновлений прямо из окна обновления.
- Секция “Обновления” с:
  - ручной проверкой обновлений
  - переключателем автопроверки
  - отображением текущей версии
  - отображением последней версии
- Сценарий обновления portable-версии для Windows-сборок.
- Стабильное имя `.exe` файла без версии в названии.
- Собственная иконка приложения.
- SVG-иконка счётчика зрителей.
- Новый UI окна обновления.

### Улучшено
- Экран выбора языка.
- Обработка иконки приложения в dev-режиме и собранной версии.
- Конфигурация Windows-сборки.
- Подготовка release workflow.
- Выравнивание счётчика зрителей.
- Стандартное меню Electron теперь скрыто.

### Примечания
- Установка обновлений рассчитана на собранную Windows portable-версию.
- В dev-режиме приложение может проверить обновления, но не может заменить само себя.
- Portable updater скачивает новый `.exe`, закрывает текущее приложение, заменяет старый файл и запускает приложение снова.

---

# Stream Chat Hub v0.2.2

## English

### Added
- Overlay style modes:
  - Color
  - Shared bubble
  - Message bubbles
- Upload custom overlay styles:
  - PNG
  - WebP
  - GIF
  - MP4
  - WebM
  - MOV
- Optional style preview inside the app.
- Message font selector.
- Background color picker with HEX input.
- Size hints for shared and per-message bubble assets.
- Option to show or hide custom overlay style inside the app.
- ROADMAP.md.
- Updated README with English and Russian sections.

### Improved
- Cleaner segmented controls for overlay modes.
- Cleaner segmented controls for overlay presets.
- Better chat message layout when styles are enabled.
- Better color picker UI.
- Cleaner OBS link section.
- Cleaner filters section.
- Cleaner about section.
- Language selection screen text.
- Project description on GitHub.

### Fixed
- Missing translation keys.
- CSS import typing issue.
- App message spacing when custom styles are enabled.
- Overlay style layout issues inside the app.
- HEX color field duplication.
- Several UI text leftovers that showed untranslated keys.

---

## Русский

### Добавлено
- Режимы внешнего вида overlay:
  - Цвет
  - Общий бабл
  - Баблы сообщений
- Загрузка своих стилей overlay:
  - PNG
  - WebP
  - GIF
  - MP4
  - WebM
  - MOV
- Опциональный показ стиля внутри приложения.
- Выбор шрифта сообщений.
- Выбор цвета фона через color picker и HEX.
- Подсказки размеров для общего бабла и баблов сообщений.
- Возможность показывать или скрывать custom overlay style внутри приложения.
- ROADMAP.md.
- Обновлённый README на английском и русском языках.

### Улучшено
- Более аккуратные переключатели режимов overlay.
- Более аккуратные переключатели пресетов overlay.
- Улучшена раскладка сообщений при включённых стилях.
- Улучшен UI выбора цвета.
- Очищена секция OBS-ссылки.
- Очищена секция фильтров.
- Очищена секция информации о проекте.
- Текст на экране выбора языка.
- Описание проекта на GitHub.

### Исправлено
- Недостающие переводы.
- Ошибка типизации CSS import.
- Наложение сообщений при включённых custom styles.
- Проблемы отображения overlay style внутри приложения.
- Дублирование HEX color поля.
- Несколько UI-строк, которые отображались как ключи переводов.

---

# Stream Chat Hub v0.2.1

## English

### Added
- Twitch viewer counter.
- Improved Twitch Login workflow.
- Support for reading Twitch chat through login-based connection.
- Support for reading public Twitch chat without login.
- Initial overlay appearance controls.
- Overlay test mode.
- Local settings persistence.
- Portable Windows build preparation.

### Improved
- Twitch source handling.
- Active sources status.
- OBS overlay link section.
- About section.
- Russian and English translation structure.
- Local server structure.

### Fixed
- Twitch login issue that incorrectly displayed a YouTube OAuth error.
- Active sources count issues.
- Duplicate Twitch login/read UI confusion.
- Viewer count visibility logic.
- Several build and TypeScript issues.

---

## Русский

### Добавлено
- Счётчик зрителей Twitch.
- Улучшенный Twitch Login workflow.
- Поддержка чтения Twitch-чата через login-подключение.
- Поддержка публичного чтения Twitch-чата без логина.
- Первые настройки внешнего вида overlay.
- Тестовый overlay режим.
- Локальное сохранение настроек.
- Подготовка portable Windows build.

### Улучшено
- Работа с Twitch-источниками.
- Отображение статуса активных источников.
- Секция OBS overlay link.
- Секция “О проекте”.
- Структура переводов RU/EN.
- Структура local server.

### Исправлено
- Ошибка, когда при Twitch Login показывалось сообщение про YouTube OAuth.
- Проблемы с количеством активных источников.
- Путаница с дублированием Twitch Login / Twitch read.
- Логика отображения количества зрителей.
- Несколько ошибок сборки и TypeScript.

---

# Stream Chat Hub v0.2.0

## English

### Added
- Early Twitch chat integration.
- Basic OBS overlay.
- Local server for chat and overlay.
- Basic chat window inside the app.
- Initial source management.
- Initial settings UI.
- Basic Russian and English interface support.

### Improved
- Project structure.
- Electron development workflow.
- Renderer and server separation.
- Initial build configuration.

---

## Русский

### Добавлено
- Первая интеграция Twitch-чата.
- Базовый OBS overlay.
- Local server для чата и overlay.
- Базовое окно чата внутри приложения.
- Первичное управление источниками.
- Первичный UI настроек.
- Базовая поддержка русского и английского интерфейса.

### Улучшено
- Структура проекта.
- Electron dev workflow.
- Разделение renderer и server логики.
- Первичная конфигурация сборки.