/* @refresh reload */
import "../../polyfills";
import "./style.css";
import { createHotkey } from "@tanstack/solid-hotkeys";
import {
  Icon,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AppShell,
  Badge,
  Button,
  type ButtonProps,
  Card,
  Checkbox,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Kbd,
  Spinner,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@vexed/ui";
import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  type JSX,
} from "solid-js";
import {
  ACCOUNT_SERVER_REFRESH_COOLDOWN_MS,
  type AccountGameServer,
  type AccountManagerState,
  type AccountScriptSession,
  type ManagedAccount,
  type ManagedAccountGroups,
  type ManagedAccountDraft,
  type ScriptExecutePayload,
} from "../../../shared/ipc";
import { mountWindow } from "../mount";

interface AccountFormState {
  readonly label: string;
  readonly username: string;
  readonly password: string;
}

interface SaveOptions {
  readonly closeAfterSave: boolean;
}

interface LaunchScriptSelection {
  readonly enabled: boolean;
  readonly payload: ScriptExecutePayload | null;
}

interface GroupFormState {
  readonly name: string;
  readonly usernames: ReadonlySet<string>;
}

const NO_SERVER_VALUE = "__no_server__";
const MANUAL_GROUP_VALUE = "__manual_selection__";
const LAUNCH_WITH_SCRIPT_CHECKBOX_ID = "account-manager-launch-with-script";
const ACCOUNT_PASSWORD_INPUT_ID = "account-manager-account-password";

const emptyState: AccountManagerState = {
  accounts: [],
  groups: {},
  sessions: [],
  storagePath: "",
};

const emptyForm = (): AccountFormState => ({
  label: "",
  username: "",
  password: "",
});

const emptyLaunchScriptSelection = (): LaunchScriptSelection => ({
  enabled: false,
  payload: null,
});

const emptyGroupForm = (): GroupFormState => ({
  name: "",
  usernames: new Set(),
});

const toDraft = (form: AccountFormState): ManagedAccountDraft => ({
  label: form.label.trim() === "" ? form.username : form.label,
  username: form.username,
  password: form.password,
});

const toForm = (account: ManagedAccount): AccountFormState => ({
  label: account.label,
  username: account.username,
  password: account.password,
});

type ServerAvailability = "full" | "offline" | "online";

const serverAvailability = (server: AccountGameServer): ServerAvailability => {
  if (!server.online) {
    return "offline";
  }

  return server.playerCount >= server.maxPlayers ? "full" : "online";
};

const serverMeta = (server: AccountGameServer): string =>
  `(${server.playerCount}/${server.maxPlayers})`;

const statusVariant = (
  status: AccountScriptSession["status"] | undefined,
): "outline" | "success" | "warning" | "error" | "secondary" => {
  switch (status) {
    case "running":
      return "success";
    case "starting":
      return "warning";
    case "failed":
      return "error";
    case "stopped":
      return "secondary";
    default:
      return "outline";
  }
};

const sameAccount = (previous: ManagedAccount, next: ManagedAccount): boolean =>
  previous.label === next.label &&
  previous.username === next.username &&
  previous.password === next.password;

const sameVisibleSession = (
  previous: AccountScriptSession,
  next: AccountScriptSession,
): boolean =>
  previous.username === next.username &&
  previous.gameWindowId === next.gameWindowId &&
  previous.status === next.status &&
  previous.scriptName === next.scriptName &&
  previous.message === next.message;

const sameGroups = (
  previous: ManagedAccountGroups,
  next: ManagedAccountGroups,
): boolean => {
  const previousEntries = Object.entries(previous);
  const nextEntries = Object.entries(next);
  if (previousEntries.length !== nextEntries.length) {
    return false;
  }

  return previousEntries.every(([name, previousUsernames]) => {
    const nextUsernames = next[name];
    return (
      nextUsernames !== undefined &&
      previousUsernames.length === nextUsernames.length &&
      previousUsernames.every(
        (username, index) => username === nextUsernames[index],
      )
    );
  });
};

const reconcileAccounts = (
  previousAccounts: readonly ManagedAccount[],
  nextAccounts: readonly ManagedAccount[],
): readonly ManagedAccount[] => {
  const previousByUsername = new Map(
    previousAccounts.map((account) => [account.username, account]),
  );
  let changed = previousAccounts.length !== nextAccounts.length;
  const accounts = nextAccounts.map((account, index) => {
    const previous = previousByUsername.get(account.username);
    if (previous !== undefined && sameAccount(previous, account)) {
      changed ||= previousAccounts[index] !== previous;
      return previous;
    }

    changed = true;
    return account;
  });

  return changed ? accounts : previousAccounts;
};

const reconcileSessions = (
  previousSessions: readonly AccountScriptSession[],
  nextSessions: readonly AccountScriptSession[],
): readonly AccountScriptSession[] => {
  const previousByUsername = new Map(
    previousSessions.map((session) => [session.username, session]),
  );
  let changed = previousSessions.length !== nextSessions.length;
  const sessions = nextSessions.map((session, index) => {
    const previous = previousByUsername.get(session.username);
    if (previous !== undefined && sameVisibleSession(previous, session)) {
      changed ||= previousSessions[index] !== previous;
      return previous;
    }

    changed = true;
    return session;
  });

  return changed ? sessions : previousSessions;
};

const reconcileAccountManagerState = (
  previousState: AccountManagerState,
  nextState: AccountManagerState,
): AccountManagerState => {
  const accounts = reconcileAccounts(
    previousState.accounts,
    nextState.accounts,
  );
  const sessions = reconcileSessions(
    previousState.sessions,
    nextState.sessions,
  );
  const groups = sameGroups(previousState.groups, nextState.groups)
    ? previousState.groups
    : nextState.groups;

  if (
    previousState.storagePath === nextState.storagePath &&
    previousState.accounts === accounts &&
    previousState.groups === groups &&
    previousState.sessions === sessions
  ) {
    return previousState;
  }

  return {
    accounts,
    groups,
    sessions,
    storagePath: nextState.storagePath,
  };
};

function AccountActionButton(props: {
  readonly "aria-label": string;
  readonly children: JSX.Element;
  readonly disabled?: boolean;
  readonly tooltip: string;
  readonly onClick: () => void;
}): JSX.Element {
  return (
    <Tooltip closeDelay={0} openDelay={200} positioning={{ placement: "top" }}>
      <TooltipTrigger
        asChild={(triggerProps) => (
          <Button
            {...(triggerProps({
              "aria-label": props["aria-label"],
              children: props.children,
              disabled: props.disabled,
              onClick: props.onClick,
              size: "icon",
              type: "button",
              variant: "ghost",
            } as ButtonProps) as ButtonProps)}
          />
        )}
      />
      <TooltipContent>{props.tooltip}</TooltipContent>
    </Tooltip>
  );
}

function AccountDeleteTrigger(props: {
  readonly "aria-label": string;
  readonly disabled?: boolean;
  readonly tooltip: string;
}): JSX.Element {
  return (
    <Tooltip closeDelay={0} openDelay={200} positioning={{ placement: "top" }}>
      <AlertDialogTrigger
        asChild={(dialogTriggerProps) => (
          <TooltipTrigger
            asChild={(tooltipTriggerProps) => (
              <Button
                {...(dialogTriggerProps(
                  tooltipTriggerProps({
                    "aria-label": props["aria-label"],
                    children: <Icon icon="trash_2" class="button__icon" />,
                    class: "account-row__delete",
                    disabled: props.disabled,
                    size: "icon-lg",
                    type: "button",
                    variant: "ghost",
                  } as ButtonProps),
                ) as ButtonProps)}
              />
            )}
          />
        )}
      />
      <TooltipContent>{props.tooltip}</TooltipContent>
    </Tooltip>
  );
}

function App(): JSX.Element {
  let accountSearchInput: HTMLInputElement | undefined;
  let groupFieldElement: HTMLDivElement | undefined;
  let groupComboboxInput: HTMLInputElement | undefined;
  let usernameInput: HTMLInputElement | undefined;
  let scriptPathInputElement: HTMLInputElement | undefined;
  let serverSelectionSettlingTimeout: number | undefined;
  let skipNextScriptPathBlur = false;
  const [state, setState] = createSignal<AccountManagerState>(emptyState);
  const [stateLoaded, setStateLoaded] = createSignal(false);
  const [selectedAccountUsernames, setSelectedAccountUsernames] = createSignal<
    ReadonlySet<string>
  >(new Set());
  const [selectedGroupName, setSelectedGroupName] = createSignal("");
  const [groupDialogOpen, setGroupDialogOpen] = createSignal(false);
  const [groupDialogMode, setGroupDialogMode] = createSignal<"create" | "edit">(
    "create",
  );
  const [editingGroupName, setEditingGroupName] = createSignal<string | null>(
    null,
  );
  const [groupForm, setGroupForm] = createSignal<GroupFormState>(
    emptyGroupForm(),
  );
  const [groupDialogError, setGroupDialogError] = createSignal("");
  const [groupSearchQuery, setGroupSearchQuery] = createSignal("");
  const [form, setForm] = createSignal<AccountFormState>(emptyForm());
  const [passwordVisible, setPasswordVisible] = createSignal(false);
  const [dialogOpen, setDialogOpen] = createSignal(false);
  const [dialogMode, setDialogMode] = createSignal<"create" | "edit">("create");
  const [editingUsername, setEditingUsername] = createSignal<string | null>(
    null,
  );
  const [dialogError, setDialogError] = createSignal("");
  const [searchQuery, setSearchQuery] = createSignal("");
  const [launchScript, setLaunchScript] = createSignal<LaunchScriptSelection>(
    emptyLaunchScriptSelection(),
  );
  const [scriptPathInput, setScriptPathInput] = createSignal("");
  const [scriptPathDraft, setScriptPathDraft] = createSignal("");
  const [scriptPathEditing, setScriptPathEditing] = createSignal(false);
  const [scriptError, setScriptError] = createSignal("");
  const [launchServer, setLaunchServer] = createSignal("");
  const [serverInputValue, setServerInputValue] = createSignal("");
  const [serverSearchQuery, setServerSearchQuery] = createSignal("");
  const [serverSelectionInitialized, setServerSelectionInitialized] =
    createSignal(false);
  const [servers, setServers] = createSignal<readonly AccountGameServer[]>([]);
  const [serversLoading, setServersLoading] = createSignal(false);
  const [serverSelectionSettling, setServerSelectionSettling] =
    createSignal(false);
  const [serverError, setServerError] = createSignal("");
  const [serverRefreshCooldownUntil, setServerRefreshCooldownUntil] =
    createSignal(0);
  const [serverRefreshNow, setServerRefreshNow] = createSignal(Date.now());
  const [busy, setBusy] = createSignal(false);

  const accounts = createMemo(() => state().accounts);
  const accountUsernames = createMemo(
    () => new Set(accounts().map((account) => account.username)),
  );
  const groups = createMemo(() => state().groups);
  const groupEntries = createMemo(() =>
    Object.entries(groups()).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );
  const filteredAccounts = createMemo(() => {
    const query = searchQuery().trim().toLowerCase();
    if (query === "") {
      return accounts();
    }

    return accounts().filter((account) => {
      return (
        account.label.toLowerCase().includes(query) ||
        account.username.toLowerCase().includes(query)
      );
    });
  });
  const sessionsByUsername = createMemo(() => {
    const sessions = new Map<string, AccountScriptSession>();
    for (const session of state().sessions) {
      sessions.set(session.username, session);
    }
    return sessions;
  });
  const selectedLaunchUsernames = createMemo(() => {
    return [...selectedAccountUsernames()];
  });
  const selectedAccountCount = createMemo(
    () => selectedAccountUsernames().size,
  );
  const filteredGroupAccounts = createMemo(() => {
    const query = groupSearchQuery().trim().toLowerCase();
    if (query === "") {
      return accounts();
    }

    return accounts().filter(
      (account) =>
        account.label.toLowerCase().includes(query) ||
        account.username.toLowerCase().includes(query),
    );
  });
  const formSubmittable = createMemo(
    () => form().username.trim() !== "" && form().password.trim() !== "",
  );
  const groupFormSubmittable = createMemo(() => groupForm().name.trim() !== "");
  const serverOptions = createMemo(() => servers());
  const filteredServerOptions = createMemo(() => {
    const query = serverSearchQuery().trim().toLowerCase();
    if (query === "") {
      return serverOptions();
    }

    return serverOptions().filter((server) =>
      server.name.toLowerCase().includes(query),
    );
  });
  const showNoServerOption = createMemo(() => {
    const query = serverSearchQuery().trim().toLowerCase();
    return query === "" || "none".includes(query);
  });
  const serverRefreshCoolingDown = createMemo(
    () => serverRefreshNow() < serverRefreshCooldownUntil(),
  );
  const selectedScript = createMemo(() => launchScript().payload);
  const selectedScriptPath = createMemo(() => {
    const payload = selectedScript();
    return payload?.path ?? payload?.name ?? "";
  });
  const selectedScriptLabel = createMemo(() => {
    const payload = selectedScript();
    return payload?.name ?? payload?.path ?? "";
  });
  const selectedGroupLabel = createMemo(
    () => selectedGroupName() || "Manual selection",
  );
  const launchScriptPayload = createMemo(() => {
    const selection = launchScript();
    return selection.enabled ? selection.payload : null;
  });

  createHotkey(
    "/",
    (event) => {
      if (event.repeat) {
        return;
      }

      accountSearchInput?.focus();
      accountSearchInput?.select();
    },
    {
      eventType: "keydown",
      conflictBehavior: "replace",
      ignoreInputs: true,
    },
  );

  createHotkey(
    "G",
    (event) => {
      if (event.repeat) {
        return;
      }

      groupComboboxInput?.focus();
      groupFieldElement
        ?.querySelector<HTMLButtonElement>(".combobox__trigger")
        ?.click();
    },
    {
      eventType: "keydown",
      conflictBehavior: "replace",
      ignoreInputs: true,
    },
  );

  createEffect(() => {
    if (dialogOpen()) {
      window.requestAnimationFrame(() => {
        usernameInput?.focus();
      });
    }
  });

  const applyState = (incomingState: AccountManagerState) => {
    const previousState = state();
    const nextState = reconcileAccountManagerState(
      previousState,
      incomingState,
    );
    if (nextState !== previousState) {
      setState(nextState);
    }
    setStateLoaded(true);

    const usernames = new Set(
      nextState.accounts.map((account) => account.username),
    );
    const currentGroupName = selectedGroupName();
    setSelectedAccountUsernames((previous) => {
      if (currentGroupName !== "") {
        const groupUsernames = nextState.groups[currentGroupName];
        if (groupUsernames !== undefined) {
          return new Set(
            groupUsernames.filter((username) => usernames.has(username)),
          );
        }
      }

      let removed = false;
      const next = new Set<string>();
      for (const username of previous) {
        if (usernames.has(username)) {
          next.add(username);
        } else {
          removed = true;
        }
      }

      return removed ? next : previous;
    });

    if (
      currentGroupName !== "" &&
      nextState.groups[currentGroupName] === undefined
    ) {
      setSelectedGroupName("");
    }

    const currentEditingUsername = editingUsername();
    if (currentEditingUsername && !usernames.has(currentEditingUsername)) {
      setEditingUsername(null);
    }
  };

  const setFormField = (field: keyof AccountFormState, value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const loadServers = async (options?: { readonly refresh?: boolean }) => {
    if (serverSelectionSettlingTimeout !== undefined) {
      window.clearTimeout(serverSelectionSettlingTimeout);
      serverSelectionSettlingTimeout = undefined;
    }
    setServersLoading(true);
    setServerSelectionSettling(true);
    setServerError("");
    try {
      const nextServers = options?.refresh
        ? await window.ipc.accounts.refreshServers()
        : await window.ipc.accounts.getServers();
      setServerRefreshCooldownUntil(nextServers.refreshAvailableAt);
      setServers(nextServers.servers);
      if (!serverSelectionInitialized()) {
        const nextLaunchServer =
          nextServers.servers.find(
            (server) => server.online && server.playerCount < server.maxPlayers,
          )?.name ?? "";
        setLaunchServer(nextLaunchServer);
        setServerInputValue(nextLaunchServer);
        setServerSelectionInitialized(true);
      }
    } catch (error) {
      console.error("Failed to load servers:", error);
      const nextMessage =
        error instanceof Error ? error.message : "Server load failed";
      setServerError(nextMessage);
    } finally {
      setServersLoading(false);
      serverSelectionSettlingTimeout = window.setTimeout(() => {
        setServerSelectionSettling(false);
        serverSelectionSettlingTimeout = undefined;
      }, 180);
    }
  };

  const handleRefreshServers = async () => {
    const timestamp = Date.now();
    if (serversLoading() || timestamp < serverRefreshCooldownUntil()) {
      return;
    }

    setServerRefreshNow(timestamp);
    setServerRefreshCooldownUntil(
      timestamp + ACCOUNT_SERVER_REFRESH_COOLDOWN_MS,
    );
    await loadServers({ refresh: true });
  };

  const setLaunchScriptEnabled = (enabled: boolean) => {
    setLaunchScript((previous) => ({
      ...previous,
      enabled: enabled && previous.payload !== null,
    }));
  };

  const setLaunchScriptPayload = (payload: ScriptExecutePayload) => {
    setLaunchScript({
      enabled: true,
      payload,
    });
    setScriptPathInput(payload.path ?? payload.name ?? "");
    setScriptPathDraft("");
    setScriptPathEditing(false);
    setScriptError("");
  };

  const clearLaunchScript = () => {
    setLaunchScript(emptyLaunchScriptSelection());
    setScriptPathInput("");
    setScriptPathDraft("");
    setScriptPathEditing(false);
    setScriptError("");
  };

  const loadScriptPath = async (path: string) => {
    const normalizedPath = path.trim();
    if (normalizedPath === "") {
      clearLaunchScript();
      return;
    }
    if (normalizedPath === selectedScriptPath() && selectedScript() !== null) {
      setScriptPathDraft(scriptPathInput());
      setScriptPathEditing(false);
      setScriptError("");
      return;
    }

    setBusy(true);
    setScriptError("");
    try {
      setLaunchScriptPayload(
        await window.ipc.scripting.readFile(normalizedPath),
      );
      setScriptPathEditing(false);
    } catch (error) {
      console.error("Failed to read script:", error);
      setScriptError(
        error instanceof Error
          ? error.message
          : "Script path could not be read",
      );
    } finally {
      setBusy(false);
    }
  };

  const openCreateDialog = () => {
    setEditingUsername(null);
    setDialogMode("create");
    setForm(emptyForm());
    setDialogError("");
    setPasswordVisible(false);
    setDialogOpen(true);
  };

  const openEditDialog = (account: ManagedAccount) => {
    setEditingUsername(account.username);
    setDialogMode("edit");
    setForm(toForm(account));
    setDialogError("");
    setPasswordVisible(false);
    setDialogOpen(true);
  };

  const selectGroup = (
    groupName: string,
    nextGroups: ManagedAccountGroups = groups(),
  ) => {
    if (groupName === "") {
      setSelectedGroupName("");
      return;
    }

    const members = nextGroups[groupName];
    if (members === undefined) {
      setSelectedGroupName("");
      return;
    }

    const usernames = accountUsernames();
    setSelectedGroupName(groupName);
    setSelectedAccountUsernames(
      new Set(members.filter((username) => usernames.has(username))),
    );
  };

  const openCreateGroupDialog = () => {
    setEditingGroupName(null);
    setGroupDialogMode("create");
    setGroupForm({
      name: "",
      usernames: new Set(selectedAccountUsernames()),
    });
    setGroupSearchQuery("");
    setGroupDialogError("");
    setGroupDialogOpen(true);
  };

  const openEditGroupDialog = () => {
    const groupName = selectedGroupName();
    const usernames = groupName === "" ? undefined : groups()[groupName];
    if (groupName === "" || usernames === undefined) {
      return;
    }

    setEditingGroupName(groupName);
    setGroupDialogMode("edit");
    setGroupForm({
      name: groupName,
      usernames: new Set(usernames),
    });
    setGroupSearchQuery("");
    setGroupDialogError("");
    setGroupDialogOpen(true);
  };

  const setGroupFormName = (name: string) => {
    setGroupForm((previous) => ({
      ...previous,
      name,
    }));
    setGroupDialogError("");
  };

  const toggleGroupMember = (username: string, checked: boolean) => {
    setGroupForm((previous) => {
      const usernames = new Set(previous.usernames);
      if (checked) {
        usernames.add(username);
      } else {
        usernames.delete(username);
      }

      return {
        ...previous,
        usernames,
      };
    });
  };

  const handleSaveGroup = async () => {
    if (busy() || !groupFormSubmittable()) {
      return;
    }

    const payload = {
      name: groupForm().name.trim(),
      usernames: [...groupForm().usernames],
    };
    const currentGroupName = editingGroupName();
    setBusy(true);
    setGroupDialogError("");
    try {
      const nextState =
        currentGroupName === null
          ? await window.ipc.accounts.createGroup(payload)
          : await window.ipc.accounts.updateGroup(currentGroupName, payload);

      applyState(nextState);
      setGroupDialogOpen(false);
      selectGroup(payload.name, nextState.groups);
    } catch (error) {
      console.error("Failed to save group:", error);
      setGroupDialogError(
        error instanceof Error ? error.message : "Save failed",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteGroup = async () => {
    const groupName = editingGroupName() ?? selectedGroupName();
    if (busy() || groupName === "") {
      return;
    }

    setBusy(true);
    setGroupDialogError("");
    try {
      const nextState = await window.ipc.accounts.deleteGroup(groupName);
      applyState(nextState);
      setSelectedGroupName("");
      setGroupDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete group:", error);
      setGroupDialogError(
        error instanceof Error ? error.message : "Delete failed",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async (options: SaveOptions) => {
    if (busy() || !formSubmittable()) {
      return;
    }

    const payload = toDraft(form());
    const currentEditingUsername = editingUsername();
    setBusy(true);
    setDialogError("");
    try {
      const nextState = currentEditingUsername
        ? await window.ipc.accounts.updateAccount(
            currentEditingUsername,
            payload,
          )
        : await window.ipc.accounts.createAccount(payload);

      applyState(nextState);
      if (options.closeAfterSave || currentEditingUsername) {
        setDialogOpen(false);
      } else {
        setForm(emptyForm());
        setPasswordVisible(false);
        window.requestAnimationFrame(() => usernameInput?.focus());
      }
    } catch (error) {
      console.error("Failed to save account:", error);
      setDialogError(error instanceof Error ? error.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const deleteAccountUsernames = async (usernames: readonly string[]) => {
    setBusy(true);
    try {
      let nextState = state();
      for (const username of usernames) {
        nextState = await window.ipc.accounts.deleteAccount(username);
      }
      applyState(nextState);
      setSelectedAccountUsernames((previous) => {
        const next = new Set(previous);
        for (const username of usernames) {
          next.delete(username);
        }
        return next;
      });
    } catch (error) {
      console.error("Failed to delete accounts:", error);
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveSelected = async () => {
    const usernames = [...selectedAccountUsernames()];
    if (usernames.length === 0) {
      return;
    }

    await deleteAccountUsernames(usernames);
  };

  const handleDeleteCurrentAccount = async () => {
    const username = editingUsername();
    if (!username) {
      return;
    }

    await deleteAccountUsernames([username]);
    setDialogOpen(false);
  };

  const launchAccountUsernames = async (usernames: readonly string[]) => {
    if (usernames.length === 0) {
      return;
    }

    setBusy(true);
    const script = launchScriptPayload();
    const server = launchServer();
    try {
      for (const username of usernames) {
        await window.ipc.accounts.launch({
          username,
          script,
          ...(server === "" ? {} : { server }),
        });
      }
    } catch (error) {
      console.error("Failed to launch accounts:", error);
    } finally {
      setBusy(false);
    }
  };

  const handleLaunchAccountUsername = async (username: string) => {
    await launchAccountUsernames([username]);
  };

  const handleLaunch = async () => {
    await launchAccountUsernames(selectedLaunchUsernames());
  };

  const handleLoadScript = async () => {
    setBusy(true);
    setScriptError("");
    try {
      const payload = await window.ipc.scripting.openFile();
      if (!payload) {
        return;
      }

      setLaunchScriptPayload(payload);
    } catch (error) {
      console.error("Failed to load script:", error);
    } finally {
      setBusy(false);
    }
  };

  const handleScriptPathInput = (value: string) => {
    setScriptPathDraft(value);
    setScriptError("");
  };

  const handleScriptPathPaste = (event: ClipboardEvent) => {
    const text = event.clipboardData?.getData("text/plain")?.trim();
    if (!text) {
      return;
    }

    event.preventDefault();
    setScriptPathDraft(text);
    void loadScriptPath(text);
  };

  const editScriptPath = () => {
    setScriptPathDraft(scriptPathInput());
    setScriptError("");
    setScriptPathEditing(true);
    window.requestAnimationFrame(() => {
      scriptPathInputElement?.focus();
    });
  };

  const cancelScriptPathEdit = () => {
    skipNextScriptPathBlur = true;
    setScriptPathDraft(scriptPathInput());
    setScriptPathEditing(false);
    setScriptError("");
  };

  const confirmDeleteDescription = (label: string): string =>
    `Delete ${label}? The saved username and password will be removed.`;

  const confirmDeleteSelectedDescription = (): string => {
    const count = selectedAccountUsernames().size;

    return count === 1
      ? "Delete the selected account? The saved username and password will be removed."
      : `Delete ${count} selected accounts? Their saved usernames and passwords will be removed.`;
  };

  const selectedDeleteLabel = (): string =>
    selectedAccountUsernames().size === 1
      ? "Delete Account"
      : "Delete Accounts";

  const selectedDeleteConfirmLabel = (): string =>
    selectedAccountUsernames().size === 1
      ? "Delete account"
      : "Delete accounts";

  const handleDeleteAccountUsername = async (username: string) => {
    await deleteAccountUsernames([username]);
  };

  const toggleSelected = (username: string, checked: boolean) => {
    setSelectedGroupName("");
    setSelectedAccountUsernames((previous) => {
      const next = new Set(previous);
      if (checked) {
        next.add(username);
      } else {
        next.delete(username);
      }
      return next;
    });
  };

  const selectVisibleAccounts = () => {
    setSelectedGroupName("");
    setSelectedAccountUsernames((previous) => {
      const next = new Set(previous);
      for (const account of filteredAccounts()) {
        next.add(account.username);
      }
      return next;
    });
  };

  const invertVisibleSelection = () => {
    setSelectedGroupName("");
    setSelectedAccountUsernames((previous) => {
      const next = new Set(previous);
      for (const account of filteredAccounts()) {
        if (next.has(account.username)) {
          next.delete(account.username);
        } else {
          next.add(account.username);
        }
      }
      return next;
    });
  };

  onMount(() => {
    const unsubscribe = window.ipc.accounts.onChanged(applyState);
    const refreshCooldownTimer = window.setInterval(() => {
      setServerRefreshNow(Date.now());
    }, 1_000);

    void window.ipc.accounts
      .getState()
      .then(async (nextState) => {
        applyState(nextState);
      })
      .catch((error) => {
        console.error("Failed to load accounts:", error);
        setStateLoaded(true);
      });

    void loadServers();

    onCleanup(() => {
      unsubscribe();
      window.clearInterval(refreshCooldownTimer);
      if (serverSelectionSettlingTimeout !== undefined) {
        window.clearTimeout(serverSelectionSettlingTimeout);
      }
    });
  });

  return (
    <AppShell>
      <AppShell.Header>
        <AppShell.HeaderLeft>
          <AppShell.Title>Account Manager</AppShell.Title>
        </AppShell.HeaderLeft>
        <AppShell.HeaderRight>
          <Button onClick={openCreateDialog}>
            <Icon icon="plus" class="button__icon" />
            Add Account
          </Button>
        </AppShell.HeaderRight>
      </AppShell.Header>
      <AppShell.Body class="account-manager" scroll={false}>
        <section class="account-manager__surface" aria-label="Accounts">
          <div class="account-manager__controls">
            <InputGroup class="account-search">
              <InputGroupAddon>
                <Icon icon="search" aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                ref={(element) => {
                  accountSearchInput = element;
                }}
                value={searchQuery()}
                placeholder="Search accounts..."
                onInput={(event) => setSearchQuery(event.currentTarget.value)}
              />
              <InputGroupAddon
                align="inline-end"
                class="account-search__shortcut"
              >
                <Kbd>/</Kbd>
              </InputGroupAddon>
            </InputGroup>
            <div class="account-manager__launch-row">
              <div class="account-manager__field-container">
                <div class="account-manager__label">
                  <span>Login Server</span>
                  <Tooltip closeDelay={0} openDelay={200}>
                    <TooltipTrigger
                      asChild={(triggerProps) => (
                        <Button
                          {...(triggerProps({
                            size: "icon-sm",
                            variant: "ghost",
                            "aria-label": "Refresh servers",
                            onClick: () => void handleRefreshServers(),
                            disabled:
                              serversLoading() || serverRefreshCoolingDown(),
                          } as ButtonProps) as ButtonProps)}
                        >
                          <Icon icon="refresh_cw" class="button__icon" />
                        </Button>
                      )}
                    />
                    <TooltipContent>Refresh servers</TooltipContent>
                  </Tooltip>
                </div>
                <Combobox
                  class="account-manager__server-field account-manager__field account-manager__server-combobox"
                  value={[launchServer() || NO_SERVER_VALUE]}
                  disabled={serversLoading() || serverError() !== ""}
                  inputBehavior="autohighlight"
                  openOnClick
                  positioning={{ fitViewport: true, sameWidth: false }}
                  onOpenChange={(details) => {
                    if (!details.open) {
                      setServerInputValue(launchServer());
                      setServerSearchQuery("");
                    }
                  }}
                  onValueChange={(details) => {
                    const value = details.value[0] ?? NO_SERVER_VALUE;
                    const nextLaunchServer =
                      value === NO_SERVER_VALUE ? "" : value;
                    setServerInputValue(nextLaunchServer);
                    setServerSearchQuery("");
                    setLaunchServer(nextLaunchServer);
                    setServerSelectionInitialized(true);
                  }}
                >
                  <ComboboxInput
                    classList={{
                      "account-manager__server-input--settling":
                        serversLoading() || serverSelectionSettling(),
                    }}
                    placeholder="Choose server..."
                    showClear={false}
                    size="lg"
                    value={serverInputValue()}
                    onInput={(event) => {
                      const value = event.currentTarget.value;
                      setServerInputValue(value);
                      setServerSearchQuery(value);
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== "Escape") {
                        return;
                      }

                      setServerInputValue(launchServer());
                      setServerSearchQuery("");
                    }}
                  />
                  <ComboboxContent class="account-manager__server-content">
                    <Show
                      when={
                        !showNoServerOption() &&
                        filteredServerOptions().length === 0
                      }
                    >
                      <ComboboxEmpty>No matching servers</ComboboxEmpty>
                    </Show>
                    <ComboboxList>
                      <Show when={showNoServerOption()}>
                        <ComboboxItem value={NO_SERVER_VALUE} label="None">
                          None
                        </ComboboxItem>
                      </Show>
                      <For each={filteredServerOptions()}>
                        {(server) => (
                          <ComboboxItem
                            value={server.name}
                            label={server.name}
                            disabled={!server.online}
                          >
                            <span
                              class={`account-server-option account-server-option--${serverAvailability(
                                server,
                              )}`}
                            >
                              <span class="account-server-option__name">
                                {server.name}
                              </span>
                              <span class="account-server-option__meta">
                                {serverMeta(server)}
                              </span>
                            </span>
                          </ComboboxItem>
                        )}
                      </For>
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>

              <div class="account-manager__field-container">
                <div class="account-manager__label account-manager__script-label">
                  <label for={LAUNCH_WITH_SCRIPT_CHECKBOX_ID}>
                    Launch with script
                  </label>
                  <Show when={selectedScript() !== null}>
                    <Checkbox
                      aria-label="Launch with script"
                      class="account-manager__script-toggle"
                      checked={launchScript().enabled}
                      disabled={busy()}
                      id={LAUNCH_WITH_SCRIPT_CHECKBOX_ID}
                      size="lg"
                      onChange={(event) =>
                        setLaunchScriptEnabled(event.currentTarget.checked)
                      }
                    />
                  </Show>
                </div>
                <InputGroup class="account-manager__script-field account-manager__field">
                  <Show
                    when={scriptPathEditing()}
                    fallback={
                      <Tooltip closeDelay={0} openDelay={400}>
                        <TooltipTrigger
                          asChild={(triggerProps) => (
                            <Button
                              {...(triggerProps({
                                class: "account-manager__script-display",
                                classList: {
                                  "account-manager__script-display--disabled":
                                    selectedScript() !== null &&
                                    !launchScript().enabled,
                                },
                                disabled: busy(),
                                onClick: handleLoadScript,
                                variant: "ghost",
                              } as ButtonProps) as ButtonProps)}
                            >
                              {selectedScriptLabel() || "Choose script..."}
                            </Button>
                          )}
                        />
                        <Show when={scriptPathInput() !== ""}>
                          <TooltipContent>{scriptPathInput()}</TooltipContent>
                        </Show>
                      </Tooltip>
                    }
                  >
                    <InputGroupInput
                      ref={(element) => {
                        scriptPathInputElement = element;
                      }}
                      value={scriptPathDraft()}
                      placeholder="Script path"
                      disabled={busy()}
                      onInput={(event) =>
                        handleScriptPathInput(event.currentTarget.value)
                      }
                      onBlur={(event) =>
                        skipNextScriptPathBlur
                          ? (skipNextScriptPathBlur = false)
                          : void loadScriptPath(event.currentTarget.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          event.currentTarget.blur();
                        } else if (event.key === "Escape") {
                          event.preventDefault();
                          cancelScriptPathEdit();
                        }
                      }}
                      onPaste={handleScriptPathPaste}
                    />
                  </Show>
                  <InputGroupAddon
                    align="inline-end"
                    class="account-manager__script-actions"
                  >
                    <Show
                      when={!scriptPathEditing() && selectedScript() !== null}
                    >
                      <Tooltip closeDelay={0} openDelay={200}>
                        <TooltipTrigger
                          asChild={(triggerProps) => (
                            <Button
                              {...(triggerProps({
                                "aria-label": "Edit script path",
                                disabled: busy(),
                                onClick: editScriptPath,
                                size: "icon-sm",
                                type: "button",
                                variant: "ghost",
                              } as ButtonProps) as ButtonProps)}
                            >
                              <Icon icon="pencil" class="button__icon" />
                            </Button>
                          )}
                        />
                        <TooltipContent>Edit script path</TooltipContent>
                      </Tooltip>
                    </Show>
                    <Tooltip closeDelay={0} openDelay={200}>
                      <TooltipTrigger
                        asChild={(triggerProps) => (
                          <Button
                            {...(triggerProps({
                              "aria-label": "Choose script file",
                              disabled: busy(),
                              onClick: handleLoadScript,
                              size: "icon-sm",
                              type: "button",
                              variant: "ghost",
                            } as ButtonProps) as ButtonProps)}
                          >
                            <Icon icon="folder_open" class="button__icon" />
                          </Button>
                        )}
                      />
                      <TooltipContent>Choose script file</TooltipContent>
                    </Tooltip>
                    <Show when={scriptPathInput() !== ""}>
                      <Tooltip closeDelay={0} openDelay={200}>
                        <TooltipTrigger
                          asChild={(triggerProps) => (
                            <Button
                              {...(triggerProps({
                                "aria-label": "Clear selected script",
                                disabled: busy(),
                                onClick: clearLaunchScript,
                                size: "icon-sm",
                                type: "button",
                                variant: "ghost",
                              } as ButtonProps) as ButtonProps)}
                            >
                              <Icon icon="x" class="button__icon" />
                            </Button>
                          )}
                        />
                        <TooltipContent>Clear script</TooltipContent>
                      </Tooltip>
                    </Show>
                  </InputGroupAddon>
                </InputGroup>
              </div>
            </div>
            <Show when={serverError()}>
              <small class="account-manager__server-error">
                {serverError()}
              </small>
            </Show>
            <Show when={scriptError()}>
              <small class="account-manager__script-error">
                {scriptError()}
              </small>
            </Show>
          </div>

          <div class="account-manager__selection-bar">
            <div class="account-manager__selection-context">
              <div class="account-manager__group-row">
                <div class="account-manager__group-label">
                  <span>Groups</span>
                  <Tooltip closeDelay={0} openDelay={250}>
                    <TooltipTrigger
                      asChild={(triggerProps) => (
                        <Button
                          {...(triggerProps({
                            "aria-label": "What are groups?",
                            size: "icon-sm",
                            type: "button",
                            variant: "ghost",
                          } as ButtonProps) as ButtonProps)}
                        >
                          <Icon
                            icon="circle_question_mark"
                            class="button__icon"
                          />
                        </Button>
                      )}
                    />
                    <TooltipContent>
                      Groups are saved account selections.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div
                  ref={(element) => {
                    groupFieldElement = element;
                  }}
                  class="account-manager__group-field"
                >
                  <Combobox
                    class="account-manager__group-combobox"
                    value={[selectedGroupName() || MANUAL_GROUP_VALUE]}
                    inputBehavior="autohighlight"
                    openOnClick
                    positioning={{ fitViewport: true, sameWidth: false }}
                    onValueChange={(details) => {
                      const value = details.value[0] ?? MANUAL_GROUP_VALUE;
                      selectGroup(
                        value === MANUAL_GROUP_VALUE ? "" : value,
                        groups(),
                      );
                    }}
                  >
                    <ComboboxInput
                      ref={(element) => {
                        groupComboboxInput = element;
                      }}
                      value={selectedGroupLabel()}
                      readOnly
                      showClear={false}
                      size="lg"
                      placeholder="Choose group..."
                    />
                    <ComboboxContent class="account-manager__group-content">
                      <ComboboxList>
                        <ComboboxItem
                          value={MANUAL_GROUP_VALUE}
                          label="Manual selection"
                        >
                          Manual selection
                        </ComboboxItem>
                        <For each={groupEntries()}>
                          {([name, usernames]) => (
                            <ComboboxItem value={name} label={name}>
                              <span class="account-group-option">
                                <span class="account-group-option__name">
                                  {name}
                                </span>
                                <span class="account-group-option__meta">
                                  {usernames.length}
                                </span>
                              </span>
                            </ComboboxItem>
                          )}
                        </For>
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  <Kbd class="account-manager__group-shortcut">G</Kbd>
                </div>
                <div class="account-manager__group-actions">
                  <Button
                    variant="secondary"
                    onClick={openCreateGroupDialog}
                    disabled={busy()}
                  >
                    <Icon icon="plus" class="button__icon" />
                    New Group
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={openEditGroupDialog}
                    disabled={busy() || selectedGroupName() === ""}
                  >
                    <Icon icon="pencil" class="button__icon" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger
                      asChild={(triggerProps) => (
                        <Button
                          {...(triggerProps({
                            variant: "destructive-outline",
                            disabled: busy() || selectedGroupName() === "",
                          } as ButtonProps) as ButtonProps)}
                        >
                          <Icon icon="trash_2" class="button__icon" />
                          Delete
                        </Button>
                      )}
                    />
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Group</AlertDialogTitle>
                        <AlertDialogDescription>
                          Delete {selectedGroupName()}? Accounts in this group
                          will stay saved.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => void handleDeleteGroup()}
                          variant="destructive"
                        >
                          Delete group
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <span class="account-manager__selection-count">
                {selectedAccountCount()} selected
                <Show when={filteredAccounts().length !== accounts().length}>
                  {" "}
                  ({filteredAccounts().length} visible)
                </Show>
              </span>
            </div>
            <div class="account-manager__selection-actions">
              <Button variant="secondary" onClick={selectVisibleAccounts}>
                All
              </Button>
              <Button variant="secondary" onClick={invertVisibleSelection}>
                Invert
              </Button>
              <AlertDialog>
                <AlertDialogTrigger
                  asChild={(triggerProps) => (
                    <Button
                      {...(triggerProps({
                        variant: "destructive-outline",
                        disabled:
                          busy() || selectedAccountUsernames().size === 0,
                      } as ButtonProps) as ButtonProps)}
                    >
                      <Icon icon="trash_2" class="button__icon" />
                      Remove
                    </Button>
                  )}
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{selectedDeleteLabel()}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {confirmDeleteSelectedDescription()}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => void handleRemoveSelected()}
                      variant="destructive"
                    >
                      {selectedDeleteConfirmLabel()}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                onClick={handleLaunch}
                disabled={busy() || selectedLaunchUsernames().length === 0}
              >
                <Icon icon="play" class="button__icon" />
                Start
              </Button>
            </div>
          </div>

          <div class="account-list" aria-live="polite">
            <Show
              when={filteredAccounts().length > 0}
              fallback={
                <Show
                  when={stateLoaded()}
                  fallback={
                    <div
                      class="account-list__loading"
                      aria-label="Loading accounts"
                      aria-busy="true"
                    >
                      <div class="account-list__loading-content">
                        <Spinner
                          class="account-list__loading-spinner"
                          size="xl"
                        />
                        <span>Loading...</span>
                      </div>
                    </div>
                  }
                >
                  <Empty class="account-list__empty">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Show
                          when={accounts().length === 0}
                          fallback={<Icon icon="users" aria-hidden="true" />}
                        >
                          <Icon icon="user_plus" aria-hidden="true" />
                        </Show>
                      </EmptyMedia>
                      <EmptyTitle>
                        {accounts().length === 0
                          ? "No accounts yet"
                          : "No matching accounts"}
                      </EmptyTitle>
                      <EmptyDescription>
                        {accounts().length === 0
                          ? "Add an account to get started."
                          : "Try adjusting your search."}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </Show>
              }
            >
              <For each={filteredAccounts()}>
                {(account, index) => {
                  const session = createMemo(() =>
                    sessionsByUsername().get(account.username),
                  );

                  return (
                    <Card
                      class="account-row"
                      style={{
                        "animation-delay": `${Math.min(index() * 12, 36)}ms`,
                      }}
                    >
                      <Checkbox
                        checked={selectedAccountUsernames().has(
                          account.username,
                        )}
                        onChange={(event) =>
                          toggleSelected(
                            account.username,
                            event.currentTarget.checked,
                          )
                        }
                        size="default"
                        aria-label={`Select ${account.label}`}
                      />
                      <div
                        class="account-row__identity"
                        onClick={() =>
                          toggleSelected(
                            account.username,
                            !selectedAccountUsernames().has(account.username),
                          )
                        }
                      >
                        <span class="account-row__title">{account.label}</span>
                        <span class="account-row__meta">
                          {account.username}
                        </span>
                      </div>
                      <Show when={session()}>
                        {(activeSession) => (
                          <Badge
                            variant={statusVariant(activeSession().status)}
                          >
                            {activeSession().status}
                          </Badge>
                        )}
                      </Show>
                      <div class="account-row__actions">
                        <AccountActionButton
                          aria-label={`Launch ${account.label}`}
                          tooltip="Launch account"
                          onClick={() =>
                            void handleLaunchAccountUsername(account.username)
                          }
                          disabled={busy()}
                        >
                          <Icon icon="play" class="button__icon" />
                        </AccountActionButton>
                        <AccountActionButton
                          aria-label={`Edit ${account.label}`}
                          tooltip="Edit account"
                          onClick={() => openEditDialog(account)}
                        >
                          <Icon icon="pencil" class="button__icon" />
                        </AccountActionButton>
                        <AlertDialog>
                          <AccountDeleteTrigger
                            disabled={busy()}
                            aria-label={`Delete ${account.label}`}
                            tooltip="Delete account"
                          />
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Account
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {confirmDeleteDescription(account.label)}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  void handleDeleteAccountUsername(
                                    account.username,
                                  )
                                }
                                variant="destructive"
                              >
                                Delete account
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </Card>
                  );
                }}
              </For>
            </Show>
          </div>
        </section>

        <Dialog
          open={groupDialogOpen()}
          onOpenChange={(details) => {
            setGroupDialogOpen(details.open);
            if (!details.open) {
              setEditingGroupName(null);
            }
          }}
        >
          <DialogContent class="account-dialog account-group-dialog">
            <DialogHeader>
              <DialogTitle>
                {groupDialogMode() === "edit" ? "Edit Group" : "New Group"}
              </DialogTitle>
            </DialogHeader>

            <form
              class="account-dialog__form"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSaveGroup();
              }}
            >
              <div class="account-dialog__fields">
                <Show when={groupDialogError()}>
                  <div class="account-dialog__error">{groupDialogError()}</div>
                </Show>
                <label class="account-dialog__field">
                  <span>Name</span>
                  <Input
                    fullWidth
                    size="lg"
                    value={groupForm().name}
                    placeholder="Group name"
                    onInput={(event) =>
                      setGroupFormName(event.currentTarget.value)
                    }
                  />
                </label>
                <div class="account-dialog__field">
                  <span>Accounts</span>
                  <InputGroup class="account-group-dialog__search">
                    <InputGroupAddon>
                      <Icon icon="search" aria-hidden="true" />
                    </InputGroupAddon>
                    <InputGroupInput
                      value={groupSearchQuery()}
                      placeholder="Search accounts..."
                      onInput={(event) =>
                        setGroupSearchQuery(event.currentTarget.value)
                      }
                    />
                  </InputGroup>
                  <div class="account-group-dialog__members">
                    <Show
                      when={filteredGroupAccounts().length > 0}
                      fallback={
                        <div class="account-group-dialog__empty">
                          No matching accounts
                        </div>
                      }
                    >
                      <For each={filteredGroupAccounts()}>
                        {(account) => (
                          <label class="account-group-dialog__member">
                            <Checkbox
                              checked={groupForm().usernames.has(
                                account.username,
                              )}
                              onChange={(event) =>
                                toggleGroupMember(
                                  account.username,
                                  event.currentTarget.checked,
                                )
                              }
                            />
                            <span class="account-group-dialog__member-text">
                              <span class="account-group-dialog__member-name">
                                {account.label}
                              </span>
                              <span class="account-group-dialog__member-meta">
                                {account.username}
                              </span>
                            </span>
                          </label>
                        )}
                      </For>
                    </Show>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Show when={groupDialogMode() === "edit"}>
                  <AlertDialog>
                    <AlertDialogTrigger
                      class="button button--destructive-outline button--size-default"
                      disabled={busy()}
                      type="button"
                    >
                      <Icon icon="trash_2" class="button__icon" />
                      Delete
                    </AlertDialogTrigger>
                    <AlertDialogContent class="account-dialog">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Group</AlertDialogTitle>
                        <AlertDialogDescription>
                          Delete {editingGroupName()}? Accounts in this group
                          will stay saved.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => void handleDeleteGroup()}
                          variant="destructive"
                        >
                          Delete group
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </Show>
                <DialogClose type="button">Cancel</DialogClose>
                <Button
                  size="lg"
                  type="submit"
                  loading={busy()}
                  disabled={!groupFormSubmittable()}
                >
                  {groupDialogMode() === "edit" ? "Update" : "Create Group"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog
          open={dialogOpen()}
          onOpenChange={(details) => setDialogOpen(details.open)}
        >
          <DialogContent class="account-dialog">
            <DialogHeader>
              <DialogTitle>
                {dialogMode() === "edit" ? "Edit Account" : "Add Account"}
              </DialogTitle>
            </DialogHeader>

            <form
              class="account-dialog__form"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSave({ closeAfterSave: true });
              }}
            >
              <div class="account-dialog__fields">
                <Show when={dialogError()}>
                  <div class="account-dialog__error">{dialogError()}</div>
                </Show>
                <label class="account-dialog__field">
                  <span>Username</span>
                  <Input
                    ref={(element) => {
                      usernameInput = element;
                    }}
                    fullWidth
                    size="lg"
                    value={form().username}
                    placeholder="Enter username"
                    onInput={(event) =>
                      setFormField("username", event.currentTarget.value)
                    }
                  />
                </label>
                <div class="account-dialog__field">
                  <label for={ACCOUNT_PASSWORD_INPUT_ID}>Password</label>
                  <InputGroup
                    class="account-dialog__password-control"
                    size="lg"
                  >
                    <InputGroupInput
                      id={ACCOUNT_PASSWORD_INPUT_ID}
                      class="account-dialog__password-input"
                      type={passwordVisible() ? "text" : "password"}
                      value={form().password}
                      placeholder="Enter password"
                      onInput={(event) =>
                        setFormField("password", event.currentTarget.value)
                      }
                    />
                    <InputGroupAddon
                      align="inline-end"
                      class="account-dialog__password-addon"
                    >
                      <Button
                        class="account-dialog__password-button"
                        size="icon-sm"
                        variant="ghost"
                        type="button"
                        aria-label={
                          passwordVisible() ? "Hide password" : "Show password"
                        }
                        aria-pressed={passwordVisible()}
                        onClick={() =>
                          setPasswordVisible((visible) => !visible)
                        }
                      >
                        <Show
                          when={passwordVisible()}
                          fallback={<Icon icon="eye" class="button__icon" />}
                        >
                          <Icon icon="eye_off" class="button__icon" />
                        </Show>
                      </Button>
                    </InputGroupAddon>
                  </InputGroup>
                </div>

                <div class="account-dialog__optional-field">
                  <label class="account-dialog__field">
                    <div class="account-dialog__field-header">
                      <span>Label</span>
                      <span class="account-dialog__field-optional">
                        (Optional)
                      </span>
                    </div>
                    <Input
                      fullWidth
                      size="lg"
                      placeholder={form().username || "Defaults to username"}
                      value={
                        form().label === form().username ? "" : form().label
                      }
                      onInput={(event) =>
                        setFormField("label", event.currentTarget.value)
                      }
                    />
                  </label>
                </div>
              </div>

              <DialogFooter>
                <Show when={dialogMode() === "edit"}>
                  <AlertDialog>
                    <AlertDialogTrigger
                      class="button button--destructive-outline button--size-default"
                      disabled={busy()}
                      type="button"
                    >
                      <Icon icon="trash_2" class="button__icon" />
                      Delete
                    </AlertDialogTrigger>
                    <AlertDialogContent class="account-dialog">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Account</AlertDialogTitle>
                        <AlertDialogDescription>
                          {confirmDeleteDescription(
                            form().label || form().username,
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => void handleDeleteCurrentAccount()}
                          variant="destructive"
                        >
                          Delete account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </Show>
                <DialogClose type="button">Cancel</DialogClose>
                <Show when={dialogMode() === "create"}>
                  <Button
                    size="lg"
                    variant="outline"
                    type="button"
                    loading={busy()}
                    disabled={!formSubmittable()}
                    onClick={() => void handleSave({ closeAfterSave: false })}
                  >
                    Add Another
                  </Button>
                </Show>
                <Button
                  size="lg"
                  type="submit"
                  loading={busy()}
                  disabled={!formSubmittable()}
                >
                  {dialogMode() === "edit" ? "Update" : "Add Account"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </AppShell.Body>
    </AppShell>
  );
}

mountWindow(() => <App />);
