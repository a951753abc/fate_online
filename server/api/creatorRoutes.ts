import type { Request, Response } from "express";
import type {
  LevelAllocation,
  AbilityStatKey,
  LevelConfig,
} from "../game/character/masterTypes.js";
import type { PrepSubmitPayload } from "../shared/protocol.js";
import { PREP_CONFIG } from "../game/prepConfig.js";
import { validateAndComputeBuild } from "../game/prepValidation.js";

interface CreatorSubmitBody extends PrepSubmitPayload {
  readonly config?: LevelConfig;
}

export function creatorConfigHandler(_req: Request, res: Response): void {
  res.json(PREP_CONFIG);
}

export function creatorSubmitHandler(req: Request, res: Response): void {
  const body = req.body as CreatorSubmitBody;

  if (!body.allocation || !body.freePoint || !body.skillSelections) {
    res.status(400).json({ success: false, error: "缺少必要欄位" });
    return;
  }

  const result = validateAndComputeBuild(
    body.allocation as unknown as readonly LevelAllocation[],
    body.freePoint as AbilityStatKey,
    body.skillSelections,
    body.config,
  );

  const statusCode = result.success ? 200 : 422;
  res.status(statusCode).json(result);
}
