<script lang="ts">
  import { Result, matchErrorPartial } from "better-result";

  import type { FastTravelError } from "~/shared/fast-travels/errors";
  import type { FastTravel } from "~/shared/fast-travels/types";
  import { client } from "~/shared/tipc";

  import FastTravelDialog from "./fast-travel-dialog.svelte";
  import type { FastTravelSubmitResult } from "./fast-travel-form";

  type Props = {
    fastTravel: FastTravel | null;
    isOpen: boolean;
    onClose(this: void): void;
    onSuccess(this: void, originalName: string, fastTravel: FastTravel): void;
  };

  const { fastTravel, isOpen, onClose, onSuccess }: Props = $props();

  async function handleSubmit(
    updatedFastTravel: FastTravel,
  ): Promise<FastTravelSubmitResult> {
    if (!fastTravel) {
      return {
        error: "Location not found. It may have been deleted.",
        ok: false,
      };
    }

    try {
      const serialized = await client.fastTravels.update({
        fastTravel: updatedFastTravel,
        originalName: fastTravel.name,
      });
      const result = Result.deserialize<undefined, FastTravelError>(serialized);

      if (result.isOk()) {
        return { ok: true };
      }

      console.error(result.error);
      return matchErrorPartial(
        result.error,
        {
          FastTravelDuplicateNameError: () => ({
            error: "A location with this name already exists.",
            fieldError: "name",
            ok: false,
          }),
          FastTravelNotFoundError: () => ({
            error: "Location not found. It may have been deleted.",
            ok: false,
          }),
        },
        () => ({
          error: "Failed to update location. Please try again.",
          ok: false,
        }),
      );
    } catch (submitError) {
      console.error("Failed to update fast travel", submitError);
      return {
        error: "Failed to update location. Please try again.",
        ok: false,
      };
    }
  }
</script>

<FastTravelDialog
  initialFastTravel={fastTravel}
  isOpen={isOpen}
  onClose={onClose}
  onSubmit={handleSubmit}
  onSuccess={onSuccess}
  submitLabel="Update"
  title="Edit Location"
/>
