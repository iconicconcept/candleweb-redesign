import { ComponentStory, ComponentMeta } from "@storybook/react";
import BlueSpinner from "./BlueSpinner";

export default {
  title: "BlueSpinner",
  component: BlueSpinner,
} as ComponentMeta<typeof BlueSpinner>;

const Template: ComponentStory<typeof BlueSpinner> = (args) => (
  <BlueSpinner {...args} />
);

export const Primary = Template.bind({});
Primary.args = {
  size: "md",
};
