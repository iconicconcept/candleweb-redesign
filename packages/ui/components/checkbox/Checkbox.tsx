import React from "react";
import { joinClasses } from "../../utils/join-classes";
import { CheckIcon } from "@radix-ui/react-icons";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import Flex from "../../layout/flex";
import InputLabel from "../label/Label";

// Checkbox Root
interface ICheckboxProps {
  value: string;
  defaultChecked?: boolean;
  name?: string;
  checked?: boolean;
  labelfor: string;
  labeltext: React.ReactNode;
  classstyle?: string;
  iconstyle?: string;
}

export const Checkbox = ({
  value,
  classstyle,
  defaultChecked,
  checked,
  ...props
}: ICheckboxProps) => {
  return (
    <Flex classstyle="!space-x-[10px]">
      <CheckboxPrimitive.Root
        {...props}
        id={props.labelfor}
        value={value}
        defaultChecked={defaultChecked}
        checked={checked}
        className={joinClasses(
          "flex flex-none h-6 w-6 items-center justify-center rounded",
          "radix-state-checked:bg-semBlue600 radix-state-unchecked:border-[1px] radix-state-unchecked:border-semBlue600",
          "focus:!ring-[1px] focus:outline-none focus-visible:ring focus-visible:ring-semBlue600 focus-visible:ring-opacity-75",
          classstyle
        )}
      >
        <CheckboxPrimitive.Indicator>
          {/* {checked === "indeterminate" && (
            <DividerHorizontalIcon className='h-4 w-4 self-center text-semPrimary' />
          )} */}
          {checked && (
            <CheckIcon className={joinClasses("h-4 w-4 self-center text-white", props.iconstyle)} />
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {props.labeltext && (
        <InputLabel labelfor={props.labelfor} classstyle={classstyle}>
          {props.labeltext}
        </InputLabel>
      )}
    </Flex>
  );
};