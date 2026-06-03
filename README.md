# Stream Chat Hub

[English](#english) | [Русский](#русский)

# Stream Chat Hub

**Stream Chat Hub** is a local desktop app for combining stream chat sources and showing a customizable chat overlay in OBS.

**Stream Chat Hub** — локальное desktop-приложение для объединения стримерских чатов и вывода настраиваемого chat overlay в OBS.

---

## English

### Current status

Stream Chat Hub is currently focused on Twitch and OBS overlay workflow.

You can use it to read Twitch chat, display messages inside the app, show chat in OBS through a Browser Source, customize the overlay appearance, test the overlay without a live chat, check for updates, and create diagnostic archives for support.

### Features

- Twitch chat reading without login
- Twitch Login support
- Multiple Twitch chat sources
- Combined chat window inside the app
- OBS Browser Source overlay
- Custom overlay size, position, font and appearance
- Overlay style modes:
  - color background
  - shared bubble
  - message bubbles
- Custom overlay style files:
  - PNG
  - WebP
  - GIF
  - MP4
  - WebM
  - MOV
- Test overlay mode for checking OBS layout without a live chat
- Message filters:
  - hide commands
  - hide links
  - show only messages with selected words
  - highlight selected words
- Native Twitch emotes rendering in the app
- Native Twitch emotes rendering in OBS overlay
- Twitch viewer counter
- Automatic update check on startup
- Manual update check
- Portable Windows update flow
- Diagnostics and logs section
- Diagnostics archive export
- Safe settings export without auth tokens
- Russian and English interface

### OBS Overlay

The app provides a local OBS Browser Source URL.

Default overlay URL:

```txt
http://localhost:3877/o
```

Add it in OBS:

```txt
Sources → Add → Browser → URL
```

Recommended OBS Browser Source setup:

```txt
Width: 800
Height: 600
Custom CSS: optional
Shutdown source when not visible: optional
Refresh browser when scene becomes active: optional
```

The overlay is transparent by default and can be styled inside the app.

### Updates

Stream Chat Hub can check for new versions on startup.

The app can show an update prompt when a new release is available.  
The update check can be disabled and enabled again from the Updates section.

For packaged Windows portable builds, the updater can download the new executable, close the current app, replace the old executable, and start the app again.

### Diagnostics

Stream Chat Hub can create a diagnostics archive for support and bug reports.

The archive may include:

- logs
- app version
- system information
- safe settings export

Auth tokens are removed from exported settings.

### Local data

Settings and logs are stored locally on your machine.

Typical Windows location:

```txt
C:\Users\<YourUser>\.stream-chat-hub
```

Possible contents:

```txt
settings.json
logs/
diagnostics/
overlay-assets/
```

### Development

Requirements:

- Node.js
- npm
- Git

Install dependencies:

```bash
npm install
```

Run in development mode:

```bash
npm run dev
```

Build the app:

```bash
npm run build
```

Create distributable files:

```bash
npm run dist
```

### Project structure

```txt
src/
  main/        Electron main process
  renderer/    React app UI
  server/      Local server, chat clients, diagnostics, updates
  shared/      Shared TypeScript types
```

### Current roadmap direction

Next major planned areas:

- Diagnostics and logs improvements
- Full Emotes System
- Built-in onboarding / micro tutorial
- Event Feed System
- Stream Manager
- Dock mode and popout windows
- Stable Twitch release

See `ROADMAP.md` for the detailed plan.

### Notes

YouTube support is planned for later and is not currently the main focus.

---

## Русский

### Текущий статус

Stream Chat Hub сейчас сфокусирован на Twitch и OBS overlay workflow.

Приложение можно использовать для чтения Twitch-чата, отображения сообщений внутри приложения, вывода чата в OBS через Browser Source, настройки внешнего вида overlay, тестирования overlay без живого чата, проверки обновлений и создания диагностических архивов для разбора ошибок.

### Возможности

- Чтение Twitch-чата без логина
- Поддержка Twitch Login
- Несколько Twitch-источников чата
- Общий чат внутри приложения
- OBS Browser Source overlay
- Настройка размера, позиции, шрифта и внешнего вида overlay
- Режимы внешнего вида overlay:
  - цветной фон
  - общий бабл
  - баблы сообщений
- Пользовательские файлы стиля overlay:
  - PNG
  - WebP
  - GIF
  - MP4
  - WebM
  - MOV
- Тестовый overlay для проверки OBS без живого чата
- Фильтры сообщений:
  - скрывать команды
  - скрывать ссылки
  - показывать только сообщения с выбранными словами
  - подсвечивать выбранные слова
- Отображение нативных Twitch emotes внутри приложения
- Отображение нативных Twitch emotes в OBS overlay
- Счётчик зрителей Twitch
- Автоматическая проверка обновлений при запуске
- Ручная проверка обновлений
- Обновление portable Windows-версии
- Секция диагностики и логов
- Экспорт диагностического архива
- Безопасный экспорт настроек без auth-токенов
- Русский и английский интерфейс

### OBS Overlay

Приложение создаёт локальную ссылку для OBS Browser Source.

Стандартная ссылка overlay:

```txt
http://localhost:3877/o
```

Добавление в OBS:

```txt
Sources → Add → Browser → URL
```

Рекомендуемые настройки OBS Browser Source:

```txt
Width: 800
Height: 600
Custom CSS: optional
Shutdown source when not visible: optional
Refresh browser when scene becomes active: optional
```

Overlay по умолчанию прозрачный. Внешний вид можно настроить внутри приложения.

### Обновления

Stream Chat Hub умеет проверять новые версии при запуске.

Если доступна новая версия, приложение может показать окно с предложением обновиться.  
Проверку обновлений можно выключить и снова включить в секции “Обновления”.

Для собранной Windows portable-версии updater может скачать новый executable, закрыть текущее приложение, заменить старый файл и запустить приложение заново.

### Диагностика

Stream Chat Hub умеет создавать диагностический архив для поддержки и разбора ошибок.

В архив могут входить:

- логи
- версия приложения
- информация о системе
- безопасный экспорт настроек

Auth-токены удаляются из экспортируемых настроек.

### Локальные данные

Настройки и логи хранятся локально на компьютере.

Обычный путь на Windows:

```txt
C:\Users\<YourUser>\.stream-chat-hub
```

Внутри могут быть:

```txt
settings.json
logs/
diagnostics/
overlay-assets/
```

### Разработка

Нужно установить:

- Node.js
- npm
- Git

Установить зависимости:

```bash
npm install
```

Запустить в development mode:

```bash
npm run dev
```

Собрать приложение:

```bash
npm run build
```

Создать файлы для распространения:

```bash
npm run dist
```

### Структура проекта

```txt
src/
  main/        Electron main process
  renderer/    React app UI
  server/      Local server, chat clients, diagnostics, updates
  shared/      Shared TypeScript types
```

### Текущее направление roadmap

Следующие крупные направления:

- Улучшение диагностики и логов
- Полноценная Emotes System
- Встроенное обучение / micro tutorial
- Event Feed System
- Stream Manager
- Dock mode и отдельные окна
- Стабильный Twitch-релиз

Подробный план находится в `ROADMAP.md`.

### Примечания

Поддержка YouTube планируется позже и сейчас не является основным направлением.
