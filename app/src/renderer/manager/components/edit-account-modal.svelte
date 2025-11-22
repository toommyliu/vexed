<script lang="ts">
  import type { Account } from "@shared/types";
  import { editAccount } from "../util";
  import { Button, Input, Label } from "@vexed/ui";
  import * as InputGroup from "@vexed/ui/InputGroup";
  import * as Dialog from "@vexed/ui/Dialog";
  import * as Alert from "@vexed/ui/Alert";
  import { motionFade } from "@vexed/ui/motion";
  import { Eye, EyeOff } from "lucide-svelte";

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

      switch (res?.msg) {
        case "SUCCESS":
          onClose();
          break;
        case "USERNAME_ALREADY_EXISTS":
          error = "Failed to update account. Username might already exist.";
          break;
        case "ACCOUNT_NOT_FOUND":
          error = "Failed to update account. Original account not found.";
          break;
        case "FAILED":
        default:
          error = "Failed to update account. Please try again.";
      }
    } catch (err) {
      error = "Failed to update account. Please try again.";
      console.error("Failed to update account.", err);
    } finally {
      isSubmitting = false;
    }
  };
</script>

<Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
  <Dialog.Content showCloseButton={false}>
    <Dialog.Header>
      <Dialog.Title>Edit Account</Dialog.Title>
      <Dialog.Description>
        Update the credentials for this account.
      </Dialog.Description>
    </Dialog.Header>

    {#if error}
      {#key error}
        <div transition:motionFade class="px-6">
          <span class="text-destructive">{error}</span>
        </div>
      {/key}
    {/if}

    <form onsubmit={handleSubmit} class="grid gap-4 py-4">
      <div class="grid gap-2">
        <Label for="edit-username">Username</Label>
        <Input
          id="edit-username"
          bind:value={username}
          disabled={isSubmitting}
          placeholder="Enter username"
          required
        />
      </div>
      <div class="grid gap-2">
        <Label for="edit-password">Password</Label>
        <InputGroup.Root>
          <Input
            id="edit-password"
            type={showPassword ? "text" : "password"}
            bind:value={password}
            disabled={isSubmitting}
            placeholder="Enter password"
            required
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

      <Dialog.Footer>
        <Button variant="outline" onclick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="default"
          type="submit"
          disabled={isSubmitting || !username.trim() || !password.trim()}
        >
          {#if isSubmitting}
            Updating...
          {:else}
            Update
          {/if}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
