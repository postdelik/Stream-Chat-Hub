import path from "node:path";
import { app, BrowserWindow, Menu, shell } from "electron";
import { startLocalServer } from "../server/localServer";

let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

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
    mainWindow?.show();
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
  } else {
    await mainWindow.loadFile(path.join(app.getAppPath(), "dist", "index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  app.setName("Stream Chat Hub");
  app.setAppUserModelId("com.postdelik.streamchathub");

  Menu.setApplicationMenu(null);

  await startLocalServer({
    currentVersion: app.getVersion(),
    appPath: process.execPath,
    isPackaged: app.isPackaged,
    quitApp: () => {
      app.quit();
    },
  });

  await createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow();
  }
});