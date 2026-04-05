import IconAppWindow from "./_icons/app-window.svelte";
import IconArrowDownToLine from "./_icons/arrow-down-to-line.svelte";
import IconCheck from "./_icons/check.svelte";
import IconChevronDown from "./_icons/chevron-down.svelte";
import IconChevronRight from "./_icons/chevron-right.svelte";
import IconChevronUp from "./_icons/chevron-up.svelte";
import IconChevronsUpDown from "./_icons/chevrons-up-down.svelte";
import IconCircleAlert from "./_icons/circle-alert.svelte";
import IconCode from "./_icons/code.svelte";
import IconCommand from "./_icons/command.svelte";
import IconCopy from "./_icons/copy.svelte";
import IconDownload from "./_icons/download.svelte";
import IconEye from "./_icons/eye.svelte";
import IconEyeOff from "./_icons/eye-off.svelte";
import IconGrid from "./_icons/grid.svelte";
import IconInbox from "./_icons/inbox.svelte";
import IconInfo from "./_icons/info.svelte";
import IconLoader from "./_icons/loader.svelte";
import IconMinus from "./_icons/minus.svelte";
import IconPalette from "./_icons/palette.svelte";
import IconPause from "./_icons/pause.svelte";
import IconPencil from "./_icons/pencil.svelte";
import IconPlay from "./_icons/play.svelte";
import IconPlus from "./_icons/plus.svelte";
import IconRadio from "./_icons/radio.svelte";
import IconRotateCcw from "./_icons/rotate-ccw.svelte";
import IconSearch from "./_icons/search.svelte";
import IconSettings from "./_icons/settings.svelte";
import IconShare2 from "./_icons/share-2.svelte";
import IconSlidersHorizontal from "./_icons/sliders-horizontal.svelte";
import IconSquare from "./_icons/square.svelte";
import IconTableRows from "./_icons/table-rows.svelte";
import IconTrash2 from "./_icons/trash-2.svelte";
import IconTriangleAlert from "./_icons/triangle-alert.svelte";
import IconUpload from "./_icons/upload.svelte";
import IconWrench from "./_icons/wrench.svelte";
import IconX from "./_icons/x.svelte";

export const icons = {
  app_window: IconAppWindow,
  arrow_down_to_line: IconArrowDownToLine,
  check: IconCheck,
  chevron_down: IconChevronDown,
  chevron_right: IconChevronRight,
  chevron_up: IconChevronUp,
  chevrons_up_down: IconChevronsUpDown,
  circle_alert: IconCircleAlert,
  code: IconCode,
  command: IconCommand,
  copy: IconCopy,
  download: IconDownload,
  eye: IconEye,
  eye_off: IconEyeOff,
  grid: IconGrid,
  inbox: IconInbox,
  info: IconInfo,
  loader: IconLoader,
  minus: IconMinus,
  palette: IconPalette,
  pause: IconPause,
  pencil: IconPencil,
  play: IconPlay,
  plus: IconPlus,
  radio: IconRadio,
  rotate_ccw: IconRotateCcw,
  search: IconSearch,
  settings: IconSettings,
  share: IconShare2,
  sliders_horizontal: IconSlidersHorizontal,
  square: IconSquare,
  table_rows: IconTableRows,
  trash: IconTrash2,
  triangle_alert: IconTriangleAlert,
  upload: IconUpload,
  wrench: IconWrench,
  x: IconX,
} as const;

export type IconName = keyof typeof icons;
