import { create } from "zustand";

declare global {
	interface Window {
		electron: {
			getDashboard: () => Promise<Response>;
		};
	}
}

export interface Settings {
	id: number;
	name: string;
	desc: string;
	url: string;
	inputs: {
		name: string;
		key: string;
	}[];
}

export interface GetJson {
	data: Settings[];
}

export interface UserStateInterface {
	data: Settings[];
	getSettingsById: (id: number) => Settings | undefined;
	dashboard: () => Promise<void>;
}
const useUserStore = create((set) => ({
	data: [] as Settings[],
	dashboard: async () => {
		try {
			const response = await window.electron.getDashboard()
			set({ data: response });
			return response;
		} catch (error) {
			console.error(error);
		}
	}
}));

export default useUserStore;
