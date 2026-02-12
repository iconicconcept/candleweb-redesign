import React from "react";
import "./select.css";
import * as Select from "@radix-ui/react-select";
import { FiCheck, FiChevronUp, FiChevronDown } from "react-icons/fi";

export interface ISelectDropdownProps {
  lists: string[];
  title: string;
  width?: string;
  dash?: boolean;
  type?: "primary" | "border";
  icon?: any;
  flex?: boolean;
  image?: any[];
  onValueChange: (value: string) => void;
}

export const SelectDropdown = ({
  lists,
  title = "Select",
  width = "100%",
  type = "primary",
  dash,
  onValueChange,
  icon,
  flex = false,
}: ISelectDropdownProps) => {
  // console.log({
  //   lists,
  //   title,
  //   width,
  //   type,
  //   dash,
  //   onValueChange,
  //   icon,
  //   flex,
  // });
  return (
    <Select.Root onValueChange={onValueChange}>
      <Select.Trigger
        className={`SelectTrigger ${dash
          ? "dash border !border-gray-500 !rounded-full h-[40px] !px-3 !text-[rgba(188,188,188,1)]"
          : ""
          } ${type === "border" ? "border" : ""} ${flex ? "!justify-between" : "justify-center"}`}
        aria-label="Food"
        style={{
          maxWidth: width,
        }}
      >
        <Select.Value placeholder={title} />
        <Select.Icon className="SelectIcon">
          {icon ? icon : <FiChevronDown />}
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="SelectContent">
          <Select.ScrollUpButton className="SelectScrollButton">
            <FiChevronUp />
          </Select.ScrollUpButton>
          <Select.Viewport className="SelectViewport">
            <Select.Group>
              <Select.Label className="SelectLabel">{title} </Select.Label>
              {((typeof lists === "object" && !Array.isArray(lists)) ? [] : lists).map((item, index) => (
                <SelectItem key={index + item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </Select.Group>

            {/* <Select.Separator className="SelectSeparator" /> */}
          </Select.Viewport>
          <Select.ScrollDownButton className="SelectScrollButton">
            <FiChevronDown />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
};


export const SelectImageDropdown = ({
  lists,
  title = "Select",
  width = "100%",
  type = "primary",
  dash,
  onValueChange,
  icon,
  flex = false,
  image,
}: ISelectDropdownProps) => (
  <Select.Root onValueChange={onValueChange}>
    <Select.Trigger
      className={`SelectTrigger image__select ${dash
        ? "dash border !border-gray-500 !rounded-full h-[40px] !px-3 !text-[rgba(188,188,188,1)]"
        : ""
        } ${type === "border" ? "border" : ""} ${flex ? "!justify-between" : "justify-center"} !border-none`}
      aria-label="Food"
      style={{
        maxWidth: width,
      }}
    >
      <Select.Value className="SelectValue flex items-center gap-2">{title.toLowerCase().includes("cde") ? image![(image?.length ?? 0) - 1] : title.toLowerCase().includes("binance") ? image![0] : image![1]} <span>{title}</span></Select.Value>
      <Select.Icon className="SelectIcon image__select">
        {icon ? icon : <FiChevronDown />}
      </Select.Icon>
    </Select.Trigger>
    <Select.Portal className="">
      <Select.Content className="SelectContent  image__select">
        <Select.ScrollUpButton className="SelectScrollButton  image__select">
          <FiChevronUp />
        </Select.ScrollUpButton>
        <Select.Viewport className="SelectViewport image__select">
          <Select.Group>
            {/* <Select.Label className="SelectLabel image__select">{title} </Select.Label> */}
            {lists?.map((item, index) => (
              <SelectItem key={index + item} value={item}>
                {image![index]} <span>{item}</span>
              </SelectItem>
            ))}
          </Select.Group>

          {/* <Select.Separator className="SelectSeparator" /> */}
        </Select.Viewport>
        <Select.ScrollDownButton className="SelectScrollButton image__select">
          <FiChevronDown />
        </Select.ScrollDownButton>
      </Select.Content>
    </Select.Portal>
  </Select.Root>
);

const SelectItem = React.forwardRef(
  (
    {
      children,
      className,
      value,
      ...props
    }: {
      children: any;
      className?: string;
      value: string;
    },
    forwardedRef: any
  ) => {
    return (
      <Select.Item
        className={`SelectItem image__select ${className}`}
        {...props}
        value={value}
        ref={forwardedRef}
      >
        <Select.ItemText className="SelectItemText">{children}</Select.ItemText>
        {/* <Select.ItemIndicator className="SelectItemIndicator">
          <FiCheck />
        </Select.ItemIndicator> */}
      </Select.Item>
    );
  }
);



export const RoundedSelectDropdown = ({
  lists,
  title = "Select",
  width = "100%",
  type = "primary",
  dash,
  icon,
  onValueChange,
}: ISelectDropdownProps) => (
  <Select.Root onValueChange={onValueChange}>
    <Select.Trigger
      className={`rounded__dropdown SelectTrigger ${dash
        ? "dash border !border-gray-500 !rounded-full h-[40px] !px-3 !text-[rgba(188,188,188,1)]"
        : ""
        } ${type === "border" ? "border" : ""}`}
      aria-label="Food"
      style={{
        maxWidth: width,
      }}
    >
      <div className="flex items-center gap-4 text-dark">
        {icon && <Select.Icon className="SelectIcon">
          {icon}
        </Select.Icon>}

        <Select.Value placeholder={title} />
      </div>
      <Select.Icon className="SelectIcon">
        <FiChevronDown />
      </Select.Icon>
    </Select.Trigger>
    <Select.Portal>
      <Select.Content className="SelectContent">
        <Select.ScrollUpButton className="SelectScrollButton">
          <FiChevronUp />
        </Select.ScrollUpButton>
        <Select.Viewport className="SelectViewport">
          <Select.Group>
            <Select.Label className="SelectLabel">{title} </Select.Label>
            {lists?.map((item, index) => (
              <SelectItem key={index + item} value={item}>
                {item}
              </SelectItem>
            ))}
          </Select.Group>

          {/* <Select.Separator className="SelectSeparator" /> */}
        </Select.Viewport>
        <Select.ScrollDownButton className="SelectScrollButton">
          <FiChevronDown />
        </Select.ScrollDownButton>
      </Select.Content>
    </Select.Portal>
  </Select.Root>
);