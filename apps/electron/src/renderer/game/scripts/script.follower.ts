import { IPC_EVENTS } from '../../../common/ipc-events';

let on = false;

function toggleState(state: boolean) {
	on = state;

	{
		const input = document.querySelector('#player');
		if (state) {
			input?.setAttribute('disabled', 'true');
		} else {
			input?.removeAttribute('disabled');
		}
	}

	{
		const btn = document.querySelector('#me');
		if (state) {
			btn?.setAttribute('disabled', 'true');
		} else {
			btn?.removeAttribute('disabled');
		}
	}

	{
		const input = document.querySelector('#skill-list');
		if (state) {
			input?.setAttribute('disabled', 'true');
		} else {
			input?.removeAttribute('disabled');
		}
	}

	{
		const input = document.querySelector('#skill-wait');
		if (state) {
			input?.setAttribute('disabled', 'true');
		} else {
			input?.removeAttribute('disabled');
		}
	}

	{
		const input = document.querySelector('#skill-delay');
		if (state) {
			input?.setAttribute('disabled', 'true');
		} else {
			input?.removeAttribute('disabled');
		}
	}

	{
		const input = document.querySelector('#copy-walk');
		if (state) {
			input?.setAttribute('disabled', 'true');
		} else {
			input?.removeAttribute('disabled');
		}
	}

	{
		const input = document.querySelector('#attack-priority');
		if (state) {
			input?.setAttribute('disabled', 'true');
		} else {
			input?.removeAttribute('disabled');
		}
	}
}

window.addEventListener('ready', async () => {
	{
		const btn = document.querySelector('#me') as HTMLButtonElement;
		btn.addEventListener('click', async () => {
			window.msgPort?.postMessage({ event: IPC_EVENTS.FOLLOWER_ME });
		});
	}

	{
		const input = document.querySelector('#start') as HTMLInputElement;
		input.addEventListener('click', async () => {
			toggleState(input.checked);

			// See if button is checked
			if (input.checked) {
				const name = (
					document.querySelector('#player') as HTMLInputElement
				).value;

				window.msgPort?.postMessage({
					event: IPC_EVENTS.FOLLOWER_START,
					args: {
						name,
						skillList: (
							document.querySelector(
								'#skill-list',
							) as HTMLInputElement
						).value,
						skillWait: (
							document.querySelector(
								'#skill-wait',
							) as HTMLInputElement
						).checked,
						skillDelay: (
							document.querySelector(
								'#skill-delay',
							) as HTMLInputElement
						).value,
						copyWalk: (
							document.querySelector(
								'#copy-walk',
							) as HTMLInputElement
						).checked,
						attackPriority: (
							document.querySelector(
								'#attack-priority',
							) as HTMLInputElement
						).value,
					},
				});
			} else {
				window.msgPort?.postMessage({
					event: IPC_EVENTS.FOLLOWER_STOP,
				});
			}
		});
	}

	window.addEventListener('port-ready', async () => {
		if (on) {
			toggleState(false);

			(document.querySelector('#start') as HTMLInputElement).checked =
				false;
		}
	});

	window.addMsgHandler(async (ev) => {
		if (ev.data.event === IPC_EVENTS.FOLLOWER_ME) {
			(document.querySelector('#player') as HTMLInputElement).value =
				ev.data.args.name;
		}
	});
});
