/* @refresh reload */
import "../../polyfills";
import "./style.css";
import {
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
  AppShellBody,
  AppShellHeader,
  AppShellHeaderLeft,
  AppShellHeaderRight,
  AppShellTitle,
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
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
} from "@vexed/ui";
import {
  Eye,
  EyeOff,
  FileCode2,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-solid";
import {
  For,
  Show,
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

const NO_SERVER_VALUE = "__no_server__";
const emptyState: AccountManagerState = {
  accounts: [],
  sessions: [],
  storagePath: "",
};

const emptyForm = (): AccountFormState => ({
  label: "",
  username: "",
  password: "",
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
      <TooltipContent>
        {props.tooltip}
        <TooltipArrow />
      </TooltipContent>
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
                    children: <Trash2 class="button__icon" />,
                    class: "account-row__delete",
                    disabled: props.disabled,
                    size: "icon",
                    type: "button",
                    variant: "ghost",
                  } as ButtonProps),
                ) as ButtonProps)}
              />
            )}
          />
        )}
      />
      <TooltipContent>
        {props.tooltip}
        <TooltipArrow />
      </TooltipContent>
    </Tooltip>
  );
}

function App(): JSX.Element {
  let usernameInput: HTMLInputElement | undefined;
  const [state, setState] = createSignal<AccountManagerState>(emptyState);
  const [selectedAccountUsernames, setSelectedAccountUsernames] = createSignal<
    ReadonlySet<string>
  >(new Set());
  const [form, setForm] = createSignal<AccountFormState>(emptyForm());
  const [passwordVisible, setPasswordVisible] = createSignal(false);
  const [dialogOpen, setDialogOpen] = createSignal(false);
  const [dialogMode, setDialogMode] = createSignal<"create" | "edit">("create");
  const [editingUsername, setEditingUsername] = createSignal<string | null>(
    null,
  );
  const [dialogError, setDialogError] = createSignal("");
  const [searchQuery, setSearchQuery] = createSignal("");
  const [script, setScript] = createSignal<ScriptExecutePayload | null>(null);
  const [launchServer, setLaunchServer] = createSignal("");
  const [servers, setServers] = createSignal<readonly AccountGameServer[]>([]);
  const [serversLoading, setServersLoading] = createSignal(false);
  const [serverError, setServerError] = createSignal("");
  const [serverRefreshCooldownUntil, setServerRefreshCooldownUntil] =
    createSignal(0);
  const [serverRefreshNow, setServerRefreshNow] = createSignal(Date.now());
  const [busy, setBusy] = createSignal(false);

  const accounts = createMemo(() => state().accounts);
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
  const selectedVisibleCount = createMemo(() => {
    const selected = selectedAccountUsernames();
    return filteredAccounts().filter((account) =>
      selected.has(account.username),
    ).length;
  });
  const formSubmittable = createMemo(
    () => form().username.trim() !== "" && form().password.trim() !== "",
  );
  const serverOptions = createMemo(() => servers());
  const serverRefreshCoolingDown = createMemo(
    () => serverRefreshNow() < serverRefreshCooldownUntil(),
  );

  const applyState = (nextState: AccountManagerState) => {
    setState(nextState);
    const usernames = new Set(
      nextState.accounts.map((account) => account.username),
    );
    setSelectedAccountUsernames((previous) => {
      const next = new Set<string>();
      for (const username of previous) {
        if (usernames.has(username)) {
          next.add(username);
        }
      }
      return next;
    });

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
    setServersLoading(true);
    setServerError("");
    try {
      const nextServers = options?.refresh
        ? await window.ipc.accounts.refreshServers()
        : await window.ipc.accounts.getServers();
      setServerRefreshCooldownUntil(nextServers.refreshAvailableAt);
      setServers(nextServers.servers);
      if (launchServer() === "") {
        setLaunchServer(
          nextServers.servers.find(
            (server) => server.online && server.playerCount < server.maxPlayers,
          )?.name ?? "",
        );
      }
    } catch (error) {
      console.error("Failed to load servers:", error);
      const nextMessage =
        error instanceof Error ? error.message : "Server load failed";
      setServerError(nextMessage);
    } finally {
      setServersLoading(false);
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
    try {
      for (const username of usernames) {
        await window.ipc.accounts.launch({
          username,
          script: script(),
          ...(launchServer() === "" ? {} : { server: launchServer() }),
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
    try {
      const payload = await window.ipc.scripting.openFile();
      if (!payload) {
        return;
      }

      setScript(payload);
    } catch (error) {
      console.error("Failed to load script:", error);
    } finally {
      setBusy(false);
    }
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
    setSelectedAccountUsernames((previous) => {
      const next = new Set(previous);
      for (const account of filteredAccounts()) {
        next.add(account.username);
      }
      return next;
    });
  };

  const invertVisibleSelection = () => {
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
      .then((nextState) => {
        applyState(nextState);
      })
      .catch((error) => {
        console.error("Failed to load accounts:", error);
      });

    void loadServers();

    onCleanup(() => {
      unsubscribe();
      window.clearInterval(refreshCooldownTimer);
    });
  });

  return (
    <AppShell>
      <AppShellHeader>
        <AppShellHeaderLeft>
          <AppShellTitle>Account Manager</AppShellTitle>
        </AppShellHeaderLeft>
        <AppShellHeaderRight>
          <Button onClick={openCreateDialog}>
            <Plus class="button__icon" />
            Add Account
          </Button>
        </AppShellHeaderRight>
      </AppShellHeader>
      <AppShellBody class="account-manager" maxWidth={false} scroll={false}>
        <section class="account-manager__surface" aria-label="Accounts">
          <div class="account-manager__controls">
            <InputGroup class="account-search">
              <InputGroupAddon>
                <Search aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                value={searchQuery()}
                placeholder="Search accounts..."
                onInput={(event) => setSearchQuery(event.currentTarget.value)}
              />
            </InputGroup>
            <div class="account-manager__launch-row">
              <label class="account-manager__server-field">
                <span>Server</span>
                <div class="account-manager__server-control">
                  <Combobox
                    class="account-manager__server-combobox"
                    value={[launchServer() || NO_SERVER_VALUE]}
                    disabled={serversLoading()}
                    inputBehavior="autohighlight"
                    openOnClick
                    onValueChange={(details) => {
                      const value = details.value[0] ?? NO_SERVER_VALUE;
                      setLaunchServer(value === NO_SERVER_VALUE ? "" : value);
                    }}
                  >
                    <ComboboxInput
                      placeholder="Search servers..."
                      showClear={false}
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>No matching servers</ComboboxEmpty>
                      <ComboboxList>
                        <ComboboxItem value={NO_SERVER_VALUE} label="None">
                          None
                        </ComboboxItem>
                        <For each={serverOptions()}>
                          {(server) => (
                            <ComboboxItem
                              value={server.name}
                              label={server.name}
                              disabled={
                                !server.online ||
                                server.playerCount >= server.maxPlayers
                              }
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
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label="Refresh servers"
                    onClick={() => void handleRefreshServers()}
                    disabled={serversLoading() || serverRefreshCoolingDown()}
                  >
                    <RefreshCw class="button__icon" />
                  </Button>
                </div>
              </label>
              <Button
                class="account-manager__script-button"
                variant="outline"
                onClick={handleLoadScript}
                disabled={busy()}
              >
                <FileCode2 class="button__icon" />
                {script()?.name ?? "Choose script"}
              </Button>
              <Button
                onClick={handleLaunch}
                disabled={busy() || selectedLaunchUsernames().length === 0}
              >
                <Play class="button__icon" />
                Start
              </Button>
            </div>
            <Show when={serverError()}>
              <small class="account-manager__server-error">
                {serverError()}
              </small>
            </Show>
          </div>

          <div class="account-manager__selection-bar">
            <span>
              {selectedVisibleCount()} of {filteredAccounts().length} selected
            </span>
            <div class="account-manager__selection-actions">
              <Button variant="secondary" onClick={selectVisibleAccounts}>
                All
              </Button>
              <Button variant="secondary" onClick={invertVisibleSelection}>
                Invert
              </Button>
              <AlertDialog>
                <AlertDialogTrigger
                  class="button button--destructive-outline button--size-default"
                  disabled={busy() || selectedAccountUsernames().size === 0}
                >
                  <Trash2 class="button__icon" />
                  Remove
                </AlertDialogTrigger>
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
            </div>
          </div>

          <div class="account-list" aria-live="polite">
            <Show
              when={filteredAccounts().length > 0}
              fallback={
                <div class="account-list__empty">
                  {accounts().length === 0
                    ? "Add an account to queue game windows."
                    : "No accounts match your search."}
                </div>
              }
            >
              <For each={filteredAccounts()}>
                {(account) => {
                  const session = createMemo(() =>
                    sessionsByUsername().get(account.username),
                  );

                  return (
                    <Card class="account-row">
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
                          <Play class="button__icon" />
                        </AccountActionButton>
                        <AccountActionButton
                          aria-label={`Edit ${account.label}`}
                          tooltip="Edit account"
                          onClick={() => openEditDialog(account)}
                        >
                          <Pencil class="button__icon" />
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
                  <span>Label</span>
                  <Input
                    fullWidth
                    size="lg"
                    placeholder={form().username || "Defaults to username"}
                    value={form().label}
                    onInput={(event) =>
                      setFormField("label", event.currentTarget.value)
                    }
                  />
                </label>
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
                <label class="account-dialog__field">
                  <span>Password</span>
                  <InputGroup
                    class="account-dialog__password-control"
                    size="lg"
                  >
                    <InputGroupInput
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
                        onClick={() =>
                          setPasswordVisible((visible) => !visible)
                        }
                      >
                        <Show
                          when={passwordVisible()}
                          fallback={<Eye class="button__icon" />}
                        >
                          <EyeOff class="button__icon" />
                        </Show>
                      </Button>
                    </InputGroupAddon>
                  </InputGroup>
                </label>
              </div>

              <DialogFooter>
                <Show when={dialogMode() === "edit"}>
                  <AlertDialog>
                    <AlertDialogTrigger
                      class="button button--destructive-outline button--size-default"
                      disabled={busy()}
                      type="button"
                    >
                      <Trash2 class="button__icon" />
                      Delete
                    </AlertDialogTrigger>
                    <AlertDialogContent>
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
      </AppShellBody>
    </AppShell>
  );
}

mountWindow(() => <App />);
