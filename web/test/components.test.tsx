import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "@/components/catalog/empty-state";
import { NoteIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

describe("Button", () => {
  it("renders and handles clicks", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Play now</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Play now" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("spawns a ripple element on click", () => {
    render(<Button>Ripple</Button>);
    const button = screen.getByRole("button", { name: "Ripple" });
    fireEvent.click(button);
    expect(button.querySelectorAll("span").length).toBeGreaterThan(0);
  });

  it("respects disabled", () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Nope
      </Button>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Nope" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders as child element with asChild", () => {
    render(
      <Button asChild>
        <a href="/home">Go home</a>
      </Button>,
    );
    expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute("href", "/home");
  });
});

describe("EmptyState", () => {
  it("shows title, description and action", () => {
    render(
      <EmptyState
        icon={<NoteIcon />}
        title="Nothing here"
        description="Try adding something."
        action={<button>Add</button>}
      />,
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.getByText("Try adding something.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });
});

describe("Skeleton", () => {
  it("is hidden from assistive tech", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});
