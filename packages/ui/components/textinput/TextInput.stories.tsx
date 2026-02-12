import { ComponentStory, ComponentMeta } from "@storybook/react";
import { TextInput } from "./TextInput";

export default {
  title: "TextInput",
  component: TextInput,
} as ComponentMeta<typeof TextInput>;

const Template: ComponentStory<typeof TextInput> = (args) => <TextInput {...args} />;

export const Primary = Template.bind({});
Primary.args = {
    type: 'text',
    name: 'primary',
    label: "Primary",
    value: '',
    className: '',
    onChange: (value: any) => {}
};
