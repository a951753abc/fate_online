import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MasterCreation } from "../MasterCreation.js";
import type {
  PrepConfig,
  PrepSubmitPayload,
  PrepResultPayload,
  PrepStatePayload,
} from "../../../types/protocol.js";

const mockPrepConfig: PrepConfig = {
  startingPoints: 3,
  gameLevel: 4,
  maxClasses: 3,
  availableLevels: [
    { id: "magician", nameJa: "魔術師", baseStats: { body: 2, perception: 2, reason: 5, will: 3 } },
    { id: "executor", nameJa: "代行者", baseStats: { body: 3, perception: 3, reason: 3, will: 3 } },
    { id: "fighter", nameJa: "格闘家", baseStats: { body: 5, perception: 3, reason: 1, will: 3 } },
  ],
  classSkills: {},
  classAcquisitions: [
    { classId: "magician", initialSteps: [], perLevelUpCount: 0, bonusLevels: [] },
    { classId: "executor", initialSteps: [], perLevelUpCount: 0, bonusLevels: [] },
    { classId: "fighter", initialSteps: [], perLevelUpCount: 0, bonusLevels: [] },
  ],
};

const mockPrepState: PrepStatePayload = {
  players: [
    { characterId: "m0", role: "master", status: "pending" },
    { characterId: "m1", role: "master", status: "pending" },
    { characterId: "s0", role: "servant", status: "ready" },
  ],
};

const mockStats: NonNullable<PrepResultPayload["stats"]> = {
  baseAbilities: { body: 5, perception: 5, reason: 8, will: 6 },
  bonuses: { body: 1, perception: 1, reason: 2, will: 2 },
  baseCombat: { melee: 2, ranged: 2, spirit: 4, action: 2, hp: 3, focus: 4, defense: 0 },
  levelModifiers: { melee: 0, ranged: 0, spirit: 2, action: 0, hp: 0, focus: 2, defense: 0 },
  finalCombat: { melee: 2, ranged: 2, spirit: 6, action: 2, hp: 3, focus: 6, defense: 0 },
};

const readyPrepState: PrepStatePayload = {
  players: [
    { characterId: "m0", role: "master", status: "ready" },
    { characterId: "m1", role: "master", status: "pending" },
    { characterId: "s0", role: "servant", status: "ready" },
  ],
};

function renderMasterCreation(overrides: Partial<Parameters<typeof MasterCreation>[0]> = {}) {
  const defaultProps = {
    prepConfig: mockPrepConfig,
    prepState: null as PrepStatePayload | null,
    buildResult: null as PrepResultPayload | null,
    myCharacterId: "m0",
    myRole: "master" as const,
    onSubmit: vi.fn(),
    onReady: vi.fn(),
    ...overrides,
  };
  return { ...render(<MasterCreation {...defaultProps} />), props: defaultProps };
}

/** Helper: complete step 1 with magician LV3 */
function completeStep1() {
  fireEvent.click(screen.getByText("魔術師"));
  const plusButton = screen.getByRole("button", { name: "+" });
  fireEvent.click(plusButton); // LV2
  fireEvent.click(plusButton); // LV3
  fireEvent.click(screen.getByText("確認起始能力"));
}

describe("MasterCreation", () => {
  describe("Servant waiting view", () => {
    it("shows waiting message for Servant role", () => {
      renderMasterCreation({ myRole: "servant" });
      expect(screen.getByText("準備階段")).toBeInTheDocument();
      expect(
        screen.getByText("サーヴァント角色系統尚未開放，請等待マスター完成創角。"),
      ).toBeInTheDocument();
    });

    it("does not show level selection for Servant", () => {
      renderMasterCreation({ myRole: "servant" });
      expect(screen.queryByText("マスター創角")).not.toBeInTheDocument();
    });

    it("shows prep status for Servant when available", () => {
      renderMasterCreation({ myRole: "servant", prepState: mockPrepState });
      expect(screen.getByText("準備狀態")).toBeInTheDocument();
    });
  });

  describe("Step 1 — starting allocation", () => {
    it("renders header and step indicator", () => {
      renderMasterCreation();
      expect(screen.getByText("マスター創角")).toBeInTheDocument();
      expect(screen.getByText(/起始配點（3 等）/)).toBeInTheDocument();
    });

    it("renders all available level cards", () => {
      renderMasterCreation();
      expect(screen.getByText("魔術師")).toBeInTheDocument();
      expect(screen.getByText("代行者")).toBeInTheDocument();
      expect(screen.getByText("格闘家")).toBeInTheDocument();
    });

    it("selects and deselects a level", () => {
      renderMasterCreation();
      const magicianButton = screen.getByText("魔術師").closest("button")!;
      fireEvent.click(magicianButton);
      expect(screen.getByText(/級別選擇（1\/3）/)).toBeInTheDocument();

      fireEvent.click(magicianButton);
      expect(screen.getByText(/級別選擇（0\/3）/)).toBeInTheDocument();
    });

    it("shows allocation with remaining points based on startingPoints", () => {
      renderMasterCreation();
      fireEvent.click(screen.getByText("魔術師"));
      // startingPoints=3, allocated=1, remaining=2
      expect(screen.getByText(/剩餘 2 點/)).toBeInTheDocument();
    });

    it("adjusts level with +/- buttons", () => {
      renderMasterCreation();
      fireEvent.click(screen.getByText("魔術師"));

      const plusButton = screen.getByRole("button", { name: "+" });
      fireEvent.click(plusButton);
      expect(screen.getByText("LV2")).toBeInTheDocument();
      expect(screen.getByText(/剩餘 1 點/)).toBeInTheDocument();

      fireEvent.click(plusButton);
      expect(screen.getByText("LV3")).toBeInTheDocument();
      expect(screen.getByText(/剩餘 0 點/)).toBeInTheDocument();
    });

    it("shows free point selection", () => {
      renderMasterCreation();
      fireEvent.click(screen.getByText("魔術師"));
      expect(screen.getByText("自由配點（+1）")).toBeInTheDocument();
    });

    it("confirm button is disabled when remaining > 0", () => {
      renderMasterCreation();
      fireEvent.click(screen.getByText("魔術師"));
      expect(screen.getByText("確認起始能力")).toBeDisabled();
    });

    it("confirm button is enabled when remaining = 0", () => {
      renderMasterCreation();
      fireEvent.click(screen.getByText("魔術師"));
      const plusButton = screen.getByRole("button", { name: "+" });
      fireEvent.click(plusButton); // LV2
      fireEvent.click(plusButton); // LV3
      expect(screen.getByText("確認起始能力")).not.toBeDisabled();
    });
  });

  describe("Step 2 — upgrade", () => {
    it("transitions to step 2 on confirm", () => {
      renderMasterCreation();
      completeStep1();
      expect(screen.getByText(/升級（\+1）/)).toBeInTheDocument();
    });

    it("shows upgrade selection with existing and new classes", () => {
      renderMasterCreation();
      completeStep1();
      expect(screen.getByText(/選擇升級/)).toBeInTheDocument();
      // Existing: 魔術師 (LV3 → LV4)
      expect(screen.getByText(/LV3 → LV4/)).toBeInTheDocument();
      // New: 代行者, 格闘家 (新規 LV1)
      expect(screen.getAllByText(/新規 LV1/)).toHaveLength(2);
    });

    it("shows final allocation summary", () => {
      renderMasterCreation();
      completeStep1();
      expect(screen.getByText("最終等級配置")).toBeInTheDocument();
    });

    it("upgrade existing class: +1 to selected", () => {
      renderMasterCreation();
      completeStep1();
      // Click magician to upgrade LV3 → LV4
      fireEvent.click(screen.getByText(/LV3 → LV4/).closest("button")!);
      // Remaining should now be 0, advance to skills enabled
      expect(screen.getByText("下一步：技能選擇")).not.toBeDisabled();
    });

    it("upgrade new class: add at LV1", () => {
      renderMasterCreation();
      completeStep1();
      // Click 代行者 (new class)
      const newButtons = screen.getAllByText(/新規 LV1/);
      fireEvent.click(newButtons[0].closest("button")!);
      expect(screen.getByText("下一步：技能選擇")).not.toBeDisabled();
    });

    it("submits combined allocation (starting + upgrade)", () => {
      const { props } = renderMasterCreation();
      completeStep1();
      // Upgrade magician → LV4
      fireEvent.click(screen.getByText(/LV3 → LV4/).closest("button")!);
      // Advance to step 3 (skills)
      fireEvent.click(screen.getByText("下一步：技能選擇"));
      // With 0-skill acquisitions, submit is immediately available
      fireEvent.click(screen.getByText("送出"));

      expect(props.onSubmit).toHaveBeenCalledWith({
        allocation: [{ levelId: "magician", level: 4 }],
        freePoint: "body",
        skillSelections: [{ classId: "magician", classLevel: 4, selectedSkillIds: [] }],
      } satisfies PrepSubmitPayload);
    });

    it("submits with new class upgrade", () => {
      const { props } = renderMasterCreation();
      completeStep1();
      // Add 代行者 as new class
      const newButtons = screen.getAllByText(/新規 LV1/);
      fireEvent.click(newButtons[0].closest("button")!);
      // Advance to step 3 (skills)
      fireEvent.click(screen.getByText("下一步：技能選擇"));
      fireEvent.click(screen.getByText("送出"));

      expect(props.onSubmit).toHaveBeenCalledWith({
        allocation: [
          { levelId: "magician", level: 3 },
          { levelId: "executor", level: 1 },
        ],
        freePoint: "body",
        skillSelections: [
          { classId: "magician", classLevel: 3, selectedSkillIds: [] },
          { classId: "executor", classLevel: 1, selectedSkillIds: [] },
        ],
      } satisfies PrepSubmitPayload);
    });

    it("reset returns to step 1", () => {
      renderMasterCreation();
      completeStep1();
      fireEvent.click(screen.getByText("重新選擇"));
      expect(screen.getByText(/起始配點（3 等）/)).toBeInTheDocument();
    });

    it("advance to skills is disabled until upgrade is chosen", () => {
      renderMasterCreation();
      completeStep1();
      expect(screen.getByText("下一步：技能選擇")).toBeDisabled();
    });

    it("level cards are locked in step 2", () => {
      renderMasterCreation();
      completeStep1();
      // The step 1 class selection buttons should be disabled
      const cards = screen.getAllByText("魔術師");
      // First is in the class selection grid (disabled)
      const cardButton = cards[0].closest("button");
      expect(cardButton).toBeDisabled();
    });
  });

  describe("Build result + ready", () => {
    it("shows error when build fails", () => {
      renderMasterCreation({
        buildResult: { success: false, error: "等級總和必須為 4" },
      });
      expect(screen.getByText("等級總和必須為 4")).toBeInTheDocument();
    });

    it("shows stats panel on success", () => {
      renderMasterCreation({
        buildResult: { success: true, stats: mockStats },
      });
      expect(screen.getByText("數值計算結果")).toBeInTheDocument();
    });

    it("shows ready button after successful build", () => {
      renderMasterCreation({
        buildResult: { success: true, stats: mockStats },
      });
      expect(screen.getByText("確認就緒")).toBeInTheDocument();
    });

    it("calls onReady when ready button is clicked", () => {
      const { props } = renderMasterCreation({
        buildResult: { success: true, stats: mockStats },
      });
      fireEvent.click(screen.getByText("確認就緒"));
      expect(props.onReady).toHaveBeenCalledOnce();
    });

    it("shows waiting message when server confirms ready", () => {
      renderMasterCreation({
        buildResult: { success: true, stats: mockStats },
        prepState: readyPrepState,
      });
      expect(screen.getByText("已就緒，等待其他玩家...")).toBeInTheDocument();
    });

    it("hides ready button when server confirms ready", () => {
      renderMasterCreation({
        buildResult: { success: true, stats: mockStats },
        prepState: readyPrepState,
      });
      expect(screen.queryByText("確認就緒")).not.toBeInTheDocument();
    });
  });

  describe("Prep status list", () => {
    it("shows prep state when available", () => {
      renderMasterCreation({ prepState: mockPrepState });
      expect(screen.getByText("準備狀態")).toBeInTheDocument();
    });

    it("shows only Master players in status list", () => {
      renderMasterCreation({ prepState: mockPrepState });
      const badges = screen.getAllByText(/未提交/);
      expect(badges).toHaveLength(2);
    });

    it("does not show prep state when null", () => {
      renderMasterCreation({ prepState: null });
      expect(screen.queryByText("準備狀態")).not.toBeInTheDocument();
    });
  });
});
