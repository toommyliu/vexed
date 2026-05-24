import "../polyfills";
import {
  AppShell,
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
      <AppShell.Header>
        <AppShell.HeaderLeft>
          <AppShell.Title>{title}</AppShell.Title>
        </AppShell.HeaderLeft>
        <AppShell.HeaderRight>
          <Badge variant="outline">{props.id}</Badge>
        </AppShell.HeaderRight>
      </AppShell.Header>
      <AppShell.Body>
        <p>{definition?.description ?? "Window unavailable."}</p>
      </AppShell.Body>
    </AppShell>
  );
}

export function mountWindowApp(id: WindowId): void {
  mountWindow(() => <WindowApp id={id} />);
}
