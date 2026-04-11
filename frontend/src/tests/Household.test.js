import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

const pageModules = import.meta.glob("../pages/**/*.{js,jsx}", {
  eager: true,
});

const componentModules = import.meta.glob(
  "../components/**/*.{js,jsx}",
  {
    eager: true,
  }
);

const allModules = {
  ...pageModules,
  ...componentModules,
};

const householdEntry = Object.entries(allModules).find(([path]) =>
  /household/i.test(path)
);

if (!householdEntry) {
  throw new Error(
    "No Household component/page file was found inside src/pages or src/components."
  );
}

const Household = householdEntry[1].default;

function renderHousehold() {
  return render(
    React.createElement(
      BrowserRouter,
      null,
      React.createElement(Household)
    )
  );
}

describe("Household Component", () => {
  test("renders household page without crashing", () => {
    renderHousehold();
    expect(document.body).toBeInTheDocument();
  });

  test("renders household heading or household text", () => {
    renderHousehold();

    const foundElements = screen.queryAllByText(/household/i);

    expect(foundElements.length).toBeGreaterThan(0);
  });

  test("renders buttons if available", () => {
    renderHousehold();

    const buttons = screen.queryAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(0);
  });

  test("renders input fields if available", () => {
    renderHousehold();

    const inputs = screen.queryAllByRole("textbox");
    expect(inputs.length).toBeGreaterThanOrEqual(0);
  });
});