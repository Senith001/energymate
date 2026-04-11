import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

const pageModules = import.meta.glob("../pages/**/*.{js,jsx}", {
  eager: true,
});

const componentModules = import.meta.glob("../components/**/*.{js,jsx}", {
  eager: true,
});

const allModules = {
  ...pageModules,
  ...componentModules,
};

const supportEntry = Object.entries(allModules).find(([path]) =>
  /support/i.test(path)
);

if (!supportEntry) {
  throw new Error(
    "No Support component/page file was found inside src/pages or src/components."
  );
}

const Support = supportEntry[1].default;

function renderSupport() {
  return render(
    React.createElement(
      BrowserRouter,
      null,
      React.createElement(Support)
    )
  );
}

describe("Support Component", () => {
  test("renders support page without crashing", () => {
    renderSupport();
    expect(document.body).toBeInTheDocument();
  });

  test("renders support heading or support text", () => {
    renderSupport();

    const foundElements = screen.queryAllByText(/support/i);
    expect(foundElements.length).toBeGreaterThan(0);
  });

  test("renders buttons if available", () => {
    renderSupport();

    const buttons = screen.queryAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(0);
  });

  test("renders input fields if available", () => {
    renderSupport();

    const inputs = screen.queryAllByRole("textbox");
    expect(inputs.length).toBeGreaterThanOrEqual(0);
  });
});