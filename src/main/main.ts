import path from "node:path";
import { app, BrowserWindow, shell } from "electron";
import { startLocalServer } from "../server/localServer";

let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

async function createWindow() {
mainWindow = new BrowserWindow({
  width: 1200,
  height: 800,
  minWidth: 420,
  minHeight: 520,
  backgroundColor: "#080714",
  show: false,
  icon: path.join(app.getAppPath(), "build", "icon.ico"),
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
  },
});

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);

    return {
      action: "deny",
    };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (
      url.startsWith("https://accounts.google.com") ||
      url.startsWith("https://youtube.com") ||
      url.startsWith("https://www.youtube.com")
    ) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
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
  await startLocalServer();
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