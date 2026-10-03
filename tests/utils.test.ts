import { describe, it, expect } from "vitest";
import { inr, ms, pct, titleCase, ago } from "@/lib/utils";

describe("formatters", () => {
  it("formats INR with Indian grouping", () => { expect(inr(3499)).toBe("₹3,499"); expect(inr(1875000)).toBe("₹18,75,000"); expect(inr(null)).toBe("—"); });
  it("formats durations", () => { expect(ms(27000)).toBe("27s"); expect(ms(450)).toBe("450ms"); expect(ms(125000)).toBe("2m 5s"); expect(ms(undefined)).toBe("—"); });
  it("formats percentages and labels", () => { expect(pct(0.92)).toBe("92%"); expect(titleCase("AWAITING_APPROVAL")).toBe("Awaiting Approval"); });
  it("relative time", () => { expect(ago(new Date())).toBe("just now"); expect(ago(new Date(Date.now() - 3 * 3600_000))).toBe("3h ago"); });
});
