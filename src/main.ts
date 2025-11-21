import { app, BrowserWindow } from "electron";
// "electron-squirrel-startup" seems broken when packaging with vite
//import started from "electron-squirrel-startup";
import path from "path";
import {
	installExtension,
	REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";
import { ipcMain } from "electron/main";
import { ipcContext } from "@/ipc/context";
import { IPC_CHANNELS } from "./constants";

const inDevelopment = false;

function createWindow() {
	const preload = path.join(__dirname, "preload.js");
	const mainWindow = new BrowserWindow({
		width: 800,
		height: 800,
		webPreferences: {
			devTools: inDevelopment,
			contextIsolation: true,
			nodeIntegration: false,
			nodeIntegrationInSubFrames: false,
			preload,
		},
		titleBarStyle:
			process.platform === "darwin" ? "hiddenInset" : undefined,
		trafficLightPosition:
			process.platform === "darwin" ? { x: 5, y: 5 } : undefined,
	});
	ipcContext.setMainWindow(mainWindow);
	mainWindow.webContents.openDevTools();
	if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
	} else {
		mainWindow.loadFile(
			path.join(
				__dirname,
				`../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`,
			),
		);
	}
}

async function installExtensions() {
	try {
		const result = await installExtension(REACT_DEVELOPER_TOOLS);
		console.log(`Extensions installed successfully: ${result.name}`);
	} catch {
		console.error("Failed to install extensions");
	}
}

async function setupORPC() {
	const { rpcHandler } = await import("./ipc/handler");

	ipcMain.on(IPC_CHANNELS.START_ORPC_SERVER, (event) => {
		const [serverPort] = event.ports;

		serverPort.start();
		rpcHandler.upgrade(serverPort);
	});
}

// API handler for renderer → main request
ipcMain.handle("get-dashboard", async () => {
	const url = "https://quickekyc.com/windows_app.json";
	const res = await fetch(url);
	return await res.json();
});

app.whenReady().then(createWindow).then(installExtensions).then(setupORPC);

//osX only
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});
//osX only ends
