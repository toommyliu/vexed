import type { JSX } from "solid-js";
import { Portal as SolidPortal } from "solid-js/web";

export type PortalProps = Parameters<typeof SolidPortal>[0];

export function Portal(props: PortalProps): JSX.Element {
  return <SolidPortal {...props} />;
}
