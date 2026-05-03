import { splitProps, type JSX } from "solid-js";
import { Button, type ButtonProps } from "./Button";

export type IconButtonSize =
  | "icon-xs"
  | "icon-sm"
  | "icon"
  | "icon-lg"
  | "icon-xl";

export interface IconButtonProps extends Omit<ButtonProps, "children" | "size"> {
  readonly "aria-label": string;
  readonly children: JSX.Element;
  readonly size?: IconButtonSize;
}

export function IconButton(props: IconButtonProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children", "size"]);

  return (
    <Button {...rest} size={local.size ?? "icon"}>
      {local.children}
    </Button>
  );
}
