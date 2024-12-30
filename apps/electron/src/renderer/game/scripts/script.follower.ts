import { IPC_EVENTS } from '../../../common/ipc-events';

let on = false;

const elPlayer = document.querySelector('#player') as HTMLInputElement;
const elMe = document.querySelector('#me') as HTMLButtonElement;
const elSkillList = document.querySelector('#skill-list') as HTMLInputElement;
const elSkillWait = document.querySelector('#skill-wait') as HTMLInputElement;
const elSkillDelay = document.querySelector('#skill-delay') as HTMLInputElement;
const elCopyWalk = document.querySelector('#copy-walk') as HTMLInputElement;
const elAttackPriority = document.querySelector(
	'#attack-priority',
) as HTMLInputElement;

const toggleElementState = (el: HTMLElement, state: boolean) => {
	if (state) {
		el.classList.add('w3-disabled');
		el.setAttribute('disabled', 'true');
	} else {
		el.classList.remove('w3-disabled');
		el.removeAttribute('disabled');
	}
};

const toggleState = (state: boolean) => {
	on = state;

	toggleElementState(elPlayer, state);
	toggleElementState(elMe, state);
	toggleElementState(elSkillList, state);
	toggleElementState(elSkillWait, state);
	toggleElementState(elSkillDelay, state);
	toggleElementState(elCopyWalk, state);
	toggleElementState(elAttackPriority, state);
};

window.addEventListener('ready', async () => {
	elMe.addEventListener('click', async () => {
		window.msgPort?.postMessage({ event: IPC_EVENTS.FOLLOWER_ME });
	});

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
						skillList: elSkillList.value,
						skillWait: elSkillWait.checked,
						skillDelay: elSkillDelay.value,
						copyWalk: elCopyWalk.checked,
						attackPriority: elAttackPriority.value,
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

			window.msgPort?.postMessage({ event: IPC_EVENTS.FOLLOWER_STOP });

			(document.querySelector('#start') as HTMLInputElement).checked =
				false;
		}
	});

	window.addMsgHandler(async (ev) => {
		if (ev.data.event === IPC_EVENTS.FOLLOWER_ME) {
			elPlayer.value = ev.data.args.name;
		}
	});
});
