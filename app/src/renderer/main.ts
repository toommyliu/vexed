import { mount } from "svelte";
// @ts-expect-error - 'virtual:view' is aliased by esbuild per target
import View from "virtual:view";

mount(View, {
  target: document.body,
});
