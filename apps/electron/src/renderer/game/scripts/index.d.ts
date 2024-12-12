declare global {
	type MessageHandler = (ev: MessageEvent) => Promise<void> | void;

	// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
	interface Window {
		addMsgHandler(handler: MessageHandler): void;
		msgPort: MessagePort | null;
	}
}

export {};
