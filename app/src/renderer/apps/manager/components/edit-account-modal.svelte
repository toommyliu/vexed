<script lang="ts">
  import type { Account } from "~/shared/types";
  import { editAccount } from "../util";
  import { Button, Input, Label } from "@vexed/ui";
  import * as InputGroup from "@vexed/ui/InputGroup";
  import * as Dialog from "@vexed/ui/Dialog";
  import { motionFade } from "@vexed/ui/motion";
  import Eye from "@vexed/ui/icons/Eye";
  import EyeOff from "@vexed/ui/icons/EyeOff";
  import AlertCircle from "@vexed/ui/icons/AlertCircle";
  import Loader from "@vexed/ui/icons/Loader";
  import { matchErrorPartial } from "better-result";

  type Props = {
    isOpen: boolean;
    onClose: () => void;
    account: Account | null;
  };

  const { isOpen, onClose, account }: Props = $props();

  let username = $state("");
  let password = $state("");
  let showPassword = $state(false);
  let isSubmitting = $state(false);
  let error = $state("");

  $effect(() => {
    if (isOpen && account) {
      username = account.username;
      password = account.password;
      error = "";
    } else if (!isOpen) {
      username = "";
      password = "";
      showPassword = false;
      error = "";
    }
  });

  const handleSubmit = async (ev: SubmitEvent) => {
    ev.preventDefault();

    if (!account) return;

    const cleanUsername = username?.trim()?.toLowerCase();
    const cleanPassword = password?.trim()?.toLowerCase();

    if (!cleanUsername || !cleanPassword) {
      error = "Please fill in all fields";
      return;
    }

    isSubmitting = true;
    error = "";

    try {
      const updatedAccount: Account = {
        username: cleanUsername,
        password: cleanPassword,
      };

      const res = await editAccount(account.username, updatedAccount);
      if (!res) {
        error = "Failed to update account. Please try again.";
        return;
      }
      if (res.isErr()) {
        matchErrorPartial(
          res.error,
          {
            ManagerDuplicateUsernameError: () => {
              error = "Failed to update account. Username might already exist.";
              return error;
            },
            ManagerAccountNotFoundError: () => {
              error = "Failed to update account. Original account not found.";
              return error;
            },
          },
          () => {
            error = "Failed to update account. Please try again.";
            return error;
          },
        );
        return;
      }

      onClose();
    } catch (err) {
      error = "Failed to update account. Please try again.";
      console.error("Failed to update account", err);
    } finally {
      isSubmitting = false;
    }
  };
</script>

<Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
  <Dialog.Content showCloseButton={true} class="sm:max-w-md">
    <div
      class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
    ></div>

    <Dialog.Header class="pb-2">
      <Dialog.Title class="text-lg font-semibold tracking-tight"
        >Edit Account</Dialog.Title
      >
    </Dialog.Header>

    <form
      id="edit-account-form"
      onsubmit={handleSubmit}
      class="grid gap-5 px-6"
    >
      {#if error}
        {#key error}
          <div
            transition:motionFade={{ duration: 150 }}
            class="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5"
          >
            <AlertCircle class="mt-0.5 size-4 shrink-0 text-destructive" />
            <span class="text-sm text-destructive">{error}</span>
          </div>
        {/key}
      {/if}

      <div class="grid gap-2">
        <Label for="edit-username" class="text-sm font-medium">Username</Label>
        <Input
          id="edit-username"
          bind:value={username}
          disabled={isSubmitting}
          placeholder="Enter username"
          autocomplete="username"
        />
      </div>

      <div class="grid gap-2">
        <Label for="edit-password" class="text-sm font-medium">Password</Label>
        <InputGroup.Root>
          <Input
            id="edit-password"
            type={showPassword ? "text" : "password"}
            bind:value={password}
            disabled={isSubmitting}
            placeholder="Enter password"
            autocomplete="current-password"
          />
          <div title={showPassword ? "Hide password" : "Show password"}>
            <Button
              variant="ghost"
              size="icon"
              class="text-muted-foreground transition-colors hover:text-foreground"
              onclick={() => (showPassword = !showPassword)}
              type="button"
              tabindex={-1}
            >
              {#if showPassword}
                <EyeOff class="size-4" />
              {:else}
                <Eye class="size-4" />
              {/if}
            </Button>
          </div>
        </InputGroup.Root>
      </div>
    </form>

    <Dialog.Footer>
      <Button variant="outline" onclick={onClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button
        type="submit"
        form="edit-account-form"
        disabled={isSubmitting || !username.trim() || !password.trim()}
      >
        {#if isSubmitting}
          <Loader class="size-4 animate-spin" />
          <span>Saving...</span>
        {:else}
          <span>Update</span>
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
