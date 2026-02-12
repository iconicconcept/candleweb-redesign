import { ComponentStory, ComponentMeta } from "@storybook/react";
import { Button } from "./Button";

export default {
  title: "Buttons",
  component: Button,
} as ComponentMeta<typeof Button>;

const Template: ComponentStory<typeof Button> = (args) => <Button {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  children: "Primary",
  type: "button",
  loading: false,
  variant: "primary",
  fullwidth: false,
  size: "lg",
  onClick: () => {
    console.log("Button Clicked");
  },
};

export const Seconday = Template.bind({});
Seconday.args = {
  children: "Primary",
  type: "submit",
  loading: false,
  variant: "secondary",
  fullwidth: false,
  size: "lg",
  onClick() {
    console.log("Button Clicked");
  },
};
