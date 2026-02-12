import { ComponentStory, ComponentMeta } from "@storybook/react";
import WhiteSpinner from "./WhiteSpinner";

export default {
  title: "WhiteSpinner",
  component: WhiteSpinner,
} as ComponentMeta<typeof WhiteSpinner>;

const Template: ComponentStory<typeof WhiteSpinner> = (args) => (
  <WhiteSpinner {...args} />
);

export const Primary = Template.bind({});
Primary.args = {
  size: "md",
};
