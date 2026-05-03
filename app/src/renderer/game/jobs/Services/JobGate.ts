import { ServiceMap } from "effect";
import type { Effect } from "effect";

export type JobRunWhen = "always" | "loggedIn" | "loggedOut";

export interface JobGateShape {
  readonly isOpen: (runWhen: JobRunWhen) => Effect.Effect<boolean>;
}

export class JobGate extends ServiceMap.Service<JobGate, JobGateShape>()(
  "jobs/Services/JobGate",
) {}
