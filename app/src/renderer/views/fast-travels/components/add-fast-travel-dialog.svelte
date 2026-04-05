<script lang="ts">
  import { Result, matchErrorPartial } from "better-result";

  import type { FastTravelError } from "~/shared/fast-travels/errors";
  import type { FastTravel } from "~/shared/fast-travels/types";
  import { client } from "~/shared/tipc";

  import FastTravelDialog from "./fast-travel-dialog.svelte";
  import type { FastTravelSubmitResult } from "./fast-travel-form";

  type Props = {
    isOpen: boolean;
    onClose(this: void): void;
    onSuccess(this: void, fastTravel: FastTravel): void;
  };

  const { isOpen, onClose, onSuccess }: Props = $props();

  async function handleSubmit(
    fastTravel: FastTravel,
  ): Promise<FastTravelSubmitResult> {
    try {
      const serialized = await client.fastTravels.add(fastTravel);
      const result = Result.deserialize<undefined, FastTravelError>(serialized);

      if (result.isOk()) {
        return { ok: true };
      }

      console.error(result.error);
      return matchErrorPartial(
        result.error,
        {
          FastTravelDuplicateNameError: () => ({
            error: "A location with this name already exists",
            fieldError: "name",
            ok: false,
          }),
        },
        () => ({
          error: "Failed to save location. Please try again.",
          ok: false,
        }),
      );
    } catch (submitError) {
      console.error("Failed to save fast travel", submitError);
      return {
        error: "Failed to save location. Please try again.",
        ok: false,
      };
    }
  }
</script>

<FastTravelDialog
  initialFastTravel={null}
  isOpen={isOpen}
  onClose={onClose}
  onSubmit={handleSubmit}
  onSuccess={(_, fastTravel) => onSuccess(fastTravel)}
  submitLabel="Add Location"
  title="Add Location"
/>
