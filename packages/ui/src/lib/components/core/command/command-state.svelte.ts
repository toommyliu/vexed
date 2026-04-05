import { getContext, setContext, tick } from "svelte";
import { computeCommandScore } from "./command-score.js";
import type { Snippet } from "svelte";

let _idCounter = 0;
export function generateId(prefix = "cmd"): string {
  return `${prefix}-${++_idCounter}`;
}

function boolToStr(v: boolean): "true" | "false" {
  return v ? "true" : "false";
}

function boolToEmptyStrOrUndef(v: boolean): "" | undefined {
  return v ? "" : undefined;
}

/** Find next sibling element matching `selector`. */
function findNextSibling(el: Element, selector: string): Element | null {
  let sib = el.nextElementSibling;
  while (sib) {
    if (sib.matches(selector)) return sib;
    sib = sib.nextElementSibling;
  }
  return null;
}

/** Find previous sibling element matching `selector`. */
function findPreviousSibling(el: Element, selector: string): Element | null {
  let sib = el.previousElementSibling;
  while (sib) {
    if (sib.matches(selector)) return sib;
    sib = sib.previousElementSibling;
  }
  return null;
}

/** Get first child that is not a comment node. */
function getFirstNonCommentChild(el: Element): Element | null {
  for (let i = 0; i < el.children.length; i++) {
    const child = el.children[i];
    if (child.nodeType !== 8) return child;
  }
  return null;
}

function itemIsDisabled(item: Element): boolean {
  return item.getAttribute("aria-disabled") === "true";
}

export const srOnlyStyles =
  "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0";

const ATTR_ROOT = "data-command-root";
const ATTR_INPUT = "data-command-input";
const ATTR_LIST = "data-command-list";
const ATTR_VIEWPORT = "data-command-viewport";
const ATTR_GROUP = "data-command-group";
const ATTR_GROUP_HEADING = "data-command-group-heading";
const ATTR_GROUP_ITEMS = "data-command-group-items";
const ATTR_ITEM = "data-command-item";
const ATTR_EMPTY = "data-command-empty";
const ATTR_LOADING = "data-command-loading";
const ATTR_SEPARATOR = "data-command-separator";
const ATTR_INPUT_LABEL = "data-command-input-label";

const COMMAND_VALUE_ATTR = "data-value";

const SEL_GROUP = `[${ATTR_GROUP}]`;
const SEL_GROUP_ITEMS = `[${ATTR_GROUP_ITEMS}]`;
const SEL_GROUP_HEADING = `[${ATTR_GROUP_HEADING}]`;
const SEL_ITEM = `[${ATTR_ITEM}]`;
const SEL_VALID_ITEM = `[${ATTR_ITEM}]:not([aria-disabled="true"])`;

const ROOT_CTX = Symbol("CommandRoot");
const LIST_CTX = Symbol("CommandList");
const GROUP_CTX = Symbol("CommandGroup");

export function setCommandRootCtx(state: CommandRootState) {
  setContext(ROOT_CTX, state);
}
export function getCommandRootCtx(): CommandRootState {
  return getContext<CommandRootState>(ROOT_CTX);
}
export function setCommandListCtx(state: CommandListState) {
  setContext(LIST_CTX, state);
}
export function getCommandListCtx(): CommandListState {
  return getContext<CommandListState>(LIST_CTX);
}
export function setCommandGroupCtx(state: CommandGroupState) {
  setContext(GROUP_CTX, state);
}
export function getCommandGroupCtx(): CommandGroupState | null {
  try {
    return getContext<CommandGroupState>(GROUP_CTX);
  } catch {
    return null;
  }
}

interface FilteredState {
  /** Number of visible items. */
  count: number;
  /** Map: item-value → score. */
  items: Map<string, number>;
  /** Set of group values that have ≥ 1 visible item. */
  groups: Set<string>;
}

interface CommandState {
  search: string;
  value: string;
  filtered: FilteredState;
}

export type CommandFilterFn = (
  value: string,
  search: string,
  keywords?: string[],
) => number;

export interface CommandRootProps {
  ref?: HTMLDivElement | null;
  value?: string;
  class?: string;
  label?: string;
  shouldFilter?: boolean;
  filter?: CommandFilterFn;
  loop?: boolean;
  vimBindings?: boolean;
  disablePointerSelection?: boolean;
  disableInitialScroll?: boolean;
  columns?: number | null;
  onValueChange?: (value: string) => void;
  onStateChange?: (state: CommandState) => void;
  children?: Snippet;
  [key: string]: unknown;
}

export interface CommandInputProps {
  ref?: HTMLInputElement | null;
  class?: string;
  placeholder?: string;
  value?: string;
  autofocus?: boolean;
  children?: Snippet;
  [key: string]: unknown;
}

export interface CommandListProps {
  ref?: HTMLDivElement | null;
  class?: string;
  ariaLabel?: string;
  children?: Snippet;
  [key: string]: unknown;
}

export interface CommandViewportProps {
  ref?: HTMLDivElement | null;
  class?: string;
  children?: Snippet;
  [key: string]: unknown;
}

export interface CommandGroupProps {
  ref?: HTMLDivElement | null;
  class?: string;
  value?: string;
  forceMount?: boolean;
  children?: Snippet;
  [key: string]: unknown;
}

export interface CommandGroupHeadingProps {
  ref?: HTMLDivElement | null;
  class?: string;
  children?: Snippet;
  [key: string]: unknown;
}

export interface CommandGroupItemsProps {
  ref?: HTMLDivElement | null;
  class?: string;
  children?: Snippet;
  [key: string]: unknown;
}

export interface CommandItemProps {
  ref?: HTMLDivElement | null;
  class?: string;
  value?: string;
  keywords?: string[];
  disabled?: boolean;
  forceMount?: boolean;
  onSelect?: () => void;
  children?: Snippet;
  [key: string]: unknown;
}

export interface CommandLinkItemProps {
  ref?: HTMLAnchorElement | null;
  class?: string;
  value?: string;
  keywords?: string[];
  disabled?: boolean;
  forceMount?: boolean;
  onSelect?: () => void;
  href?: string;
  children?: Snippet;
  [key: string]: unknown;
}

export interface CommandEmptyProps {
  ref?: HTMLDivElement | null;
  class?: string;
  forceMount?: boolean;
  children?: Snippet;
  [key: string]: unknown;
}

export interface CommandLoadingProps {
  ref?: HTMLDivElement | null;
  class?: string;
  progress?: number;
  children?: Snippet;
  [key: string]: unknown;
}

export interface CommandSeparatorProps {
  ref?: HTMLHRElement | null;
  class?: string;
  forceMount?: boolean;
  [key: string]: unknown;
}

export class CommandRootState {
  id = generateId("cmd-root");
  labelId = generateId("cmd-label");

  shouldFilter: boolean = $state(true);
  filterFn: CommandFilterFn = $state(computeCommandScore);
  loop: boolean = $state(false);
  vimBindings: boolean = $state(true);
  disablePointerSelection: boolean = $state(false);
  disableInitialScroll: boolean = $state(false);
  columns: number | null = $state(null);
  label: string = $state("Command menu");
  onValueChange?: (value: string) => void = $state(undefined);
  onStateChange?: (state: CommandState) => void = $state(undefined);

  rootNode: HTMLDivElement | null = $state(null);
  viewportNode: HTMLDivElement | null = $state(null);
  inputNode: HTMLInputElement | null = $state(null);
  labelNode: HTMLLabelElement | null = $state(null);

  allItems = new Set<string>();
  allGroups = new Map<string, Set<string>>();
  allIds = new Map<string, { value: string; keywords: string[] }>();

  _state: CommandState = $state({
    search: "",
    value: "",
    filtered: { count: 0, items: new Map(), groups: new Set() },
  });

  commandState: CommandState = $state.raw({
    search: "",
    value: "",
    filtered: { count: 0, items: new Map(), groups: new Set() },
  });

  #updateScheduled = false;
  #isInitialMount = true;
  #sortAfterTick = false;
  #sortAndFilterAfterTick = false;

  key = $state(0);

  constructor(opts: {
    value?: string;
    shouldFilter?: boolean;
    filter?: CommandFilterFn;
    loop?: boolean;
    vimBindings?: boolean;
    disablePointerSelection?: boolean;
    disableInitialScroll?: boolean;
    columns?: number | null;
    label?: string;
    onValueChange?: (value: string) => void;
    onStateChange?: (state: CommandState) => void;
  }) {
    this.shouldFilter = opts.shouldFilter ?? true;
    this.filterFn = opts.filter ?? computeCommandScore;
    this.loop = opts.loop ?? false;
    this.vimBindings = opts.vimBindings ?? true;
    this.disablePointerSelection = opts.disablePointerSelection ?? false;
    this.disableInitialScroll = opts.disableInitialScroll ?? false;
    this.columns = opts.columns ?? null;
    this.label = opts.label ?? "Command menu";
    this.onValueChange = opts.onValueChange;
    this.onStateChange = opts.onStateChange;

    const initial: CommandState = {
      search: "",
      value: opts.value ?? "",
      filtered: { count: 0, items: new Map(), groups: new Set() },
    };
    this._state = initial;
    this.commandState = { ...initial };

    this.onkeydown = this.onkeydown.bind(this);
  }

  #snapshot(): CommandState {
    return $state.snapshot(this._state) as CommandState;
  }

  #scheduleUpdate() {
    if (this.#updateScheduled) return;
    this.#updateScheduled = true;
    tick().then(() => {
      this.#updateScheduled = false;
      const snap = this.#snapshot();
      this.commandState = snap;
      this.onStateChange?.(snap);
    });
  }

  setState(key: "search" | "value", value: string, preventScroll?: boolean) {
    if (Object.is(this._state[key], value)) return;
    (this._state as unknown as Record<string, unknown>)[key] = value;

    if (key === "search") {
      this.#filterItems();
      this.#sort();
    } else if (key === "value" && !preventScroll) {
      this.#scrollSelectedIntoView();
    }

    this.#scheduleUpdate();
  }

  setValue(value: string, preventScroll?: boolean) {
    const prevValue = this._state.value;

    if (value !== this._state.value && value === "") {
      tick().then(() => {
        this.key++;
      });
    }
    this.setState("value", value, preventScroll);

    if (prevValue === value) return;
    this.onValueChange?.(value);
  }

  #score(value: string, keywords?: string[]): number {
    return value ? this.filterFn(value, this._state.search, keywords) : 0;
  }

  #filterItems() {
    if (!this._state.search || this.shouldFilter === false) {
      this._state.filtered.count = this.allItems.size;
      return;
    }

    this._state.filtered.groups = new Set();
    let itemCount = 0;

    for (const id of this.allItems) {
      const entry = this.allIds.get(id);
      const val = entry?.value ?? "";
      const kw = entry?.keywords ?? [];
      const rank = this.#score(val, kw);
      this._state.filtered.items.set(id, rank);
      if (rank > 0) itemCount++;
    }

    for (const [groupId, group] of this.allGroups) {
      for (const itemId of group) {
        const s = this._state.filtered.items.get(itemId);
        if (s && s > 0) {
          this._state.filtered.groups.add(groupId);
          break;
        }
      }
    }

    this._state.filtered.count = itemCount;
  }

  #sort() {
    if (!this._state.search || this.shouldFilter === false) {
      if (!this._state.value || !this.#isInitialMount) {
        this.#selectFirstItem();
      } else if (this.#isInitialMount && this._state.value) {
        this.#scrollInitialValue();
      }
      return;
    }

    const scores = this._state.filtered.items;
    const listInsertionElement = this.viewportNode;

    // Sort items by score descending
    const sorted = this.getValidItems().sort((a, b) => {
      const sa = scores.get(a.getAttribute("data-value") ?? "") ?? 0;
      const sb = scores.get(b.getAttribute("data-value") ?? "") ?? 0;
      return sb - sa;
    });

    for (const item of sorted) {
      const group = item.closest(SEL_GROUP_ITEMS);
      if (group) {
        const toAppend =
          item.parentElement === group
            ? item
            : item.closest(`${SEL_GROUP_ITEMS} > *`);
        if (toAppend) group.appendChild(toAppend);
      } else {
        const toAppend =
          item.parentElement === listInsertionElement
            ? item
            : item.closest(`${SEL_GROUP_ITEMS} > *`);
        if (toAppend) listInsertionElement?.appendChild(toAppend);
      }
    }

    // Sort groups by their max-scoring item
    const groups: [string, number][] = [];
    for (const value of this._state.filtered.groups) {
      const items = this.allGroups.get(value);
      let max = 0;
      if (items) {
        for (const item of items) {
          max = Math.max(scores.get(item) ?? 0, max);
        }
      }
      groups.push([value, max]);
    }

    const sortedGroups = groups.sort((a, b) => b[1] - a[1]);
    for (const [groupValue] of sortedGroups) {
      const el = listInsertionElement?.querySelector(
        `${SEL_GROUP}[${COMMAND_VALUE_ATTR}="${CSS.escape(groupValue)}"]`,
      );
      el?.parentElement?.appendChild(el);
    }

    this.#selectFirstItem();
  }

  getValidItems(): HTMLElement[] {
    if (!this.rootNode) return [];
    return Array.from(
      this.rootNode.querySelectorAll<HTMLElement>(SEL_VALID_ITEM),
    );
  }

  getVisibleItems(): HTMLElement[] {
    if (!this.rootNode) return [];
    return Array.from(this.rootNode.querySelectorAll<HTMLElement>(SEL_ITEM));
  }

  #getSelectedItem(): HTMLElement | undefined {
    if (!this.rootNode) return;
    return (
      this.rootNode.querySelector<HTMLElement>(
        `${SEL_VALID_ITEM}[data-selected]`,
      ) ?? undefined
    );
  }

  #selectFirstItem() {
    tick().then(() => {
      const item = this.getValidItems().find((el) => !itemIsDisabled(el));
      const val = item?.getAttribute(COMMAND_VALUE_ATTR) ?? "";
      const preventScroll = this.#isInitialMount && this.disableInitialScroll;
      this.setValue(val, preventScroll);
      this.#isInitialMount = false;
    });
  }

  #scrollInitialValue() {
    tick().then(() => {
      if (!this.disableInitialScroll) {
        this.#scrollSelectedIntoView();
      }
      this.#isInitialMount = false;
    });
  }

  #scrollSelectedIntoView() {
    tick().then(() => {
      const value = this._state.value;
      if (!value || !this.rootNode) return;
      const item = this.rootNode.querySelector<HTMLElement>(
        `${SEL_VALID_ITEM}[${COMMAND_VALUE_ATTR}="${CSS.escape(value)}"]`,
      );
      if (!item) return;

      const grandparent = item.parentElement?.parentElement;
      if (!grandparent) return;

      if (this.isGrid) {
        item.scrollIntoView({ block: "nearest" });
        if (this.#itemIsFirstRowOfGroup(item)) {
          const header = item
            .closest(SEL_GROUP)
            ?.querySelector(SEL_GROUP_HEADING);
          header?.scrollIntoView({ block: "nearest" });
        }
      } else {
        const first = getFirstNonCommentChild(grandparent);
        if (
          first &&
          (first as HTMLElement).dataset?.value === item.dataset?.value
        ) {
          const header = item
            .closest(SEL_GROUP)
            ?.querySelector(SEL_GROUP_HEADING);
          header?.scrollIntoView({ block: "nearest" });
          return;
        }
        item.scrollIntoView({ block: "nearest" });
      }
    });
  }

  updateSelectedToIndex(index: number) {
    const item = this.getValidItems()[index];
    if (!item) return;
    this.setValue(item.getAttribute(COMMAND_VALUE_ATTR) ?? "");
  }

  updateSelectedByItem(change: number) {
    const selected = this.#getSelectedItem();
    const items = this.getValidItems();
    const index = items.findIndex((item) => item === selected);

    let next = items[index + change];
    if (this.loop) {
      next =
        index + change < 0
          ? items[items.length - 1]
          : index + change === items.length
            ? items[0]
            : items[index + change];
    }

    if (next) {
      this.setValue(next.getAttribute(COMMAND_VALUE_ATTR) ?? "");
    }
  }

  updateSelectedByGroup(change: number) {
    const selected = this.#getSelectedItem();
    let group = selected?.closest(SEL_GROUP);
    let item: HTMLElement | null = null;

    while (group && !item) {
      group =
        change > 0
          ? findNextSibling(group, SEL_GROUP)
          : findPreviousSibling(group, SEL_GROUP);
      item = group?.querySelector<HTMLElement>(SEL_VALID_ITEM) ?? null;
    }

    if (item) {
      this.setValue(item.getAttribute(COMMAND_VALUE_ATTR) ?? "");
    } else {
      this.updateSelectedByItem(change);
    }
  }

  get isGrid(): boolean {
    return this.columns !== null;
  }

  get itemsGrid(): {
    index: number;
    firstRowOfGroup: boolean;
    ref: HTMLElement;
  }[][] {
    if (!this.isGrid) return [];
    const cols = this.columns ?? 1;
    const items = this.getVisibleItems();
    const grid: {
      index: number;
      firstRowOfGroup: boolean;
      ref: HTMLElement;
    }[][] = [[]];
    let currentGroup = items[0]?.getAttribute("data-group");
    let column = 0;
    let row = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i]!;
      const itemGroup = item.getAttribute("data-group");

      if (currentGroup !== itemGroup) {
        currentGroup = itemGroup;
        column = 1;
        row++;
        grid.push([{ index: i, firstRowOfGroup: true, ref: item }]);
      } else {
        column++;
        if (column > cols) {
          row++;
          column = 1;
          grid.push([]);
        }
        grid[row]?.push({
          index: i,
          firstRowOfGroup: grid[row]?.[0]?.firstRowOfGroup ?? i === 0,
          ref: item,
        });
      }
    }
    return grid;
  }

  #itemIsFirstRowOfGroup(item: HTMLElement): boolean {
    for (const row of this.itemsGrid) {
      for (const col of row) {
        if (col.ref === item) return col.firstRowOfGroup;
      }
    }
    return false;
  }

  #getColumn(
    item: HTMLElement,
    grid: { index: number; firstRowOfGroup: boolean; ref: HTMLElement }[][],
  ) {
    for (let r = 0; r < grid.length; r++) {
      const row = grid[r]!;
      for (let c = 0; c < row.length; c++) {
        if (row[c]!.ref === item) return { columnIndex: c, rowIndex: r };
      }
    }
    return null;
  }

  #findNextNonDisabledItem(opts: {
    start: number;
    end: number;
    expectedColumnIndex: number;
    grid: { index: number; firstRowOfGroup: boolean; ref: HTMLElement }[][];
  }): HTMLElement | null {
    for (let r = opts.start; r < opts.end; r++) {
      const row = opts.grid[r];
      if (!row) continue;
      let item: HTMLElement | null = row[opts.expectedColumnIndex]?.ref ?? null;
      if (item && itemIsDisabled(item)) {
        item = null;
        continue;
      }
      if (!item) {
        for (let i = row.length - 1; i >= 0; i--) {
          const candidate = row[i];
          if (candidate && !itemIsDisabled(candidate.ref)) {
            item = candidate.ref;
            break;
          }
        }
      }
      if (item) return item;
    }
    return null;
  }

  #findNextNonDisabledItemDesc(opts: {
    start: number;
    end: number;
    expectedColumnIndex: number;
    grid: { index: number; firstRowOfGroup: boolean; ref: HTMLElement }[][];
  }): HTMLElement | null {
    for (let r = opts.start; r >= opts.end; r--) {
      const row = opts.grid[r];
      if (!row) continue;
      let item: HTMLElement | null = row[opts.expectedColumnIndex]?.ref ?? null;
      if (item && itemIsDisabled(item)) {
        item = null;
        continue;
      }
      if (!item) {
        for (let i = row.length - 1; i >= 0; i--) {
          const candidate = row[i];
          if (candidate && !itemIsDisabled(candidate.ref)) {
            item = candidate.ref;
            break;
          }
        }
      }
      if (item) return item;
    }
    return null;
  }

  #calculateOffset(
    selected: HTMLElement,
    newSelected: HTMLElement | null,
  ): number {
    if (!newSelected) return 0;
    const items = this.getValidItems();
    return (
      items.findIndex((i) => i === newSelected) -
      items.findIndex((i) => i === selected)
    );
  }

  #nextRowColumnOffset(e: KeyboardEvent): number {
    const grid = this.itemsGrid;
    const selected = this.#getSelectedItem();
    if (!selected) return 0;
    const col = this.#getColumn(selected, grid);
    if (!col) return 0;

    let newItem: HTMLElement | null = null;
    const skipRows = e.altKey ? 1 : 0;

    if (e.altKey && col.rowIndex === grid.length - 2 && !this.loop) {
      newItem = this.#findNextNonDisabledItem({
        start: grid.length - 1,
        end: grid.length,
        expectedColumnIndex: col.columnIndex,
        grid,
      });
    } else if (col.rowIndex === grid.length - 1) {
      if (!this.loop) return 0;
      newItem = this.#findNextNonDisabledItem({
        start: 0 + skipRows,
        end: col.rowIndex,
        expectedColumnIndex: col.columnIndex,
        grid,
      });
    } else {
      newItem = this.#findNextNonDisabledItem({
        start: col.rowIndex + 1 + skipRows,
        end: grid.length,
        expectedColumnIndex: col.columnIndex,
        grid,
      });
      if (!newItem && this.loop) {
        newItem = this.#findNextNonDisabledItem({
          start: 0,
          end: col.rowIndex,
          expectedColumnIndex: col.columnIndex,
          grid,
        });
      }
    }
    return this.#calculateOffset(selected, newItem);
  }

  #previousRowColumnOffset(e: KeyboardEvent): number {
    const grid = this.itemsGrid;
    const selected = this.#getSelectedItem();
    if (!selected) return 0;
    const col = this.#getColumn(selected, grid);
    if (!col) return 0;

    let newItem: HTMLElement | null = null;
    const skipRows = e.altKey ? 1 : 0;

    if (e.altKey && col.rowIndex === 1 && !this.loop) {
      newItem = this.#findNextNonDisabledItemDesc({
        start: 0,
        end: 0,
        expectedColumnIndex: col.columnIndex,
        grid,
      });
    } else if (col.rowIndex === 0) {
      if (!this.loop) return 0;
      newItem = this.#findNextNonDisabledItemDesc({
        start: grid.length - 1 - skipRows,
        end: col.rowIndex + 1,
        expectedColumnIndex: col.columnIndex,
        grid,
      });
    } else {
      newItem = this.#findNextNonDisabledItemDesc({
        start: col.rowIndex - 1 - skipRows,
        end: 0,
        expectedColumnIndex: col.columnIndex,
        grid,
      });
      if (!newItem && this.loop) {
        newItem = this.#findNextNonDisabledItemDesc({
          start: grid.length - 1,
          end: col.rowIndex + 1,
          expectedColumnIndex: col.columnIndex,
          grid,
        });
      }
    }
    return this.#calculateOffset(selected, newItem);
  }

  #next(e: KeyboardEvent) {
    e.preventDefault();
    if (e.metaKey) {
      this.updateSelectedToIndex(this.getValidItems().length - 1);
    } else if (e.altKey) {
      this.updateSelectedByGroup(1);
    } else {
      this.updateSelectedByItem(1);
    }
  }

  #prev(e: KeyboardEvent) {
    e.preventDefault();
    if (e.metaKey) {
      this.updateSelectedToIndex(0);
    } else if (e.altKey) {
      this.updateSelectedByGroup(-1);
    } else {
      this.updateSelectedByItem(-1);
    }
  }

  #down(e: KeyboardEvent) {
    if (this.columns === null) return;
    e.preventDefault();
    if (e.metaKey) {
      this.updateSelectedByGroup(1);
    } else {
      this.updateSelectedByItem(this.#nextRowColumnOffset(e));
    }
  }

  #up(e: KeyboardEvent) {
    if (this.columns === null) return;
    e.preventDefault();
    if (e.metaKey) {
      this.updateSelectedByGroup(-1);
    } else {
      this.updateSelectedByItem(this.#previousRowColumnOffset(e));
    }
  }

  onkeydown(e: KeyboardEvent) {
    const isVim = this.vimBindings && e.ctrlKey;

    switch (e.key) {
      case "n":
      case "j":
        if (isVim) {
          if (this.isGrid) this.#down(e);
          else this.#next(e);
        }
        break;
      case "l":
        if (isVim && this.isGrid) this.#next(e);
        break;
      case "ArrowDown":
        if (this.isGrid) this.#down(e);
        else this.#next(e);
        break;
      case "ArrowRight":
        if (this.isGrid) this.#next(e);
        break;
      case "p":
      case "k":
        if (isVim) {
          if (this.isGrid) this.#up(e);
          else this.#prev(e);
        }
        break;
      case "h":
        if (isVim && this.isGrid) this.#prev(e);
        break;
      case "ArrowUp":
        if (this.isGrid) this.#up(e);
        else this.#prev(e);
        break;
      case "ArrowLeft":
        if (this.isGrid) this.#prev(e);
        break;
      case "Home":
        e.preventDefault();
        this.updateSelectedToIndex(0);
        break;
      case "End":
        e.preventDefault();
        this.updateSelectedToIndex(this.getValidItems().length - 1);
        break;
      case "Enter":
        if (!e.isComposing && e.keyCode !== 229) {
          e.preventDefault();
          this.#getSelectedItem()?.click();
        }
        break;
    }
  }

  registerItem(id: string, groupId?: string): () => void {
    this.allItems.add(id);

    if (groupId) {
      if (!this.allGroups.has(groupId)) {
        this.allGroups.set(groupId, new Set([id]));
      } else {
        this.allGroups.get(groupId)!.add(id);
      }
    }

    if (!this.#sortAndFilterAfterTick) {
      this.#sortAndFilterAfterTick = true;
      tick().then(() => {
        this.#filterItems();
        this.#sort();
        this.#sortAndFilterAfterTick = false;
      });
    }

    this.#scheduleUpdate();

    return () => {
      const selectedItem = this.#getSelectedItem();
      this.allItems.delete(id);
      this._state.filtered.items.delete(id);
      if (groupId) {
        this.allGroups.get(groupId)?.delete(id);
      }
      this.#filterItems();
      if (selectedItem?.getAttribute(COMMAND_VALUE_ATTR) === id) {
        this.#selectFirstItem();
      }
      this.#scheduleUpdate();
    };
  }

  registerValue(value: string, keywords: string[] = []): () => void {
    if (!(value && value === this.allIds.get(value)?.value)) {
      this.allIds.set(value, { value, keywords });
    }
    this._state.filtered.items.set(value, this.#score(value, keywords));

    if (!this.#sortAfterTick) {
      this.#sortAfterTick = true;
      tick().then(() => {
        this.#sort();
        this.#sortAfterTick = false;
      });
    }

    return () => {
      this.allIds.delete(value);
    };
  }

  registerGroup(id: string): () => void {
    if (!this.allGroups.has(id)) {
      this.allGroups.set(id, new Set());
    }
    return () => {
      this.allIds.delete(id);
      this.allGroups.delete(id);
    };
  }
}

export class CommandListState {
  id = generateId("cmd-list");
  root: CommandRootState;
  listNode: HTMLDivElement | null = $state(null);

  constructor(root: CommandRootState) {
    this.root = root;
  }
}

export class CommandGroupState {
  id: string;
  root: CommandRootState;
  headingNode: HTMLElement | null = $state(null);
  trueValue = $state("");
  forceMount: boolean;

  shouldRender = $derived.by(() => {
    if (this.forceMount) return true;
    if (this.root.shouldFilter === false) return true;
    if (!this.root.commandState.search) return true;
    return this.root._state.filtered.groups.has(this.trueValue);
  });

  constructor(
    root: CommandRootState,
    opts: { value?: string; forceMount?: boolean },
  ) {
    this.id = generateId("cmd-group");
    this.root = root;
    this.forceMount = opts.forceMount ?? false;
    this.trueValue = opts.value ?? this.id;
  }
}

export {
  ATTR_ROOT,
  ATTR_INPUT,
  ATTR_LIST,
  ATTR_VIEWPORT,
  ATTR_GROUP,
  ATTR_GROUP_HEADING,
  ATTR_GROUP_ITEMS,
  ATTR_ITEM,
  ATTR_EMPTY,
  ATTR_LOADING,
  ATTR_SEPARATOR,
  ATTR_INPUT_LABEL,
  COMMAND_VALUE_ATTR,
  SEL_ITEM,
  SEL_VALID_ITEM,
  boolToStr,
  boolToEmptyStrOrUndef,
};
