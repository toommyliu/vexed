<script lang="ts">
  import { matchErrorPartial, Result } from "better-result";

  import type { ManagerIpcError } from "~/shared/manager/errors";
  import { client } from "~/shared/tipc";
  import type { Account } from "~/shared/types";
  import { managerState } from "../state.svelte";
  import AccountFormDialog from "./account-form-dialog.svelte";

  type Props = {
    isOpen: boolean;
    onClose(): void;
  };

  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { isOpen, onClose }: Props = $props();

  const handleAddSubmit = async (account: Account): Promise<boolean> => {
    const cleanUsername = account.username.toLowerCase();

    if (managerState.accounts.has(cleanUsername)) {
      return false;
    }

    const serialized = await client.manager.addAccount(account);
    const result = Result.deserialize<unknown, ManagerIpcError>(serialized);
    if (result.isOk()) {
      managerState.accounts.set(cleanUsername, account);
      return true;
    }

    matchErrorPartial(
      result.error,
      {
        ManagerDuplicateUsernameError: () => {
          console.error("Duplicate username error");
        },
      },
      () => {
        console.error("Failed to add account");
      },
    );

    return false;
  };
</script>

<AccountFormDialog mode="add" {isOpen} {onClose} onSubmit={handleAddSubmit} />
