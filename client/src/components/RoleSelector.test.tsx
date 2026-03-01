import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoleSelector } from "./RoleSelector.js";

describe("RoleSelector", () => {
  it("renders three role buttons", () => {
    render(<RoleSelector current="any" onChange={() => {}} />);

    expect(screen.getByText("マスター")).toBeInTheDocument();
    expect(screen.getByText("サーヴァント")).toBeInTheDocument();
    expect(screen.getByText("皆可")).toBeInTheDocument();
  });

  it("highlights the current role", () => {
    render(<RoleSelector current="master" onChange={() => {}} />);

    const masterBtn = screen.getByText("マスター");
    expect(masterBtn).toHaveStyle({ fontWeight: "bold" });
  });

  it("does not highlight non-current roles", () => {
    render(<RoleSelector current="master" onChange={() => {}} />);

    const servantBtn = screen.getByText("サーヴァント");
    expect(servantBtn).toHaveStyle({ fontWeight: "normal" });
  });

  it("calls onChange with correct role on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RoleSelector current="any" onChange={onChange} />);

    await user.click(screen.getByText("マスター"));
    expect(onChange).toHaveBeenCalledWith("master");

    await user.click(screen.getByText("サーヴァント"));
    expect(onChange).toHaveBeenCalledWith("servant");

    await user.click(screen.getByText("皆可"));
    expect(onChange).toHaveBeenCalledWith("any");
  });
});
