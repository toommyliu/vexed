import { contextBridge } from 'electron';
import wasmoon from 'wasmoon';

contextBridge.exposeInMainWorld('wasmoon', wasmoon);

declare global {
	interface Window {
		wasmoon: typeof wasmoon;
	}
}
