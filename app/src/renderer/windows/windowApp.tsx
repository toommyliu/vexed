import {
  AppShell,
  AppShellBody,
  AppShellHeader,
  AppShellHeaderLeft,
  AppShellHeaderRight,
  AppShellTitle,
  Badge,
} from "@vexed/ui";
import type { JSX } from "solid-js";
import { getWindowDefinition, type WindowId } from "../../shared/windows";
import { mountWindow } from "./mount";

export function WindowApp(props: { readonly id: WindowId }): JSX.Element {
  const definition = getWindowDefinition(props.id);
  const title = definition?.label ?? props.id;

  return (
    <AppShell>
      <AppShellHeader>
        <AppShellHeaderLeft>
          <AppShellTitle>{title}</AppShellTitle>
        </AppShellHeaderLeft>
        <AppShellHeaderRight>
          <Badge variant="outline">{props.id}</Badge>
        </AppShellHeaderRight>
      </AppShellHeader>
      <AppShellBody>
        <p>{definition?.description ?? "Window unavailable."}</p>
      </AppShellBody>
    </AppShell>
  );
}

export function mountWindowApp(id: WindowId): void {
  mountWindow(() => <WindowApp id={id} />);
}
