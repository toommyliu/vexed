import { clsx, type ClassValue } from "clsx";

export function cn(...values: ReadonlyArray<ClassValue>): string {
  return clsx(values);
}
