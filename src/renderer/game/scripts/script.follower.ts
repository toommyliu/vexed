import { ipcRenderer } from '../../../common/ipc';
import { IPC_EVENTS } from '../../../common/ipc-events';
import { Logger } from '../../../common/logger';

const logger = Logger.get('ScriptFollower');

let on = false;

const toggleElement = (el: HTMLElement, state: boolean) => {
  el.classList.toggle('w3-disabled', state);
  if (state) {
    el.setAttribute('disabled', 'true');
  } else {
    el.removeAttribute('disabled');
  }
};

window.addEventListener('DOMContentLoaded', async () => {
  const player = document.querySelector('#player') as HTMLInputElement;
  const me = document.querySelector('#me') as HTMLButtonElement;
  const skillList = document.querySelector('#skill-list') as HTMLInputElement;
  const skillWait = document.querySelector('#skill-wait') as HTMLInputElement;
  const skillDelay = document.querySelector('#skill-delay') as HTMLInputElement;
  const copyWalk = document.querySelector('#copy-walk') as HTMLInputElement;
  const attackPriority = document.querySelector(
    '#attack-priority',
  ) as HTMLInputElement;
  const start = document.querySelector('#start') as HTMLInputElement;

  const toggleState = (state?: boolean) => {
    // use the state to determine value
    if (state === undefined) {
      on = !on;
    } else {
      on = state;
    }

    start.checked = on;

    toggleElement(player, on);
    toggleElement(me, on);
    toggleElement(skillList, on);
    toggleElement(skillWait, on);
    toggleElement(skillDelay, on);
    toggleElement(copyWalk, on);
    toggleElement(attackPriority, on);
  };

  me.addEventListener('click', async () => {
    const me = await ipcRenderer
      .callMain(IPC_EVENTS.MSGBROKER, {
        data: undefined,
        ipcEvent: IPC_EVENTS.FOLLOWER_ME,
      })
      .then((res) => res as unknown as { name: string })
      .catch(() => {
        logger.error('Failed to get me');
        return null;
      });

    if (!me) return;

    player.value = me.name;
  });

  start.addEventListener('click', async () => {
    toggleState();

    if (on) {
      await ipcRenderer.callMain(IPC_EVENTS.MSGBROKER, {
        ipcEvent: IPC_EVENTS.FOLLOWER_START,
        data: {
          name: player.value,
          skillList: skillList.value,
          skillWait: skillWait.checked,
          skillDelay: skillDelay.value,
          copyWalk: copyWalk.checked,
          attackPriority: attackPriority.value,
        },
      });
    } else {
      await ipcRenderer.callMain(IPC_EVENTS.MSGBROKER, {
        ipcEvent: IPC_EVENTS.FOLLOWER_STOP,
      });
    }
  });

  ipcRenderer.answerMain(
    IPC_EVENTS.FOLLOWER_STOP,
    toggleState.bind(null, false),
  );
  ipcRenderer.answerMain(IPC_EVENTS.REFRESHED, toggleState.bind(null, false));
});
