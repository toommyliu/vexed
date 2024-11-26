export const IPC_EVENTS = {
	GET_DOCUMENTS_PATH: 'root:get-documents-path' as const,
	TOGGLE_DEV_TOOLS: 'root:toggle-dev-tools' as const,
	LOGIN: 'root:login' as const,
	LOGIN_SUCCESS: 'root:login-success' as const,
	LOAD_SCRIPT: 'root:load-script' as const,
	ACTIVATE_WINDOW: 'root:activate-window' as const,
	READ_FAST_TRAVELS: 'root:read-fast-travels' as const,
	SETUP_IPC: 'root:setup-ipc' as const,

	FAST_TRAVEL: 'fast-travel' as const,
} as const;
