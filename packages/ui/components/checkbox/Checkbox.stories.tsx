import { ComponentStory, ComponentMeta } from "@storybook/react";
import { Checkbox } from "./Checkbox";

export default {
  title: "Checkbox",
  component: Checkbox,
} as ComponentMeta<typeof Checkbox>;

const Template: ComponentStory<typeof Checkbox> = (args) => (
  <Checkbox {...args} />
);

export const Primary = Template.bind({});
Primary.args = {
  value: "Name",
  labeltext: "Name",
  labelfor: "name",
  name: "name",
  required: false,
  defaultChecked: false,
  classstyle: "font-medium",
};
