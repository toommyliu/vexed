import { Show, type JSX } from "solid-js";
import {
  Badge,
  Card,
  CardContent,
  CardFrame,
  CardFrameHeader,
  CardFrameTitle,
  cn,
} from "@vexed/ui";

export interface SectionPanelProps {
  readonly action?: JSX.Element;
  readonly children: JSX.Element;
  readonly class?: string;
  readonly contentClass?: string;
  readonly count?: number;
  readonly countClass?: string;
  readonly title: JSX.Element;
  readonly titleAccessory?: JSX.Element;
  readonly tone?: string;
}

export function SectionPanel(props: SectionPanelProps): JSX.Element {
  return (
    <CardFrame
      class={cn(
        "section-panel",
        props.tone && `section-panel--${props.tone}`,
        props.class,
      )}
    >
      <CardFrameHeader class="section-panel__header">
        <div class="section-panel__heading">
          <CardFrameTitle class="section-panel__title">
            {props.title}
          </CardFrameTitle>
          <Show when={props.count !== undefined}>
            <Badge
              class={cn("section-panel__count", props.countClass)}
              variant="default"
            >
              {props.count}
            </Badge>
          </Show>
          <Show when={props.titleAccessory}>
            {(titleAccessory) => (
              <div class="section-panel__title-accessory">
                {titleAccessory()}
              </div>
            )}
          </Show>
        </div>
        <Show when={props.action}>
          {(action) => <div class="section-panel__actions">{action()}</div>}
        </Show>
      </CardFrameHeader>
      <Card class="section-panel__body">
        <CardContent class={cn("section-panel__content", props.contentClass)}>
          {props.children}
        </CardContent>
      </Card>
    </CardFrame>
  );
}
