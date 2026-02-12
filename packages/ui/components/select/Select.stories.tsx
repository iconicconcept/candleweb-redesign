import { ComponentStory, ComponentMeta } from "@storybook/react";
import { SelectDropdown } from "./Select";

export default {
  title: "Dropdowns",
  component: SelectDropdown,
} as ComponentMeta<typeof SelectDropdown>;

const Template: ComponentStory<typeof SelectDropdown> = (args) => <SelectDropdown {...args} />;

export const Primary = Template.bind({});
Primary.args = {
    title: "Primary List",
    width: "250px",
    onValueChange(value) {
      console.log(value)
    },
  lists: ["Secondary list", "Major list", 'Some list'],
};
