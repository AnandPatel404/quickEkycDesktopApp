import { ipcRenderer, contextBridge } from "electron";
import { IPC_CHANNELS } from "./constants";

console.log("PRELOAD LOADED");
contextBridge.exposeInMainWorld("electron", {
	getDashboard: () => ipcRenderer.invoke("get-dashboard"),
});

window.addEventListener("message", (event) => {
	if (event.data === IPC_CHANNELS.START_ORPC_SERVER) {
		const [serverPort] = event.ports;

		ipcRenderer.postMessage(IPC_CHANNELS.START_ORPC_SERVER, null, [
			serverPort,
		]);
	}
});
