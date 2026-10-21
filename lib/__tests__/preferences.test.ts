import { beforeEach, describe, expect, it } from "vitest";
import { mockStore } from "@/lib/mock-data/mock-store";
import { getPreferences } from "../preferences";
import { collectUserData } from "../account-data";
import { updateSalaryCurrency, updateWeeklyGoal } from "@/app/actions/preferences";

// Without DATABASE_URL these run against the mock store, as the guest demo does.
describe("preferences (mock store)", () => {
  beforeEach(() => {
    mockStore.reset();
  });

  it("starts empty and stores each field independently", async () => {
    expect(await getPreferences("mock-dev-user")).toEqual({
      weeklyApplicationGoal: null,
      salaryCurrency: null,
    });

    expect(await updateWeeklyGoal(12)).toMatchObject({ ok: true });
    expect(await updateSalaryCurrency("ILS")).toMatchObject({ ok: true });
    expect(await getPreferences("mock-dev-user")).toEqual({
      weeklyApplicationGoal: 12,
      salaryCurrency: "ILS",
    });

    await updateWeeklyGoal(null);
    expect((await getPreferences("mock-dev-user")).weeklyApplicationGoal).toBeNull();
  });

  it("rejects out-of-range goals and unknown currencies", async () => {
    for (const goal of [0, 201, 2.5, -3]) {
      expect(await updateWeeklyGoal(goal)).toMatchObject({ ok: false });
    }
    expect(await updateSalaryCurrency("XYZ")).toMatchObject({ ok: false });
    expect(await getPreferences("mock-dev-user")).toEqual({
      weeklyApplicationGoal: null,
      salaryCurrency: null,
    });
  });

  it("is removed with the owner's data and included in exports", async () => {
    mockStore.setPreferences("guest-1", { weeklyApplicationGoal: 5 });
    expect(mockStore.exportUserData("guest-1").preferences).toEqual({
      weeklyApplicationGoal: 5,
      salaryCurrency: null,
    });
    mockStore.deleteOwnerData("guest-1");
    expect(mockStore.getPreferences("guest-1")).toBeNull();
  });
});

describe("account data export", () => {
  beforeEach(() => {
    mockStore.reset();
  });

  it("includes the user's preferences", async () => {
    await updateWeeklyGoal(8);
    expect((await collectUserData("mock-dev-user")).preferences).toEqual({
      weeklyApplicationGoal: 8,
      salaryCurrency: null,
    });
  });
});
