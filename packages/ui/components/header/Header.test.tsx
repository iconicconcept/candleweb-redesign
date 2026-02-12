import { render, screen } from "@testing-library/react";
import { FiSearch } from "react-icons/fi";
import { Header } from "./Header";
import { PersonIcon } from "@radix-ui/react-icons";

test("renders header", () => {
  render(<Header Icon={FiSearch} Logo={<PersonIcon />} />);
  const buttonElement = screen.getByText(/candleweb/i);
  expect(buttonElement).not.toBeNull();
});
