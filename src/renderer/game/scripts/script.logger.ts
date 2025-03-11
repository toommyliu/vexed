import { ipcRenderer } from '../../../common/ipc';
import { IPC_EVENTS } from '../../../common/ipc-events';

const packets: string[] = [];
let on = false;

function toggleElement(el: HTMLButtonElement, state: boolean) {
  el.disabled = state;
  if (state) {
    el.classList.add('w3-disabled');
    el.setAttribute('disabled', 'true');
  } else {
    el.classList.remove('w3-disabled');
    el.removeAttribute('disabled');
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  {
    const btn = document.querySelector('#save') as HTMLButtonElement;
    btn.addEventListener('click', async () => {
      if (!packets.length) return;

      const blob = new Blob([packets.join('\n')], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'packets.txt';
      a.click();
    });
  }

  {
    const btn = document.querySelector('#copy-all') as HTMLButtonElement;
    btn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(packets.join('\n')).catch(() => {});
    });
  }

  {
    const btn = document.querySelector('#clear') as HTMLButtonElement;
    btn.addEventListener('click', () => {
      document.querySelector('#logger')!.innerHTML = '';
      packets.length = 0;
    });
  }

  {
    const stopBtn = document.querySelector('#stop') as HTMLButtonElement;
    const onBtn = document.querySelector('#start') as HTMLButtonElement;

    stopBtn.addEventListener('click', async () => {
      on = false;

      toggleElement(stopBtn, true);
      toggleElement(onBtn, false);

      await ipcRenderer
        .callMain(IPC_EVENTS.MSGBROKER, {
          ipcEvent: IPC_EVENTS.PACKET_LOGGER_STOP,
        })
        .catch(() => {});
    });

    onBtn.addEventListener('click', async () => {
      on = true;

      toggleElement(stopBtn, false);
      toggleElement(onBtn, true);

      await ipcRenderer
        .callMain(IPC_EVENTS.MSGBROKER, {
          ipcEvent: IPC_EVENTS.PACKET_LOGGER_START,
        })
        .catch(() => {});
    });
  }

  ipcRenderer.answerMain(IPC_EVENTS.PACKET_LOGGER_PACKET, async (args) => {
    if (!on) return;

    // "[Sending - STR]: "
    const pkt = args.packet.slice(17);

    const container = document.querySelector('#logger')!;

    {
      const div = document.createElement('div');
      div.classList.add('line');
      div.textContent = pkt;
      div.addEventListener('click', async () => {
        await navigator.clipboard.writeText(pkt).catch(() => {});
      });
      container.appendChild(div);
    }

    container.scrollTo(0, container!.scrollHeight);
    packets.push(pkt);
  });

  ipcRenderer.answerMain(IPC_EVENTS.REFRESHED, async () => {
    if (on) {
      on = false;

      const stopBtn = document.querySelector('#stop') as HTMLButtonElement;
      const onBtn = document.querySelector('#start') as HTMLButtonElement;

      toggleElement(stopBtn, true);
      toggleElement(onBtn, false);
    }
  });
});

window.addEventListener('beforeunload', async () => {
  if (on) {
    await ipcRenderer.callMain(IPC_EVENTS.MSGBROKER, {
      ipcEvent: IPC_EVENTS.PACKET_LOGGER_STOP,
    });
  }
});
