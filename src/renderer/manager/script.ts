import { ipcRenderer } from "../../common/ipc";
import { IPC_EVENTS } from "../../common/ipc-events";
import { Logger } from "../../common/logger";
import type { Account } from "../../common/types";
import type { ServerData } from "../game/lib/models/Server";
import { enableElement, disableElement } from "../game/ui-utils";

const logger = Logger.get("ScriptManager");

// TODO: refactor
const accounts: Account[] = [];
const servers: ServerData[] = [];

let scriptPath: string | null = null;

// TODO: remove selected doesn't work?

const timeouts = new Map<string, NodeJS.Timeout>();

ipcRenderer.answerMain(IPC_EVENTS.ENABLE_BUTTON, async ({ username }) => {
  const timeout = timeouts.get(username);
  if (timeout) {
    clearTimeout(timeout);
    timeouts.delete(username);
  }

  await new Promise((resolve) => {
    setTimeout(resolve, 500);
  });

  enableAccount(username);
});

function enableAccount(username: string) {
  for (const el of document.querySelectorAll<HTMLButtonElement>("#start")) {
    if (el.dataset["username"] === username) {
      enableElement(el);
    }
  }
}

async function startAccount({ username, password }: Account) {
  const serversSelect = document.querySelector<HTMLSelectElement>("#servers")!;

  const timeout = setTimeout(() => {
    enableAccount(username);
    timeouts.delete(username);
  }, 10_000); // 10 seconds should be long enough for an account to login
  timeouts.set(username, timeout);

  await ipcRenderer
    .callMain(IPC_EVENTS.LAUNCH_GAME, {
      username,
      password,
      server: serversSelect.value!,
      scriptPath: scriptPath ?? "",
    })
    .catch(() => {});
}

async function removeAccount({ username }: Pick<Account, "username">) {
  const timeout = timeouts.get(username);
  if (timeout) {
    clearTimeout(timeout);
    timeouts.delete(username);
  }

  await ipcRenderer
    .callMain(IPC_EVENTS.REMOVE_ACCOUNT, { username })
    .catch(() => {});
}

function updateAccountState(ev: MouseEvent) {
  const checkbox = (ev.target as Element)!
    .closest(".account-card")!
    .querySelector("input") as HTMLInputElement;

  checkbox.checked = !checkbox.checked;
  checkbox.dispatchEvent(new Event("change", { bubbles: true }));
}

function updateSelectedCount() {
  const selectedCount = document.querySelectorAll<HTMLInputElement>(
    ".account-checkbox:checked",
  ).length;
  const startSelectedBtn =
    document.querySelector<HTMLButtonElement>("#start-selected")!;
  startSelectedBtn.innerHTML = `Start Selected (${selectedCount})`;
}

function updateAccounts() {
  for (const timeout of timeouts.values()) clearTimeout(timeout);
  timeouts.clear();

  const accountsContainer = document.querySelector("#accounts")!;
  accountsContainer.innerHTML = accounts
    .map(
      (account) => `
      <div class="account-card rounded-md border border-zinc-800 bg-zinc-900 shadow-md">
        <div class="flex justify-between items-center p-4 space-x-4">
          <div class="flex items-center space-x-3 flex-1">
            <input
              type="checkbox"
              class="account-checkbox flex-shrink-0"
              data-username="${account.username}"
              data-password="${account.password}"
            />
            <h4 class="m-0 cursor-pointer select-none break-all whitespace-nowrap overflow-visible text-white username-toggle">
              ${account.username}
            </h4>
          </div>
          <div class="flex space-x-2">
            <button id="remove" class="rounded-md border border-zinc-700 bg-zinc-800 p-2 shadow-sm transition-all duration-200 hover:bg-zinc-700 text-white"
              data-username="${account.username}"
              data-password="${account.password}">Remove</button>
            <button id="start" class="rounded-md border border-zinc-700 bg-zinc-800 p-2 shadow-sm transition-all duration-200 hover:bg-zinc-700 text-white"
              data-username="${account.username}"
              data-password="${account.password}"
              >Start</button>
          </div>
        </div>
      </div>
    `,
    )
    .join("");

  for (const el of document.querySelectorAll(".username-toggle")) {
    (el as HTMLSpanElement).addEventListener("click", updateAccountState);
  }

  const checkboxes =
    document.querySelectorAll<HTMLInputElement>(".account-checkbox");
  for (const checkbox of checkboxes) {
    checkbox.addEventListener("change", updateSelectedCount);
  }

  const removeBtns = document.querySelectorAll<HTMLButtonElement>("#remove");
  for (const el of removeBtns) {
    el.addEventListener("click", async () => {
      const username = el.dataset["username"]!;

      const idx = accounts.findIndex((acc) => acc.username === username);
      if (idx !== -1) {
        accounts.splice(idx, 1);
        await removeAccount({ username });
        updateAccounts();
      }
    });
  }

  const startBtns = document.querySelectorAll<HTMLButtonElement>("#start");
  for (const el of startBtns) {
    el.addEventListener("click", async () => {
      disableElement(el);

      const username = el.dataset["username"]!;
      const password = el.dataset["password"]!;

      await startAccount({ username, password });
    });
  }

  updateSelectedCount();
}

function updateServers() {
  const select = document.querySelector<HTMLSelectElement>("#servers")!;
  select.innerHTML = servers
    .map(
      (server) => `
				<option value="${server.sName}">${server.sName} (${server.iCount})</option>
			`,
    )
    .join("");
}

window.addEventListener("DOMContentLoaded", async () => {
  {
    const btn = document.querySelector("#accordion-toggle")!;
    const form = document.querySelector("#add-account-form")!;

    form.classList.add(
      "transition-all",
      "duration-100",
      "ease-linear",
      "transform",
    );

    btn.addEventListener("click", () => {
      form.classList.toggle("scale-y-0");
      form.classList.toggle("opacity-0");
      form.classList.toggle("h-0");
    });
  }

  {
    const form = document.querySelector("#account-form") as HTMLFormElement;
    const btn = document.querySelector(
      "button[type=submit]",
    ) as HTMLButtonElement;

    form.addEventListener("submit", async (ev) => {
      disableElement(btn);
      ev.preventDefault();

      const formData = new FormData(ev.target as HTMLFormElement);

      const username = formData.get("username");
      const password = formData.get("password");

      if (!username || !password) {
        return;
      }

      const el = document.querySelector("#alert") as HTMLElement;
      const cl = el.classList;

      try {
        el.innerHTML = "";
        cl.remove("text-green-500", "text-red-500", "hidden", "block");

        const account = {
          username: username as string,
          password: password as string,
        };

        const res = await ipcRenderer
          .callMain(IPC_EVENTS.ADD_ACCOUNT, account)
          .catch(() => ({
            success: false,
          }));

        if (res?.success) {
          // eslint-disable-next-line require-atomic-updates
          el.innerHTML = "Account added successfully";
          accounts.push(account);
          updateAccounts();
        } else {
          // eslint-disable-next-line require-atomic-updates
          el.innerHTML = "An error occurred while trying to add the account";
        }

        el!.style.display = "block";
        cl.remove("hidden");
        cl.add("block");

        cl.add(res?.success ? "text-green-500" : "text-red-500", "opacity-100");

        cl.remove("hidden");
        setTimeout(
          () => {
            cl.add("hidden");
            el.style.display = "none";
            setTimeout(() => {
              el.innerHTML = "";
              cl.remove("block", "hidden", "text-green-500", "text-red-500");
            }, 400);
          },
          1_000 * (res?.success ? 1 : 2),
        );
      } catch (error) {
        logger.error("failed to add account:", error);

        el.innerHTML = `An error occurred while trying to add the account${error instanceof Error && error.message ? `: ${error.message}` : ""}`;

        cl.add("text-red-500", "block");
        cl.remove("hidden");

        setTimeout(() => {
          cl.add("hidden");
          el.style.display = "none";
          setTimeout(() => {
            el.innerHTML = "";
            cl.remove("block", "hidden", "text-green-500", "text-red-500");
          }, 400);
        }, 2_000);
      } finally {
        enableElement(btn);
      }
    });
  }

  {
    const cb = document.querySelector<HTMLInputElement>("#start-with-script")!;
    const btn = document.querySelector<HTMLButtonElement>("#select-script")!;

    const selectedScriptName = document.querySelector<HTMLSpanElement>(
      "#selected-script-name",
    )!;

    cb.addEventListener("change", () => {
      btn.disabled = !cb.checked;

      if (cb.checked) {
        enableElement(btn);
      } else {
        disableElement(btn);
        scriptPath = null;
        selectedScriptName.textContent = "";
      }
    });

    btn.addEventListener("click", async () => {
      if (!cb.checked) return;

      const ret = await ipcRenderer.callMain(IPC_EVENTS.MGR_LOAD_SCRIPT);
      if (!ret) return;

      console.log("Selected script:", ret);
      scriptPath = ret;
    });
  }

  const [accountsOut, serversOut] = await Promise.all([
    ipcRenderer.callMain(IPC_EVENTS.GET_ACCOUNTS),
    fetch("https://game.aq.com/game/api/data/servers").then(async (resp) =>
      resp.json(),
    ),
  ]);

  try {
    accounts.push(...accountsOut);
  } catch (error) {
    console.error(error);
    // eslint-disable-next-line no-alert
    alert("An error occured trying to read accounts file");
  }

  servers.push(...serversOut);

  updateAccounts();
  updateServers();

  const removeSelectedBtn =
    document.querySelector<HTMLButtonElement>("#remove-selected")!;
  removeSelectedBtn.addEventListener("click", async () => {
    for (const el of document.querySelectorAll<HTMLButtonElement>("#remove")) {
      const input = el
        .closest(".w3-card")!
        .querySelector<HTMLInputElement>("input")!;
      if (!input.checked) {
        continue;
      }

      const username = el.dataset["username"]!;
      await removeAccount({ username });

      const idx = accounts.findIndex((acc) => acc.username === username);
      if (idx !== -1) {
        accounts.splice(idx, 1);
      }
    }

    updateAccounts();
  });

  const startSelectedBtn =
    document.querySelector<HTMLButtonElement>("#start-selected")!;
  startSelectedBtn.addEventListener("click", async () => {
    for (const el of document.querySelectorAll<HTMLInputElement>("#start")) {
      const input = (
        el.closest(".account-card") as HTMLDivElement
      ).querySelector("input") as HTMLInputElement;

      if (!input.checked) {
        continue;
      }

      el.disabled = true;

      await startAccount({
        username: el.dataset["username"]!,
        password: el.dataset["password"]!,
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 1_000);
      });
    }
  });
});
