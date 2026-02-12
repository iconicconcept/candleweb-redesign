import React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import classes from "./Radio.classess";
import { joinClasses } from "../../utils/join-classes";

export interface IRadioGroupClasses {
  base: string;
  radioItem: string;
  radioIndicator: string;
}

type RadioGroupPrimitiveProps = React.ComponentProps<
  typeof RadioGroupPrimitive.Root
> & {
  classstyle?: string;
};

type RadioGroupProps = RadioGroupPrimitiveProps;

const Radio = ({ children, classstyle, ...props }: RadioGroupProps) => {
  return (
    <RadioGroupPrimitive.Root
      {...props}
      className={joinClasses(classes.base, classstyle)}
    >
      {children}
    </RadioGroupPrimitive.Root>
  );
};

type RadioGroupItemPrimitiveProps = React.ComponentProps<
  typeof RadioGroupPrimitive.Item
> & {
  classstyle?: string;
};

type RadioGroupItemProps = RadioGroupItemPrimitiveProps;

const RadioItem = ({ children, classstyle, ...props }: RadioGroupItemProps) => {
  return (
    <RadioGroupPrimitive.Item
      {...props}
      className={joinClasses(
        "peer relative w-3 h-3 rounded-full border border-transparent text-white radix-state-checked:bg-white radix-state-checked:ring-offset-2 radix-state-checked:ring-semBlue600 radix-state-checked:ring-[2px] radix-state-unchecked:bg-white radix-state-unchecked:ring-[#433A81] radix-state-unchecked:ring-offset-2 radix-state-unchecked:ring-[2px] focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring focus-visible:ring-semBlue600 focus-visible:ring-offset-2",
        classstyle
      )}
    >
      {children}
    </RadioGroupPrimitive.Item>
  );
};

type RadioGroupIndicatorPrimitiveProps = React.ComponentProps<
  typeof RadioGroupPrimitive.Indicator
> & {
  classstyle?: string;
};

type RadioGroupIndicatorProps = RadioGroupIndicatorPrimitiveProps;

const RadioIndicator = ({
  children,
  classstyle,
  ...props
}: RadioGroupIndicatorProps) => {
  return (
    <RadioGroupPrimitive.Indicator
      {...props}
      className={joinClasses(classes.radioIndicator, classstyle)}
    >
      {children}
    </RadioGroupPrimitive.Indicator>
  );
};

export { Radio, RadioItem, RadioIndicator };
