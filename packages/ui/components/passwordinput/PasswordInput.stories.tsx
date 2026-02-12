import { ComponentStory, ComponentMeta } from "@storybook/react";
import PasswordInput from "./PasswordInput";

export default {
  title: "PasswordInput",
  component: PasswordInput,
} as ComponentMeta<typeof PasswordInput>;

const Template: ComponentStory<typeof PasswordInput> = (args) => (
  <PasswordInput {...args} />
);

export const Primary = Template.bind({});
Primary.args = {
  name: "primary",
  value: "",
  placeholder: "Enter Primary",
  width: "w-full",
  className: "",
  onChange: (value: any) => {},
};
