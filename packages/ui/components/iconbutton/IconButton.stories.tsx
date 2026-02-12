import { ComponentStory, ComponentMeta } from "@storybook/react";
import { HeartFilledIcon } from "@radix-ui/react-icons";
import IconButton from "./IconButton";

export default {
  title: "IconButton",
  component: IconButton,
} as ComponentMeta<typeof IconButton>;

const Template: ComponentStory<typeof IconButton> = (args) => (
  <IconButton {...args} />
);

export const Primary = Template.bind({});
Primary.args = {
  children: "Primary",
  type: "button",
  loading: false,
  variant: "primary",
  loadingtext: "Wait...",
  fullwidth: false,
  size: "lg",
  lefticon: <HeartFilledIcon />,
  onClick: () => {
    console.log("Button Clicked");
  },
};
