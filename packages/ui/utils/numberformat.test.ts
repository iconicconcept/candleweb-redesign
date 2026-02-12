import { numformatter } from "./number-format";

test("numformatter", () => {
  expect(numformatter(123456)).toBe("123,456");
  expect(numformatter(123456789)).toBe("123,456,789");
  expect(numformatter(0)).toBe("0");
  expect(numformatter(-104)).toBe("-104");
});
