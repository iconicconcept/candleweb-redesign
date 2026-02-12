import React, { useEffect, useState } from "react";

import { RxCaretDown } from "react-icons/rx";
import { Typography } from "../typography/Typography";
import "./dropdown.css";

interface IDropdownProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  icon?: JSX.Element;
  isStatic?: boolean;
  static?: JSX.Element;
  items: {
    name: string;
    route: string;
  }[];
}

export const Dropdown = ({ title, items, isStatic, ...props }: IDropdownProps) => (
  <div className="dropdown__menu relative cursor-pointer">
    <p className="px-5 ms:px-4 py-3 font-medium outfit hover:text-primary flex items-center justify-between">
      {title} <RxCaretDown className="ml-3 font-semibold" />
    </p>
    <div className="submenu bg-card rounded-md p-3 absolute top-10 w-[150px] z-20 hidden border border-white">
      {items.map((item, index) => (
        <span key={item.route + index}> {!isStatic && <a
          href={item.route}
          className="submenu__items block hover:text-primary duration-500"
          key={item.name + index}
        >
          {item.name}
        </a>
        }
          {isStatic && props.static
          } </span>
      ))}
    </div>
  </div>
);

export const SubMenuDropdown = ({
  title,
  items,
  icon,
  ...props
}: IDropdownProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="dropdown__menu--mobile relative transition-all duration-500 ease-in-out"
      {...props}
    >
      <div
        className="flex items-center justify-between"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Typography classstyle="py-3 font-medium outfit hover:text-primary flex items-center">
          {icon}
          {title}
        </Typography>{" "}
        <RxCaretDown className="ml-3 font-semibold" />
      </div>
      <div
        className={`submenu__mobile ml-9 top-10 w-[150px] transition-all duration-500 ease-in-out overflow-hidden `}
        style={
          {
            height: open ? "auto" : "0",
          }
        }
      >
        {items.map((item, index) => (
          <a
            href={item.route}
            className="submenu__items block py-2 hover:text-primary duration-500"
            key={index + item.route}
          >
            {item.name}
          </a>
        ))}
      </div>
    </div>
  );
};
