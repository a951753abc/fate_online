import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoleSelector } from "./RoleSelector.js";

describe("RoleSelector", () => {
  it("renders three role buttons", () => {
    render(<RoleSelector current="any" onChange={() => {}} />);

    expect(screen.getByText("Master")).toBeInTheDocument();
    expect(screen.getByText("Servant")).toBeInTheDocument();
    expect(screen.getByText("Any")).toBeInTheDocument();
  });

  it("highlights the current role", () => {
    render(<RoleSelector current="master" onChange={() => {}} />);

    const masterBtn = screen.getByText("Master");
    expect(masterBtn).toHaveStyle({ fontWeight: "bold" });
  });

  it("does not highlight non-current roles", () => {
    render(<RoleSelector current="master" onChange={() => {}} />);

    const servantBtn = screen.getByText("Servant");
    expect(servantBtn).toHaveStyle({ fontWeight: "normal" });
  });

  it("calls onChange with correct role on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RoleSelector current="any" onChange={onChange} />);

    await user.click(screen.getByText("Master"));
    expect(onChange).toHaveBeenCalledWith("master");

    await user.click(screen.getByText("Servant"));
    expect(onChange).toHaveBeenCalledWith("servant");

    await user.click(screen.getByText("Any"));
    expect(onChange).toHaveBeenCalledWith("any");
  });
});
