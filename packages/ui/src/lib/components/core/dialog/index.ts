import Root from "./dialog.svelte";
import Portal from "./dialog-portal.svelte";
import Overlay from "./dialog-overlay.svelte";
import Trigger from "./dialog-trigger.svelte";
import Content from "./dialog-content.svelte";
import Header from "./dialog-header.svelte";
import Footer from "./dialog-footer.svelte";
import Title from "./dialog-title.svelte";
import Description from "./dialog-description.svelte";
import Close from "./dialog-close.svelte";
import DialogHost from "./dialog-host.svelte";
import {
  dialog,
  dialogs,
  type AlertDialogOptions,
  type DialogInstance,
  type DialogKind,
  type DialogOptions,
  type DialogSize,
} from "./dialog-store";

export {
  Root,
  Portal,
  Overlay,
  Trigger,
  Content,
  Header,
  Footer,
  Title,
  Description,
  Close,
  DialogHost,
  dialog,
  dialogs,
  // types
  type AlertDialogOptions,
  type DialogInstance,
  type DialogKind,
  type DialogOptions,
  type DialogSize,
  //
  Root as Dialog,
  Portal as DialogPortal,
  Overlay as DialogOverlay,
  Trigger as DialogTrigger,
  Content as DialogContent,
  Header as DialogHeader,
  Footer as DialogFooter,
  Title as DialogTitle,
  Description as DialogDescription,
  Close as DialogClose,
};
