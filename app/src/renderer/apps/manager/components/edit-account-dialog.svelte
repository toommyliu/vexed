<script lang="ts">
  import type { Account } from "~/shared/types";
  import { editAccount } from "../util";
  import AccountFormDialog from "./account-form-dialog.svelte";

  type Props = {
    account: Account | null;
    isOpen: boolean;
    onClose(): void;
  };

  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { isOpen, onClose, account }: Props = $props();

  const handleEditSubmit = async (
    updatedAccount: Account,
  ): Promise<boolean> => {
    if (!account) return false;

    const res = await editAccount(account.username, updatedAccount);
    return res?.isOk() ?? false;
  };
</script>

<AccountFormDialog
  mode="edit"
  {account}
  {isOpen}
  {onClose}
  onSubmit={handleEditSubmit}
/>
