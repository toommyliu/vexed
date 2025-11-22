<script lang="ts">
  import type { Account } from "../../../shared/types";
  import { client } from "../../../shared/tipc";
  import { managerState } from "../state.svelte";
  import { Button, Input, Label, InputGroup } from "@vexed/ui";
  import * as Dialog from "@vexed/ui/Dialog";
  import { Eye, EyeOff } from "lucide-svelte";

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

  const handleSubmit = async (ev: SubmitEvent) => {
    ev.preventDefault();

    const cleanUsername = username?.trim()?.toLowerCase();
    const cleanPassword = password?.trim()?.toLowerCase();

    if (!cleanUsername || !cleanPassword) {
      error = "Please fill in all fields";
      return;
    }

    if (managerState.accounts.has(cleanUsername)) {
      error = "An account with this username already exists.";
      return;
    }

    isSubmitting = true;
    error = "";

    try {
      const account: Account = {
        username: cleanUsername,
        password: cleanPassword,
      };

      const res = await client.manager.addAccount(account);
      if (res?.msg === "SUCCESS") {
        managerState.accounts.set(cleanUsername, account);
      } else if (res?.msg === "USERNAME_ALREADY_EXISTS") {
        error = "An account with this username already exists.";
      } else if (res?.msg === "FAILED") {
        error = "Failed to add account. Please try again.";
        return;
      }

      username = "";
      password = "";
      showPassword = false;
      onClose();
    } catch (err) {
      error = "Failed to add account. Please try again.";
      console.error("Failed to add account:", err);
    } finally {
      isSubmitting = false;
    }
  };
</script>

<Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>Add Account</Dialog.Title>
      <Dialog.Description>
        Enter the credentials for the new account here.
      </Dialog.Description>
    </Dialog.Header>

    {#if error}
      <div
        class="border-destructive/20 bg-destructive/10 text-destructive rounded-md border p-3 text-sm"
      >
        {error}
      </div>
    {/if}

    <form onsubmit={handleSubmit} class="grid gap-4 py-4">
      <div class="grid gap-2">
        <Label for="username">Username</Label>
        <Input
          id="username"
          bind:value={username}
          disabled={isSubmitting}
          placeholder="Enter username"
          required
        />
      </div>
      <div class="grid gap-2">
        <Label for="password">Password</Label>
        <InputGroup>
          <Input
            id="password"
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
        </InputGroup>
      </div>

      <Dialog.Footer>
        <Button
          type="button"
          variant="outline"
          onclick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !username.trim() || !password.trim()}
        >
          {#if isSubmitting}
            Adding...
          {:else}
            Add Account
          {/if}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
