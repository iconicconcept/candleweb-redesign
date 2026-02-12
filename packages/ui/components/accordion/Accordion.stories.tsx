import { PersonIcon } from "@radix-ui/react-icons";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import { Heading } from "../heading/Heading";
import { Typography } from "../typography/Typography";
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionTrigger,
} from "./Accordion";

export default {
  title: "Accordion",
  component: Accordion,
} as ComponentMeta<typeof Accordion>;

const Template: ComponentStory<typeof Accordion> = (args) => (
  <Accordion {...args} />
);

export const Single = Template.bind({});
Single.args = {
  children: (
    <AccordionItem
      key={`header-`}
      value={`item-`}
      classstyle="!w-full !shadow-[0px_4px_12px_rgba(24,_39,_75,_0.12)] !border-0"
      disabled
    >
      <AccordionHeader>
        <AccordionTrigger classstyle="!bg-white !h-[56px]">
          <div className="flex items-center space-x-[24px]">
            <PersonIcon />
            <Heading
              textsize="sm"
              boldness="med"
              classstyle="text-gray-900 font-serif"
            >
              This is the header bro
            </Heading>
          </div>
        </AccordionTrigger>
      </AccordionHeader>
      <AccordionContent classstyle="!w-full !grow-0">
        <Typography
          textsize="sm"
          color="gray"
          classstyle="text-gray-700 font-serif"
        >
          <p>
            Sunt non adipisicing tempor Fugiat aute magna labore voluptate aute
            fugiat id ullamco anim excepteur commodo sunt in. consequat quis
            voluptate occaecat adipisicing qui aliquip aute amet consequat
            culpa.
          </p>
        </Typography>
      </AccordionContent>
    </AccordionItem>
  ),
  type: "single",
};
