declare global {
	type MessageHandler = (ev: MessageEvent) => Promise<void> | void;

	// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
	interface Window {
		addEventListener(
			type: 'port-ready' | 'ready',
			listener: () => Promise<void> | void,
		): void;
		addMsgHandler(handler: MessageHandler): void;
		msgPort: MessagePort | null;
	}
}

export {};
