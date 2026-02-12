import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

test("renders button", () => {
  render(<Button children="Test" />);
  const buttonElement = screen.getByText(/Test/i);
  expect(buttonElement).not.toBeNull();
});
