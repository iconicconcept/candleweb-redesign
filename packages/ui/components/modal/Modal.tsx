import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import React from "react";
import "./modal.css";

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
  return (
    <Dialog.Root open={props.isOpen} onOpenChange={props.onChnage}>
      <Dialog.Trigger asChild ref={props.ref}>
        {props.btn}
      </Dialog.Trigger>
      <Dialog.Portal>
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
