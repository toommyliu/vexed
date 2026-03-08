<script lang="ts">
  import {
    Button,
    Input,
    Label,
    Icon,
    InputGroup,
    Dialog,
    TooltipButton,
    Alert,
  } from "@vexed/ui";
  import { sleep } from "@vexed/utils";

  import type { Account } from "~/shared/types";

  type Props = {
    account?: Account | null;
    isOpen: boolean;
    mode: "add" | "edit";
    onClose(): void;
    onSubmit(account: Account): Promise<boolean>;
  };

  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { isOpen, onClose, account, mode, onSubmit }: Props = $props();

  let username = $state("");
  let password = $state("");
  let showPassword = $state(false);
  let isSubmitting = $state(false);
  let error = $state("");
  let success = $state(false);

  $effect(() => {
    if (isOpen) {
      if (mode === "edit" && account) {
        username = account.username;
        password = account.password;
      } else {
        username = "";
        password = "";
      }
      showPassword = false;
      error = "";
      success = false;
    }
  });

  const handleSubmit = async (ev: SubmitEvent) => {
    ev.preventDefault();

    const cleanUsername = username?.trim()?.toLowerCase();
    const cleanPassword = password?.trim();

    if (!cleanUsername || !cleanPassword) {
      error = "Please fill in all fields";
      return;
    }

    isSubmitting = true;
    error = "";

    try {
      const submitAccount: Account = {
        username: cleanUsername,
        password: cleanPassword,
      };

      const successResult = await onSubmit(submitAccount);
      if (!successResult) {
        error = `Failed to ${mode} account. Please try again.`;
        return;
      }

      success = true;
      await sleep(300);
      if (isOpen) onClose();
    } catch (error_) {
      error = `Failed to ${mode} account. Please try again.`;
      console.error(`Failed to ${mode} account:`, error_);
    } finally {
      isSubmitting = false;
    }
  };
</script>

<Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
  <Dialog.Content showCloseButton={true} class="sm:max-w-md">
    <Dialog.Header class="pb-2">
      <Dialog.Title class="text-lg font-semibold tracking-tight"
        >{mode === "add" ? "Add Account" : "Edit Account"}</Dialog.Title
      >
    </Dialog.Header>

    <form
      id="account-form"
      onsubmit={handleSubmit}
      class="mb-1 grid gap-4 px-6"
    >
      {#if error}
        {#key error}
          <Alert.Root variant="error" class="mt-2">
            <Icon icon="triangle_alert" size="sm" />
            <Alert.Description>{error}</Alert.Description>
          </Alert.Root>
        {/key}
      {/if}

      <div class="grid gap-2">
        <Label for="account-username" class="text-sm font-medium"
          >Username</Label
        >
        <Input
          id="account-username"
          bind:value={username}
          disabled={isSubmitting}
          placeholder="Enter username"
          spellcheck={false}
        />
      </div>

      <div class="grid gap-2">
        <Label for="account-password" class="text-sm font-medium"
          >Password</Label
        >
        <InputGroup.Root>
          <InputGroup.GroupInput
            id="account-password"
            bind:value={password}
            type={showPassword ? "text" : "password"}
            disabled={isSubmitting}
            placeholder="Enter password"
            spellcheck={false}
          />
          <InputGroup.Addon align="inline-end">
            <TooltipButton
              tooltip={showPassword ? "Hide password" : "Show password"}
              contentClass="text-xs"
            >
              <Button
                variant="ghost"
                size="icon-xs"
                type="button"
                onclick={() => (showPassword = !showPassword)}
                tabindex={-1}
              >
                {#if showPassword}
                  <Icon icon="eye_off" size="xs" />
                {:else}
                  <Icon icon="eye" size="xs" />
                {/if}
              </Button>
            </TooltipButton>
          </InputGroup.Addon>
        </InputGroup.Root>
      </div>
    </form>

    <Dialog.Footer class="pt-4" variant="bare">
      <Button variant="outline" onclick={onClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button
        type="submit"
        variant={success ? "success" : "default"}
        form="account-form"
        disabled={isSubmitting ||
          success ||
          !username.trim() ||
          !password.trim()}
      >
        {#if success}
          <Icon icon="check" size="md" />
          <span>{mode === "add" ? "Added" : "Updated"}</span>
        {:else if isSubmitting}
          <Icon icon="loader" size="md" spin />
          <span>Saving...</span>
        {:else}
          <span>{mode === "add" ? "Add Account" : "Update"}</span>
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
