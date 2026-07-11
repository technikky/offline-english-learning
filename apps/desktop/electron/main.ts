import { app, BrowserWindow, session } from "electron";
import path from "node:path";

function createWindow(): void {
  const win = new BrowserWindow({
    width: 900,
    height: 640,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // The renderer only ever loads our own local index.html (never arbitrary
  // remote content), so granting microphone access for the Stage 9 speech
  // features doesn't carry the risk it would for a general-purpose browser.
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === "media");
  });

  win.loadFile(path.join(__dirname, "../../src/index.html"));
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
