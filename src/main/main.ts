import path from "node:path";
import { app, BrowserWindow, Menu, shell } from "electron";
import { startLocalServer } from "../server/localServer";
import { logger } from "../server/logger";

let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception in main process", {
    name: error.name,
    message: error.message,
    stack: error.stack,
  });
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection in main process", {
    reason:
      reason instanceof Error
        ? {
            name: reason.name,
            message: reason.message,
            stack: reason.stack,
          }
        : String(reason),
  });
});

function getIconPath() {
  if (isDev) {
    return path.join(process.cwd(), "build", "icon.ico");
  }

  return path.join(app.getAppPath(), "build", "icon.ico");
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 620,
    backgroundColor: "#080714",
    show: false,
    icon: getIconPath(),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.setMenu(null);

  mainWindow.once("ready-to-show", () => {
    logger.app("Main window ready to show");
    mainWindow?.show();
  });

  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    logger.error("Renderer process gone", details);
  });

  mainWindow.webContents.on("unresponsive", () => {
    logger.error("Main window became unresponsive");
  });

  mainWindow.webContents.on("responsive", () => {
    logger.app("Main window became responsive again");
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);

    return {
      action: "deny",
    };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    const currentUrl = mainWindow?.webContents.getURL();

    if (!currentUrl) {
      return;
    }

    const isSamePage = url === currentUrl;
    const isLocalDevPage = isDev && url.startsWith("http://localhost:5173");
    const isLocalAppPage = url.startsWith("file://");

    if (isSamePage || isLocalDevPage || isLocalAppPage) {
      return;
    }

    event.preventDefault();
    void shell.openExternal(url);
  });

  if (isDev) {
    await mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    await mainWindow.loadFile(path.join(app.getAppPath(), "dist", "index.html"));
  }

  mainWindow.on("closed", () => {
    logger.app("Main window closed");
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  app.setName("Stream Chat Hub");
  app.setAppUserModelId("com.postdelik.streamchathub");

  Menu.setApplicationMenu(null);

  logger.app("App is ready", {
    version: app.getVersion(),
    isPackaged: app.isPackaged,
    execPath: process.execPath,
  });

  await startLocalServer({
    currentVersion: app.getVersion(),
    appPath: process.execPath,
    isPackaged: app.isPackaged,
    quitApp: () => {
      logger.app("Quit app requested");
      app.quit();
    },
  });

  await createWindow();
});

app.on("window-all-closed", () => {
  logger.app("All windows closed");

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", async () => {
  logger.app("App activated");

  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow();
  }
});

app.on("before-quit", () => {
  logger.app("App before quit");
});

app.on("will-quit", () => {
  logger.app("App will quit");
});