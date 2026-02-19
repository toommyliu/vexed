import { TaggedError } from "better-result";

export class LoaderGrabberNoDataError extends TaggedError(
  "LoaderGrabberNoDataError",
)<{
  message: string;
}>() {}

export type LoaderGrabberError = LoaderGrabberNoDataError;
