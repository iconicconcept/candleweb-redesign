import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import "./styles.css";

interface IDropdownMenuProps {
  children: React.ReactNode;
  btn?: JSX.Element;
  width?: string;
  height?: string;
  padding?: string;
}

export const MenuDropdown = (props: IDropdownMenuProps) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{props.btn}</DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="DropdownMenuContent z-50 sm:!max-w-none sm:!w-screen sm:!p-4 sm:!pl-5"
          sideOffset={6}
          side="bottom"
          align="start"
          style={{
            maxWidth: props.width ?? "580px",
            maxHeight: props.height ?? "480px",
            padding: props.padding ?? "25px",
          }}
        >
          {props.children}

          <DropdownMenu.Arrow className="DropdownMenuArrow" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
