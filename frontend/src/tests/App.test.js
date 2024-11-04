import { render, screen } from "@testing-library/react";
import App from "../App";
import { fireEvent } from "@testing-library/react";
import Subscribe from "./Subscribe";
import fetchMock from "jest-fetch-mock";

test("renders learn react link", () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});

describe("Form Input Handling", () => {
  it("should update phone number state on input change", () => {
    render(<Subscribe />);

    const phoneInput = screen.getByPlaceholderText(/Enter your phone number/i);
    fireEvent.change(phoneInput, { target: { value: "1234567890" } });

    expect(phoneInput.value).toBe("1234567890");
  });
});

fetchMock.enableMocks();

describe("Unsubscribe Functionality", () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it("should handle unsubscribe successfully", async () => {
    fetch.mockResponseOnce(
      JSON.stringify({ message: "Unsubscribed successfully" })
    );

    render(<Subscribe />);

    const phoneInput = screen.getByPlaceholderText(/Enter your phone number/i);
    fireEvent.change(phoneInput, { target: { value: "1234567890" } });

    const unsubscribeButton = screen.getByText(/Unsubscribe/i);
    fireEvent.click(unsubscribeButton);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5000/api/unsubscribe",
      expect.anything()
    );
  });
});

describe("Loading State", () => {
  it("should display loading spinner while fetching link token", () => {
    render(<Subscribe />);

    const loadingSpinner = screen.getByRole("progressbar");
    expect(loadingSpinner).toBeInTheDocument();
  });
});

describe("API Error Handling", () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it("should display error message if fetching link token fails", async () => {
    fetch.mockReject(new Error("API failure"));

    render(<Subscribe />);

    const errorMessage = await screen.findByText(
      /Unable to load. Please try again./i
    );
    expect(errorMessage).toBeInTheDocument();
  });
});

describe("Plaid Exit Event", () => {
  it("should log exit event data when PlaidLink onExit is triggered", () => {
    const consoleLogSpy = jest.spyOn(console, "log");
    render(<Subscribe />);

    // TODO Simulate exit event here (mock or trigger manually if possible)

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("Plaid Exit")
    );
    consoleLogSpy.mockRestore();
  });
});

describe("Circular Progress Display", () => {
  it("should render CircularProgress while loading", () => {
    render(<Subscribe />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});

describe("Transaction Data Parsing", () => {
  it("should log transaction data correctly", () => {
    const consoleLogSpy = jest.spyOn(console, "log");
    render(<Subscribe />);
    // TODO Simulate transaction data here (mock or trigger manually if possible)
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("Transaction SMS Sent")
    );
    consoleLogSpy.mockRestore();
  });
});

describe("Button Styling and State", () => {
  it("should update button styles on hover", () => {
    render(<Subscribe />);

    const connectButton = screen.getByText(/Connect Your Bank/i);
    fireEvent.mouseOver(connectButton);

    expect(connectButton).toHaveStyle("background-color: success.dark");
  });
});
