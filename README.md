# Stream Chat Hub

[Русский](#русский) | [English](#english)

---

## Русский

**Stream Chat Hub** — desktop-приложение для объединения сообщений из чатов стриминговых платформ и вывода их в OBS через настраиваемый overlay.

Приложение создано для стримеров, которым нужен простой способ читать чат, подключать несколько источников и быстро настраивать внешний вид сообщений на трансляции.

## Основные функции

- Чтение Twitch-чата с одного или нескольких каналов.
- Подключение Twitch-чата без входа в аккаунт.
- Поддержка Twitch Login через OAuth.
- Локальная overlay-страница для OBS.
- Короткая ссылка для OBS Browser Source.
- Настройка размера overlay.
- Настройка ширины блока чата.
- Настройка размера шрифта.
- Ограничение количества сообщений на экране.
- Позиционирование чата: слева, по центру или справа.
- Настройка внешнего вида сообщений.
- Возможность показывать или скрывать:
  - иконку платформы;
  - название канала;
  - имя автора.
- Настройка прозрачности фона сообщений.
- Настройка скругления сообщений.
- Настройка расстояния между сообщениями.
- Фильтры сообщений:
  - скрывать команды, которые начинаются с `!`;
  - скрывать сообщения со ссылками;
  - показывать только сообщения с указанными словами;
  - подсвечивать выбранные слова.
- Встроенный тестовый режим overlay.
- Portable Windows `.exe`.

## OBS Overlay

Stream Chat Hub запускает локальный overlay-сервер.

Ссылка для OBS:

```txt
http://localhost:3877/o
```

Как использовать:

1. Откройте OBS.
2. Добавьте новый источник **Browser Source**.
3. Вставьте ссылку overlay.
4. Укажите Width и Height такими же, как в приложении.
5. Включите тестовый overlay для проверки.
6. Настройте размер шрифта, ширину чата, прозрачность, позицию и количество сообщений.

## Twitch

Stream Chat Hub поддерживает два режима работы с Twitch.

### Без входа

Можно читать публичный Twitch-чат без авторизации.

### Twitch Login

Можно войти через Twitch-аккаунт и подключаться к чату с использованием user access token.

## YouTube

Поддержка YouTube запланирована в будущих версиях.  
В интерфейсе уже есть подготовленная секция для YouTube.

## Текущая версия

```txt
1.2.0
```

## Статус проекта

Проект находится в beta-версии.  
Главная цель — сделать простой инструмент для объединения чатов и вывода сообщений в OBS без сложной настройки.

## Технологии

- Electron
- React
- TypeScript
- Vite
- Fastify
- WebSocket
- tmi.js
- electron-builder

## Разработка

Установка зависимостей:

```bash
npm install
```

Запуск в режиме разработки:

```bash
npm run dev
```

Сборка проекта:

```bash
npm run build
```

Сборка portable-версии для Windows:

```bash
npm run dist:portable
```

## Планы

- Поддержка YouTube-чата.
- Дополнительные темы overlay.
- Больше интеграций со стриминговыми платформами.
- Расширенные фильтры и инструменты модерации.
- Импорт и экспорт настроек.
- Публичные релизы через GitHub Releases.
- Автообновление приложения.

## Поддержка

Ссылка на поддержку будет добавлена позже.


---

## English

**Stream Chat Hub** is a desktop app for combining live chat messages from streaming platforms and displaying them in OBS through a customizable overlay.

The app is designed for streamers who want a simple way to read chat, connect multiple sources, and quickly adjust how messages appear on stream.

## Main Features

- Read Twitch chat from one or multiple channels.
- Connect to Twitch chat without logging in.
- Twitch Login support through OAuth.
- Local OBS overlay page.
- Short overlay URL for OBS Browser Source.
- Custom overlay size.
- Adjustable chat block width.
- Adjustable font size.
- Message limit control.
- Chat positioning: left, center, or right.
- Message appearance settings.
- Ability to show or hide:
  - platform icon;
  - channel name;
  - author name.
- Message background opacity control.
- Message border radius control.
- Message spacing control.
- Message filters:
  - hide commands starting with `!`;
  - hide messages containing links;
  - show only messages containing selected words;
  - highlight selected words.
- Built-in overlay test mode.
- Portable Windows `.exe`.

## OBS Overlay

Stream Chat Hub runs a local overlay server.

Default OBS overlay URL:

```txt
http://localhost:3877/o
```

How to use:

1. Open OBS.
2. Add a new **Browser Source**.
3. Paste the overlay URL.
4. Set Width and Height to match the values in the app.
5. Enable the test overlay mode to preview messages.
6. Adjust font size, chat width, opacity, position, and message count.

## Twitch

Stream Chat Hub supports two Twitch modes.

### Anonymous Mode

Read public Twitch chat without authentication.

### Twitch Login

Log in with a Twitch account and connect to chat using a user access token.

## YouTube

YouTube support is planned for future versions.  
The interface already includes a prepared YouTube section.

## Current Version

```txt
1.2.0
```

## Project Status

The project is currently in beta.  
The main goal is to provide a simple tool for combining stream chats and displaying messages in OBS without complicated setup.

## Tech Stack

- Electron
- React
- TypeScript
- Vite
- Fastify
- WebSocket
- tmi.js
- electron-builder

## Development

Install dependencies:

```bash
npm install
```

Run development mode:

```bash
npm run dev
```

Build the project:

```bash
npm run build
```

Build portable Windows version:

```bash
npm run dist:portable
```

## Roadmap

- YouTube chat support.
- Additional overlay themes.
- More streaming platform integrations.
- Advanced filters and moderation tools.
- Import and export settings.
- Public releases through GitHub Releases.
- Auto-update support.

## Support

Support link will be added later.
