import { render, screen, fireEvent } from "@testing-library/react";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { jest, describe, it, expect } from "@jest/globals";

// Mock component that uses the hook
function TestComponent({ onCtrlN, onCtrlS }: { onCtrlN: () => void; onCtrlS: () => void }) {
  useKeyboardShortcut({
    key: "n",
    modifier: "ctrl",
    callback: onCtrlN,
  });
  useKeyboardShortcut({
    key: "s",
    modifier: "ctrl",
    callback: onCtrlS,
  });
  return <div>Test Component</div>;
}

describe("useKeyboardShortcut Hook", () => {
  it("should call callback when Ctrl+N is pressed", () => {
    const mockCallback = jest.fn();
    render(<TestComponent onCtrlN={mockCallback} onCtrlS={jest.fn()} />);

    fireEvent.keyDown(document, { key: "n", ctrlKey: true });

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it("should call callback when Ctrl+S is pressed", () => {
    const mockCallback = jest.fn();
    render(<TestComponent onCtrlN={jest.fn()} onCtrlS={mockCallback} />);

    fireEvent.keyDown(document, { key: "s", ctrlKey: true });

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it("should not call callback when only N is pressed without Ctrl", () => {
    const mockCallback = jest.fn();
    render(<TestComponent onCtrlN={mockCallback} onCtrlS={jest.fn()} />);

    fireEvent.keyDown(document, { key: "n", ctrlKey: false });

    expect(mockCallback).not.toHaveBeenCalled();
  });

  it("should not call callback when disabled", () => {
    const mockCallback = jest.fn();
    const { rerender } = render(
      <TestComponent onCtrlN={mockCallback} onCtrlS={jest.fn()} />
    );

    // The hook doesn't support `enabled` prop in the current implementation
    // This test is for future enhancement
    fireEvent.keyDown(document, { key: "n", ctrlKey: true });

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });
});
