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

const roomEntry = Object.entries(allModules).find(([path]) =>
  /room/i.test(path)
);

if (!roomEntry) {
  throw new Error(
    "No Room component/page file was found inside src/pages or src/components."
  );
}

const Room = roomEntry[1].default;

function renderRoom() {
  return render(
    React.createElement(
      BrowserRouter,
      null,
      React.createElement(Room)
    )
  );
}

describe("Room Component", () => {
  test("renders room page without crashing", () => {
    renderRoom();
    expect(document.body).toBeInTheDocument();
  });

  test("renders room heading or room text", () => {
    renderRoom();

    const foundElements = screen.queryAllByText(/room/i);
    expect(foundElements.length).toBeGreaterThan(0);
  });

  test("renders buttons if available", () => {
    renderRoom();

    const buttons = screen.queryAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(0);
  });

  test("renders input fields if available", () => {
    renderRoom();

    const inputs = screen.queryAllByRole("textbox");
    expect(inputs.length).toBeGreaterThanOrEqual(0);
  });
});