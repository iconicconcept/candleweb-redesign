import React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { joinClasses } from "../../utils/join-classes";
import classes from "./Accordion.classes";
import { HiOutlinePlus } from "react-icons/hi";
import { Typography } from "../typography/Typography";
import "./accordion.css";

export interface IAccordionClasses {
  base: string;
  accordionItem: string;
  accordionHeader: string;
  accordionTrigger: string;
  accordionArrow: string;
  accordionContent: string;
}

type AccordionPrimitiveProps = React.ComponentProps<
  typeof AccordionPrimitive.Root
> & {
  classstyle?: string;
  type?: string;
};

type AccordionProps = AccordionPrimitiveProps;

const Accordion = ({
  children,
  classstyle,
  type = "multiple",
  ...props
}: AccordionProps) => (
  <AccordionPrimitive.Root
    className={joinClasses(classstyle, classes.base)}
    type={type}
  >
    {children}
  </AccordionPrimitive.Root>
);

type AccordionItemPrimitiveProps = React.ComponentProps<
  typeof AccordionPrimitive.Item
> & {
  classstyle?: string;
};

type AccordionItemProps = AccordionItemPrimitiveProps;

const AccordionItem = ({
  children,
  classstyle,
  ...props
}: AccordionItemProps) => {
  return (
    <AccordionPrimitive.Item
      className={joinClasses(
        "AccordionItem",
        classstyle,
        classes.accordionItem
      )}
      {...props}
    >
      {children}
    </AccordionPrimitive.Item>
  );
};

type AccordionTriggerPrimitiveProps = React.ComponentProps<
  typeof AccordionPrimitive.Trigger
> & {
  classstyle?: string;
};

type AccordionTriggerProps = AccordionTriggerPrimitiveProps;

const AccordionTrigger = ({ children, classstyle }: AccordionTriggerProps) => {
  return (
    <AccordionPrimitive.Header
      className={joinClasses(
        "AccordionTrigger",
        classstyle,
        classes.accordionHeader
      )}
    >
      <AccordionPrimitive.Trigger
        className={joinClasses(classstyle, classes.accordionTrigger)}
      >
        {children}
        <HiOutlinePlus
          className={joinClasses(classes.accordionArrow, "AccordionChevron")}
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
};

type AccordionContentPrimitiveProps = React.ComponentProps<
  typeof AccordionPrimitive.Content
> & {
  classstyle?: string;
};

type IAccordionContentProps = AccordionContentPrimitiveProps;

const AccordionContent = ({
  children,
  classstyle,
  ...props
}: IAccordionContentProps) => (
  <AccordionPrimitive.Content
    className={joinClasses(
      "AccordionContent",
      classstyle,
      classes.accordionContent
    )}
    {...props}
  >
    <Typography textsize="sm" classstyle="whitespace-pre-wrap pb-2">
      {children}
    </Typography>
  </AccordionPrimitive.Content>
);

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
