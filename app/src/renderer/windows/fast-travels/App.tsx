/* @refresh reload */
import "../../polyfills";
import "./style.css";
import { createHotkey } from "@tanstack/solid-hotkeys";
import {
  Icon,
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AppShell,
  AppShellBody,
  AppShellHeader,
  AppShellHeaderLeft,
  AppShellHeaderRight,
  AppShellTitle,
  Button,
  Card,
  CardContent,
  CardFrame,
  CardFrameHeader,
  CardFrameTitle,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  IconButton,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Kbd,
  Label,
  Spinner,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  type IconButtonProps,
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
  MAX_FAST_TRAVEL_ROOM_NUMBER,
  FastTravelDuplicateNameError,
  FastTravelNotFoundError,
  FastTravelValidationError,
  normalizeFastTravelDraft,
  normalizeFastTravelRoomNumber,
  sameFastTravelName,
  type FastTravel,
  type FastTravelDraft,
} from "../../../shared/fast-travels";
import { mountWindow } from "../mount";

interface FastTravelFormState {
  readonly name: string;
  readonly map: string;
  readonly cell: string;
  readonly pad: string;
}

interface SaveOptions {
  readonly closeAfterSave: boolean;
}

type FastTravelFieldError = "name" | "map";
type DialogMode = "create" | "edit";

const emptyForm = (): FastTravelFormState => ({
  name: "",
  map: "",
  cell: "",
  pad: "",
});

const toForm = (location: FastTravel): FastTravelFormState => ({
  name: location.name,
  map: location.map,
  cell: location.cell ?? "",
  pad: location.pad ?? "",
});

const operationErrorMessage = (cause: unknown, fallback: string): string => {
  if (cause instanceof FastTravelDuplicateNameError) {
    return "A location with this name already exists.";
  }
  if (cause instanceof FastTravelNotFoundError) {
    return "Location not found. It may have been deleted.";
  }
  if (cause instanceof FastTravelValidationError) {
    return cause.message;
  }
  if (cause instanceof Error && cause.message !== "") {
    return cause.message;
  }
  return fallback;
};

const locationSubtitle = (location: FastTravel): string => {
  const parts = [location.map];
  if (location.cell) {
    parts.push(location.cell);
  }
  if (location.pad) {
    parts.push(location.pad);
  }
  return parts.join(" / ");
};

function TooltipIconButton(props: {
  readonly "aria-label": string;
  readonly class?: string;
  readonly children: JSX.Element;
  readonly disabled?: boolean;
  readonly tooltip: string;
  readonly onClick: JSX.EventHandler<HTMLButtonElement, MouseEvent>;
}): JSX.Element {
  return (
    <Tooltip closeDelay={0} openDelay={200} positioning={{ placement: "top" }}>
      <TooltipTrigger
        asChild={(triggerProps) => (
          <IconButton
            {...(triggerProps({
              "aria-label": props["aria-label"],
              children: props.children,
              class: props.class,
              disabled: props.disabled,
              size: "icon",
              type: "button",
              variant: "ghost",
              onClick: props.onClick,
            } as IconButtonProps) as IconButtonProps)}
          />
        )}
      />
      <TooltipContent>{props.tooltip}</TooltipContent>
    </Tooltip>
  );
}

function FormField(props: {
  readonly children: JSX.Element;
  readonly error?: boolean;
  readonly for: string;
  readonly label: string;
  readonly optional?: boolean;
}): JSX.Element {
  return (
    <div class="fast-travels-form__field">
      <Label for={props.for}>
        {props.label}
        <Show when={props.optional}>
          <span class="fast-travels-form__optional">Optional</span>
        </Show>
      </Label>
      <div data-invalid={props.error ? "" : undefined}>{props.children}</div>
    </div>
  );
}

function App(): JSX.Element {
  const [locations, setLocations] = createSignal<readonly FastTravel[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal("");
  const [searchQuery, setSearchQuery] = createSignal("");
  const [useRoomNumber, setUseRoomNumber] = createSignal(false);
  const [roomNumber, setRoomNumber] = createSignal(
    String(MAX_FAST_TRAVEL_ROOM_NUMBER),
  );
  const [warpingName, setWarpingName] = createSignal<string | null>(null);
  const [dialogOpen, setDialogOpen] = createSignal(false);
  const [dialogMode, setDialogMode] = createSignal<DialogMode>("create");
  const [editingOriginalName, setEditingOriginalName] = createSignal("");
  const [form, setForm] = createSignal<FastTravelFormState>(emptyForm());
  const [fieldError, setFieldError] = createSignal<FastTravelFieldError | null>(
    null,
  );
  const [dialogError, setDialogError] = createSignal("");
  const [saving, setSaving] = createSignal(false);
  const [pendingDelete, setPendingDelete] = createSignal<FastTravel | null>(
    null,
  );
  const [deleting, setDeleting] = createSignal(false);
  let searchInput: HTMLInputElement | undefined;
  let nameInput: HTMLInputElement | undefined;

  const filteredLocations = createMemo(() => {
    const query = searchQuery().trim().toLowerCase();
    if (query === "") {
      return locations();
    }

    return locations().filter((location) => {
      const haystack = [
        location.name,
        location.map,
        location.cell ?? "",
        location.pad ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  });

  const normalizedRoomNumber = createMemo(
    () =>
      normalizeFastTravelRoomNumber(roomNumber()) ??
      MAX_FAST_TRAVEL_ROOM_NUMBER,
  );
  const formSubmittable = createMemo(
    () => form().name.trim() !== "" && form().map.trim() !== "",
  );

  createHotkey(
    "/",
    (event) => {
      if (event.repeat || dialogOpen() || pendingDelete() !== null) {
        return;
      }

      searchInput?.focus();
      searchInput?.select();
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
        nameInput?.focus();
      });
    }
  });

  const setFormField = (
    field: keyof FastTravelFormState,
    value: string,
  ): void => {
    setForm((current) => ({ ...current, [field]: value }));
    setDialogError("");
    if (fieldError() === field) {
      setFieldError(null);
    }
  };

  const openCreateDialog = (): void => {
    setDialogMode("create");
    setEditingOriginalName("");
    setForm(emptyForm());
    setFieldError(null);
    setDialogError("");
    setDialogOpen(true);
  };

  const openEditDialog = (location: FastTravel): void => {
    setDialogMode("edit");
    setEditingOriginalName(location.name);
    setForm(toForm(location));
    setFieldError(null);
    setDialogError("");
    setDialogOpen(true);
  };

  const closeDialog = (): void => {
    if (saving()) {
      return;
    }

    setDialogOpen(false);
    setFieldError(null);
    setDialogError("");
  };

  const normalizeForm = (): FastTravelDraft | null => {
    try {
      return normalizeFastTravelDraft(form());
    } catch (cause) {
      if (cause instanceof FastTravelValidationError) {
        setFieldError(cause.field);
        setDialogError(cause.message);
      } else {
        setDialogError("Location details are invalid.");
      }
      return null;
    }
  };

  const duplicateNameInCurrentList = (draft: FastTravelDraft): boolean => {
    const originalName = editingOriginalName();
    return locations().some(
      (location) =>
        sameFastTravelName(location.name, draft.name) &&
        (dialogMode() !== "edit" ||
          !sameFastTravelName(location.name, originalName)),
    );
  };

  const saveLocation = async (options: SaveOptions): Promise<void> => {
    if (saving() || !formSubmittable()) {
      return;
    }

    const draft = normalizeForm();
    if (!draft) {
      return;
    }

    if (duplicateNameInCurrentList(draft)) {
      setFieldError("name");
      setDialogError("A location with this name already exists.");
      return;
    }

    setSaving(true);
    setFieldError(null);
    setDialogError("");
    try {
      const nextLocations =
        dialogMode() === "edit"
          ? await window.ipc.fastTravels.update(editingOriginalName(), draft)
          : await window.ipc.fastTravels.create(draft);
      setLocations(nextLocations);
      if (options.closeAfterSave || dialogMode() === "edit") {
        setDialogOpen(false);
      } else {
        setForm(emptyForm());
        window.requestAnimationFrame(() => {
          nameInput?.focus();
        });
      }
    } catch (cause) {
      const message = operationErrorMessage(
        cause,
        dialogMode() === "edit"
          ? "Failed to update location."
          : "Failed to add location.",
      );
      setDialogError(message);
      if (cause instanceof FastTravelDuplicateNameError) {
        setFieldError("name");
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteLocation = async (): Promise<void> => {
    const location = pendingDelete();
    if (!location) {
      return;
    }

    setDeleting(true);
    setError("");
    try {
      const nextLocations = await window.ipc.fastTravels.delete(location.name);
      setLocations(nextLocations);
      setPendingDelete(null);
    } catch (cause) {
      setError(operationErrorMessage(cause, "Failed to delete location."));
    } finally {
      setDeleting(false);
    }
  };

  const warpToLocation = async (location: FastTravel): Promise<void> => {
    if (warpingName() !== null) {
      return;
    }

    setWarpingName(location.name);
    setError("");
    try {
      await window.ipc.fastTravels.warp({
        location,
        ...(useRoomNumber() ? { roomNumber: normalizedRoomNumber() } : {}),
      });
    } catch (cause) {
      setError(operationErrorMessage(cause, "Fast travel failed."));
    } finally {
      setWarpingName(null);
    }
  };

  onMount(() => {
    const unsubscribe = window.ipc.fastTravels.onChanged(setLocations);
    void window.ipc.fastTravels
      .getAll()
      .then(setLocations)
      .catch((cause) => {
        console.error("Failed to load fast travels:", cause);
        setError(operationErrorMessage(cause, "Failed to load locations."));
      })
      .finally(() => setLoading(false));

    onCleanup(unsubscribe);
  });

  return (
    <AppShell class="fast-travels-app">
      <AppShellHeader class="fast-travels-header" maxWidth={false}>
        <AppShellHeaderLeft>
          <AppShellTitle>Fast Travels</AppShellTitle>
        </AppShellHeaderLeft>
        <AppShellHeaderRight class="fast-travels-header__actions">
          <Button size="sm" type="button" onClick={openCreateDialog}>
            <Icon icon="plus" class="button__icon" />
            Add Location
          </Button>
        </AppShellHeaderRight>
      </AppShellHeader>

      <AppShellBody class="fast-travels-body">
        <div class="fast-travels-shell">
          <Show when={error()}>
            {(message) => (
              <Alert class="fast-travels-error" variant="error">
                <AlertDescription class="fast-travels-error__message">
                  <Icon icon="circle_alert" aria-hidden="true" />
                  {message()}
                </AlertDescription>
              </Alert>
            )}
          </Show>

          <div class="fast-travels-toolbar">
            <InputGroup class="fast-travels-search">
              <InputGroupAddon>
                <Icon icon="search" aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                ref={(element) => {
                  searchInput = element;
                }}
                type="text"
                value={searchQuery()}
                placeholder="Search locations..."
                spellcheck={false}
                onInput={(event) => setSearchQuery(event.currentTarget.value)}
              />
              <InputGroupAddon
                align="inline-end"
                class="fast-travels-search__shortcut"
              >
                <Kbd>/</Kbd>
              </InputGroupAddon>
            </InputGroup>

            <div
              class="fast-travels-room"
              data-enabled={useRoomNumber() ? "true" : "false"}
            >
              <Switch
                aria-label="Use room number"
                class="fast-travels-room__switch"
                size="sm"
                checked={useRoomNumber()}
                onChange={(event) =>
                  setUseRoomNumber(event.currentTarget.checked)
                }
              >
                Use room number
              </Switch>
              <Input
                class="fast-travels-room__input"
                type="number"
                min="1"
                max={String(MAX_FAST_TRAVEL_ROOM_NUMBER)}
                value={roomNumber()}
                disabled={!useRoomNumber()}
                aria-label="Room number"
                onInput={(event) => setRoomNumber(event.currentTarget.value)}
                onBlur={() => setRoomNumber(String(normalizedRoomNumber()))}
              />
            </div>
          </div>

          <CardFrame class="fast-travels-panel">
            <CardFrameHeader class="fast-travels-panel__header">
              <div class="fast-travels-panel__title-group">
                <CardFrameTitle class="fast-travels-panel__title">
                  Locations
                </CardFrameTitle>
              </div>
            </CardFrameHeader>
            <Card class="fast-travels-panel__body">
              <CardContent class="fast-travels-list">
                <Show
                  when={!loading()}
                  fallback={
                    <div class="fast-travels-empty">
                      <Spinner size="lg" />
                      <span>Loading locations...</span>
                    </div>
                  }
                >
                  <Show
                    when={filteredLocations().length > 0}
                    fallback={
                      <div class="fast-travels-empty">
                        {searchQuery().trim()
                          ? "No matching locations"
                          : "No saved locations"}
                      </div>
                    }
                  >
                    <div class="fast-travels-grid">
                      <For each={filteredLocations()}>
                        {(location) => {
                          const busy = () => warpingName() !== null;
                          const thisLocationBusy = () =>
                            warpingName() !== null &&
                            sameFastTravelName(
                              warpingName() ?? "",
                              location.name,
                            );

                          return (
                            <div
                              class="fast-travels-location"
                              aria-disabled={busy() ? "true" : undefined}
                            >
                              <button
                                class="fast-travels-location__warp"
                                type="button"
                                disabled={busy()}
                                aria-label={`Warp to ${location.name}`}
                                onClick={() => void warpToLocation(location)}
                              >
                                <div class="fast-travels-location__main">
                                  <div class="fast-travels-location__name">
                                    {location.name}
                                  </div>
                                  <div class="fast-travels-location__meta">
                                    {locationSubtitle(location)}
                                  </div>
                                </div>
                                <span
                                  class="fast-travels-location__warp-affordance"
                                  aria-hidden="true"
                                >
                                  <Show
                                    when={thisLocationBusy()}
                                    fallback={
                                      <>
                                        <Icon icon="play" />
                                        <span>Warp</span>
                                      </>
                                    }
                                  >
                                    <Spinner size="sm" />
                                  </Show>
                                </span>
                              </button>
                              <div class="fast-travels-location__actions">
                                <TooltipIconButton
                                  aria-label={`Edit ${location.name}`}
                                  tooltip="Edit"
                                  disabled={busy()}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openEditDialog(location);
                                  }}
                                >
                                  <Icon icon="pencil" class="button__icon" />
                                </TooltipIconButton>
                                <TooltipIconButton
                                  aria-label={`Delete ${location.name}`}
                                  class="fast-travels-location__delete"
                                  tooltip="Delete"
                                  disabled={busy()}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setPendingDelete(location);
                                  }}
                                >
                                  <Icon icon="trash_2" class="button__icon" />
                                </TooltipIconButton>
                              </div>
                            </div>
                          );
                        }}
                      </For>
                    </div>
                  </Show>
                </Show>
              </CardContent>
            </Card>
          </CardFrame>
        </div>
      </AppShellBody>

      <Dialog
        open={dialogOpen()}
        onOpenChange={(details) => {
          if (details.open) {
            setDialogOpen(true);
          } else {
            closeDialog();
          }
        }}
      >
        <DialogContent class="fast-travels-dialog">
          <DialogHeader>
            <DialogTitle>
              {dialogMode() === "edit" ? "Edit Location" : "Add Location"}
            </DialogTitle>
          </DialogHeader>
          <form
            class="fast-travels-form"
            onSubmit={(event) => {
              event.preventDefault();
              void saveLocation({ closeAfterSave: true });
            }}
          >
            <Show when={dialogError()}>
              {(message) => (
                <Alert class="fast-travels-dialog__error" variant="error">
                  <AlertDescription class="fast-travels-error__message">
                    <Icon icon="circle_alert" aria-hidden="true" />
                    {message()}
                  </AlertDescription>
                </Alert>
              )}
            </Show>

            <div class="fast-travels-form__grid">
              <FormField
                for="fast-travel-name"
                label="Name"
                error={fieldError() === "name"}
              >
                <Input
                  id="fast-travel-name"
                  ref={(element) => {
                    nameInput = element;
                  }}
                  fullWidth
                  value={form().name}
                  invalid={fieldError() === "name"}
                  disabled={saving()}
                  placeholder="Escherion"
                  onInput={(event) =>
                    setFormField("name", event.currentTarget.value)
                  }
                />
              </FormField>

              <FormField
                for="fast-travel-map"
                label="Map"
                error={fieldError() === "map"}
              >
                <Input
                  id="fast-travel-map"
                  fullWidth
                  value={form().map}
                  invalid={fieldError() === "map"}
                  disabled={saving()}
                  placeholder="escherion"
                  onInput={(event) =>
                    setFormField("map", event.currentTarget.value)
                  }
                />
              </FormField>

              <FormField for="fast-travel-cell" label="Cell" optional>
                <Input
                  id="fast-travel-cell"
                  fullWidth
                  value={form().cell}
                  disabled={saving()}
                  placeholder="Boss"
                  onInput={(event) =>
                    setFormField("cell", event.currentTarget.value)
                  }
                />
              </FormField>

              <FormField for="fast-travel-pad" label="Pad" optional>
                <Input
                  id="fast-travel-pad"
                  fullWidth
                  value={form().pad}
                  disabled={saving()}
                  placeholder="Left"
                  onInput={(event) =>
                    setFormField("pad", event.currentTarget.value)
                  }
                />
              </FormField>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={saving()}
                onClick={closeDialog}
              >
                Cancel
              </Button>
              <Show when={dialogMode() === "create"}>
                <Button
                  type="button"
                  variant="outline"
                  loading={saving()}
                  disabled={!formSubmittable()}
                  onClick={() => void saveLocation({ closeAfterSave: false })}
                >
                  Add Another
                </Button>
              </Show>
              <Button
                type="submit"
                loading={saving()}
                disabled={!formSubmittable()}
              >
                {dialogMode() === "edit" ? "Update" : "Add Location"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingDelete() !== null}
        onOpenChange={(details) => {
          if (!details.open && !deleting()) {
            setPendingDelete(null);
          }
        }}
      >
        <AlertDialogContent class="fast-travels-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              Delete {pendingDelete()?.name ?? "this location"} from Fast
              Travels?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting()}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting()}
              onClick={() => void deleteLocation()}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

mountWindow(() => <App />);
