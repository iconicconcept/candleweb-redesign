import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import React from "react";
import "./modal.css";

/**
 * Radix's Dialog.Portal mounts straight into `document.body` by default,
 * which sits outside the dashboard's `.fx-root` — the element every
 * `--fx-*`/`--card-bg`/theme token is actually declared on (light theme
 * included, via `:root[data-theme="light"] .fx-root {…}`). A modal portaled
 * to `document.body` never sees those variables resolve, so `background:
 * var(--card-bg)` etc. silently fall back to nothing and it renders
 * see-through/wrong-colored — same class of bug as the dashboard "More"
 * sheet. Fix: portal into `.fx-root` when the page has one (any dashboard
 * page); fall back to the default `document.body` everywhere else (public
 * pages, which have no `.fx-root` and never did have this problem).
 */
function useThemedPortalContainer(open?: boolean) {
  const [container, setContainer] = React.useState<HTMLElement | undefined>(undefined);
  React.useEffect(() => {
    if (!open) return;
    setContainer((document.querySelector(".fx-root") as HTMLElement | null) ?? undefined);
  }, [open]);
  return container;
}

interface IModalProps {
  children: React.ReactNode;
  btn?: JSX.Element;
  title: any;
  width?: string;
  padding?: string;
  ref?: typeof React.useRef;
  isOpen?: boolean;
  onChnage?: (e: boolean) => void;
}

export const Modal = (props: IModalProps) => {
  const container = useThemedPortalContainer(props.isOpen);

  return (
    <Dialog.Root open={props.isOpen} onOpenChange={props.onChnage}>
      <Dialog.Trigger asChild ref={props.ref}>
        {props.btn}
      </Dialog.Trigger>
      <Dialog.Portal container={container}>
        <Dialog.Overlay className="DialogOverlay" />
        <Dialog.Content
          className="DialogContent"
          style={{
            maxWidth: props.width ? props.width : "580px",
            padding: props.padding ? props.padding : "25px",
          }}
        >
          <Dialog.Title className="DialogTitle">{props.title}</Dialog.Title>
          {props.children}
          <Dialog.Close asChild>
            <button
              className="IconButton transition duration-500 text-primary hover:bg-primary hover:text-white"
              aria-label="Close"
            >
              <Cross2Icon />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
