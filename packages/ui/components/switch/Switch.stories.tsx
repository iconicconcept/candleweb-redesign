import { ComponentStory, ComponentMeta } from "@storybook/react";
import Switch from "./Switch";

export default {
  title: "Switch",
  component: Switch,
} as ComponentMeta<typeof Switch>;

const Template: ComponentStory<typeof Switch> = (args) => <Switch {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  name: "primary",
  value: "Name",
  checked: true,
  defaultChecked: false,
  oncheckedchange(value) {
    console.log(value);
  },
};
