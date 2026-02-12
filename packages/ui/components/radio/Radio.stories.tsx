import { ComponentStory, ComponentMeta } from "@storybook/react";
import { Radio, RadioItem, RadioIndicator } from "./Radio";

export default {
  title: "Radio",
  component: Radio,
} as ComponentMeta<typeof Radio>;

const Template: ComponentStory<typeof Radio> = (args) => <Radio {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  name: "primary",
  value: "",
  placeholder: "Enter Primary",
  width: "w-full",
  className: "",
  onChange: (value: any) => {},
};
