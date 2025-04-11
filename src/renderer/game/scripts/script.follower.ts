import { ipcRenderer } from '../../../common/ipc';
import { IPC_EVENTS } from '../../../common/ipc-events';
import { toggleElement } from '../ui-utils';

let on = false;

window.addEventListener('DOMContentLoaded', async () => {
  const inputPlayer =
    document.querySelector<HTMLInputElement>('#input-player')!;
  const btnMe = document.querySelector<HTMLButtonElement>('#btn-me')!;
  const skillList = document.querySelector<HTMLInputElement>('#skill-list')!;
  const skillWait = document.querySelector<HTMLInputElement>('#skill-wait')!;
  const skillDelay = document.querySelector<HTMLInputElement>('#skill-delay')!;
  const copyWalk = document.querySelector<HTMLInputElement>('#copy-walk')!;
  const cbSafeSkill =
    document.querySelector<HTMLInputElement>('#cb-safe-skill')!;
  const inputSafeSkill =
    document.querySelector<HTMLInputElement>('#input-safe-skill')!;
  const inputSafeSkillHp = document.querySelector<HTMLInputElement>(
    '#input-safe-skill-hp',
  )!;
  const attackPriority =
    document.querySelector<HTMLInputElement>('#attack-priority')!;
  const cbAntiCounter =
    document.querySelector<HTMLInputElement>('#cb-anti-counter')!;
  const textarea_quests =
    document.querySelector<HTMLTextAreaElement>('#quests')!;
  const textarea_drops = document.querySelector<HTMLTextAreaElement>('#drops')!;

  const cbEnable = document.querySelector<HTMLInputElement>('#cb-enable')!;

  const toggleState = (state?: boolean) => {
    // use the state to determine value
    if (state === undefined) {
      on = !on;
    } else {
      on = state;
    }

    cbEnable.checked = on;

    toggleElement(inputPlayer, !on);
    toggleElement(btnMe, !on);
    toggleElement(skillList, !on);
    toggleElement(skillWait, !on);
    toggleElement(skillDelay, !on);
    toggleElement(copyWalk, !on);
    toggleElement(attackPriority, !on);
    toggleElement(cbSafeSkill, !on);
    toggleElement(inputSafeSkill, !on);
    toggleElement(inputSafeSkillHp, !on);
    toggleElement(cbAntiCounter, !on);
    toggleElement(textarea_quests, !on);
    toggleElement(textarea_drops, !on);
  };

  if (btnMe) {
    btnMe.addEventListener('click', async () => {
      const me = await ipcRenderer
        .callMain(IPC_EVENTS.MSGBROKER, {
          data: undefined,
          ipcEvent: IPC_EVENTS.FOLLOWER_ME,
        })
        .then((res) => res as unknown as { name: string })
        .catch(() => null);

      if (!me) return;

      inputPlayer.value = me.name;
    });
  }

  if (cbEnable) {
    cbEnable.addEventListener('click', async () => {
      toggleState();

      if (on) {
        await ipcRenderer.callMain(IPC_EVENTS.MSGBROKER, {
          ipcEvent: IPC_EVENTS.FOLLOWER_START,
          data: {
            name: inputPlayer.value,
            skillList: skillList.value,
            skillWait: skillWait.checked,
            skillDelay: skillDelay.value,
            safeSkillEnabled: cbSafeSkill.checked,
            safeSkill: inputSafeSkill.value,
            safeSkillHp: inputSafeSkillHp.value,
            copyWalk: copyWalk.checked,
            attackPriority: attackPriority.value,
            antiCounter: cbAntiCounter.checked,
            quests: textarea_quests.value,
            drops: textarea_drops.value,
          },
        });
      } else {
        await ipcRenderer.callMain(IPC_EVENTS.MSGBROKER, {
          ipcEvent: IPC_EVENTS.FOLLOWER_STOP,
        });
      }
    });
  }

  ipcRenderer.answerMain(
    IPC_EVENTS.FOLLOWER_STOP,
    toggleState.bind(null, false),
  );
  ipcRenderer.answerMain(IPC_EVENTS.REFRESHED, toggleState.bind(null, false));
});

window.addEventListener('beforeunload', async () => {
  if (on) {
    await ipcRenderer.callMain(IPC_EVENTS.MSGBROKER, {
      ipcEvent: IPC_EVENTS.FOLLOWER_STOP,
    });
  }
});
