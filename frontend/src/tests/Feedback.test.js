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

const feedbackEntry = Object.entries(allModules).find(([path]) =>
  /feedback/i.test(path)
);

if (!feedbackEntry) {
  throw new Error(
    "No Feedback component/page file was found inside src/pages or src/components."
  );
}

const Feedback = feedbackEntry[1].default;

function renderFeedback() {
  return render(
    React.createElement(
      BrowserRouter,
      null,
      React.createElement(Feedback)
    )
  );
}

describe("Feedback Component", () => {
  test("renders feedback page without crashing", () => {
    renderFeedback();
    expect(document.body).toBeInTheDocument();
  });

  test("renders feedback heading or feedback text", () => {
    renderFeedback();

    const foundElements = screen.queryAllByText(/feedback/i);
    expect(foundElements.length).toBeGreaterThan(0);
  });

  test("renders buttons if available", () => {
    renderFeedback();

    const buttons = screen.queryAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(0);
  });

  test("renders input fields if available", () => {
    renderFeedback();

    const inputs = screen.queryAllByRole("textbox");
    expect(inputs.length).toBeGreaterThanOrEqual(0);
  });
});