export default class PortMonitor {
	private readonly port: MessagePort;

	private isAlive: boolean = false;

	private checkInterval?: NodeJS.Timeout;

	private readonly CHECK_INTERVAL = 1_000;

	private readonly onSuccess: (() => void) | undefined;

	private readonly onLostConnection: (() => void) | undefined;

	public constructor(
		port: MessagePort,
		onSuccess?: () => void,
		onLostConnection?: () => void,
	) {
		this.port = port;
		this.onSuccess = onSuccess;
		this.onLostConnection = onLostConnection;
		this.initialize();
	}

	private initialize() {
		this.port.addEventListener('message', (ev: MessageEvent) => {
			// Send the heartbeat
			if (ev.data?.type === 'heartbeat') {
				this.port.postMessage({ type: 'heartbeat-ack' });
			}

			// The heartbeat was acknowledged
			if (ev.data?.type === 'heartbeat-ack') {
				this.isAlive = true;
			}
		});

		this.checkInterval = setInterval(() => {
			if (!this.isAlive) {
				console.log('Looks like we just lost our peer...');
				this.cleanup();
				if (typeof this?.onLostConnection === 'function') {
					this.onLostConnection();
				}

				return;
			}

			// Reset flag and send new heartbeat
			this.isAlive = false;
			this.port.postMessage({ type: 'heartbeat' });
		}, this.CHECK_INTERVAL);

		// Send the initial heartbeat
		this.port.postMessage({ type: 'heartbeat' });
	}

	public cleanup() {
		if (this.checkInterval) {
			clearInterval(this.checkInterval);
		}
	}
}
