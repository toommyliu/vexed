<script lang="ts">
  import type { Account } from "~/shared/types";
  import { Button, Input, Label } from "@vexed/ui";
  import * as InputGroup from "@vexed/ui/InputGroup";
  import * as Dialog from "@vexed/ui/Dialog";
  import { motionFade } from "@vexed/ui/motion";
  import Eye from "lucide-svelte/icons/eye";
  import EyeOff from "lucide-svelte/icons/eye-off";
  import LoaderCircle from "lucide-svelte/icons/loader-circle";
  import AlertCircle from "lucide-svelte/icons/alert-circle";
  import { client } from "~/shared/tipc";
  import { managerState } from "../state.svelte";

  type Props = {
    isOpen: boolean;
    onClose: () => void;
  };

  const { isOpen, onClose }: Props = $props();

  let username = $state("");
  let password = $state("");
  let showPassword = $state(false);
  let isSubmitting = $state(false);
  let error = $state("");
  let fieldError = $state<"username" | "password" | null>(null);

  $effect(() => {
    if (!isOpen) {
      username = "";
      password = "";
      showPassword = false;
      error = "";
      fieldError = null;
      isSubmitting = false;
    }
  });

  const handleSubmit = async (ev: SubmitEvent) => {
    ev.preventDefault();

    const cleanUsername = username?.trim()?.toLowerCase();
    const cleanPassword = password?.trim();

    if (!cleanUsername) {
      error = "Username is required";
      fieldError = "username";
      return;
    }

    if (!cleanPassword) {
      error = "Password is required";
      fieldError = "password";
      return;
    }

    if (managerState.accounts.has(cleanUsername)) {
      error = "An account with this username already exists";
      fieldError = "username";
      return;
    }

    isSubmitting = true;
    error = "";
    fieldError = null;

    try {
      const newAccount: Account = {
        username: cleanUsername,
        password: cleanPassword,
      };

      const res = await client.manager.addAccount(newAccount);

      switch (res?.msg) {
        case "SUCCESS":
          managerState.accounts.set(cleanUsername, newAccount);
          onClose();
          break;
        case "USERNAME_ALREADY_EXISTS":
          error = "An account with this username already exists";
          fieldError = "username";
          break;
        case "FAILED":
        default:
          error = "Failed to save account. Please try again.";
      }
    } catch (err) {
      error = "Failed to save account. Please try again.";
      console.error("Failed to add account:", err);
    } finally {
      isSubmitting = false;
    }
  };

  function clearError() {
    if (error) {
      error = "";
      fieldError = null;
    }
  }
</script>

<Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
  <Dialog.Content showCloseButton={true} class="sm:max-w-md">
    <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>

    <Dialog.Header class="pb-2">
      <Dialog.Title class="text-lg font-semibold tracking-tight">Add Account</Dialog.Title>
    </Dialog.Header>

    <form id="add-account-form" onsubmit={handleSubmit} class="grid gap-5 px-6">
      {#if error}
        {#key error}
          <div
            transition:motionFade={{ duration: 150 }}
            class="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5"
          >
            <AlertCircle class="size-4 text-destructive shrink-0 mt-0.5" />
            <span class="text-sm text-destructive">{error}</span>
          </div>
        {/key}
      {/if}

      <div class="grid gap-2">
        <Label for="add-username" class="text-sm font-medium">Username</Label>
        <Input
          id="add-username"
          bind:value={username}
          disabled={isSubmitting}
          placeholder="Enter username"
          autocomplete="username"
          aria-invalid={fieldError === "username" ? "true" : undefined}
          oninput={clearError}
          class={fieldError === "username" ? "border-destructive/50" : ""}
        />
      </div>

      <div class="grid gap-2">
        <Label for="add-password" class="text-sm font-medium">Password</Label>
        <InputGroup.Root>
          <Input
            id="add-password"
            type={showPassword ? "text" : "password"}
            bind:value={password}
            disabled={isSubmitting}
            placeholder="Enter password"
            autocomplete="current-password"
            aria-invalid={fieldError === "password" ? "true" : undefined}
            oninput={clearError}
            class={fieldError === "password" ? "border-destructive/50" : ""}
          />
          <div title={showPassword ? "Hide password" : "Show password"}>
            <Button
              variant="ghost"
              size="icon"
              class="text-muted-foreground hover:text-foreground transition-colors"
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
        form="add-account-form"
        disabled={isSubmitting || !username.trim() || !password.trim()}
      >
        {#if isSubmitting}
          <LoaderCircle class="size-4 animate-spin" />
          <span>Saving...</span>
        {:else}
          <span>Save Account</span>
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
