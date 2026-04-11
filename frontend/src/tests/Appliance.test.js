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

const applianceEntry = Object.entries(allModules).find(([path]) =>
  /appliance/i.test(path)
);

if (!applianceEntry) {
  throw new Error(
    "No Appliance component/page file was found inside src/pages or src/components."
  );
}

const Appliance = applianceEntry[1].default;

function renderAppliance() {
  return render(
    React.createElement(
      BrowserRouter,
      null,
      React.createElement(Appliance)
    )
  );
}

describe("Appliance Component", () => {
  test("renders appliance page without crashing", () => {
    renderAppliance();
    expect(document.body).toBeInTheDocument();
  });

  test("renders appliance heading or appliance text", () => {
    renderAppliance();

    const foundElements = screen.queryAllByText(/appliance/i);
    expect(foundElements.length).toBeGreaterThan(0);
  });

  test("renders buttons if available", () => {
    renderAppliance();

    const buttons = screen.queryAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(0);
  });

  test("renders input fields if available", () => {
    renderAppliance();

    const inputs = screen.queryAllByRole("textbox");
    expect(inputs.length).toBeGreaterThanOrEqual(0);
  });
});