import { describe, it, expect } from "vitest";
import RollTracker from "../src/services/RollTracker.js";

describe("Histogram Math", () => {
  it("should return empty array for empty rolls", () => {
    expect(RollTracker.getHistogramData([])).toEqual([]);
    expect(RollTracker.getHistogramData([0])).toEqual([]);
  });

  it("should calculate correct percentage heights normalized to maximum count", () => {
    // 20 faces, face 1 has 5, face 20 has 10 (the max)
    const rolls = new Array(21).fill(0);
    rolls[1] = 5;
    rolls[20] = 10;

    const data = RollTracker.getHistogramData(rolls);
    expect(data.length).toBe(20);

    // Face 1: 5 / 10 = 50%
    expect(data[0]).toEqual({
      face: 1,
      count: 5,
      height: 50
    });

    // Face 2: 0 / 10 = 0%
    expect(data[1]).toEqual({
      face: 2,
      count: 0,
      height: 0
    });

    // Face 20: 10 / 10 = 100%
    expect(data[19]).toEqual({
      face: 20,
      count: 10,
      height: 100
    });
  });
});
