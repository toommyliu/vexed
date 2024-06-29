var EventEmitter = require('@tbnritzdoge/events');
var { setInterval, clearInterval } = require('worker-timers');

class Timer extends EventEmitter {
	constructor(delay, repeatCount = 0) {
		super();

		this.m_delay = delay;
		this.m_repeatCount = repeatCount;
		this.m_iteration = 0;
		this.intervalID = null;
	}

	get delay() {
		return this.m_delay;
	}

	set delay(value) {
		this.m_delay = value;
		if (this.running) {
			this.stop();
			this.start();
		}
	}

	get repeatCount() {
		return this.m_repeatCount;
	}

	set repeatCount(value) {
		this.m_repeatCount = value;
		if (
			this.running &&
			this.m_repeatCount !== 0 &&
			this.m_iteration >= this.m_repeatCount
		) {
			this.stop();
		}
	}

	get currentCount() {
		return this.m_iteration;
	}

	get running() {
		return this.intervalID !== null;
	}

	tick() {
		this.m_iteration++;
		this._timerDispatch();
		if (
			this.m_repeatCount !== 0 &&
			this.m_iteration >= this.m_repeatCount
		) {
			this.stop();
			this.emit('timerComplete');
		}
	}

	start() {
		if (!this.running) {
			this._start(this.m_delay, this.tick.bind(this));
		}
	}

	reset() {
		if (this.running) {
			this.stop();
		}
		this.m_iteration = 0;
	}

	_start(m_delay, m_tick) {
		this.intervalID = setInterval(m_tick, m_delay);
	}

	_timerDispatch() {
		this.emit('timer');
	}

	stop() {
		if (this.running) {
			clearInterval(this.intervalID);
			this.intervalID = null;
		}
	}
}
