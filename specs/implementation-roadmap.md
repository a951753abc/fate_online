# 聖杯戰爭 Online — 實作路線圖

## Phase 0 — 基礎建設 ✅ `v0.1.0` (2026-03-02)
**依據**: spec-08
- [x] Node.js + Express 伺服器 (TypeScript, ESM)
- [x] WebSocket (Socket.io) 連線 + 暱稱認證中間件
- [x] Redis + PostgreSQL 架構 (Docker Compose)
- [x] 遊戲房間（建房/加入/離開/踢人/角色分配/開始遊戲）
- [x] 伺服器端骰子引擎（crypto PRNG, rejection sampling, 2D6）
- [x] React 19 + Vite 6 前端（Lobby + Room + DiceTest）
- [x] ESLint flat config + Prettier + simple-git-hooks + lint-staged
- [x] 54 unit tests, 94% coverage (vitest + @vitest/coverage-v8)
- [x] Docker multi-stage build + Caddy reverse proxy
- [x] SQL migration runner (001_init: rooms + game_events)

**交付物**: Git commit `3e21293`, pushed to `origin/main`

## Phase 1 — 空間 + 時間 ✅ `v0.2.0` (2026-03-02)
**依據**: spec-05, spec-01
- [x] 月白町 12 據點載入（map-data.json → mapData.ts）
- [x] 鄰接關係 + 移動邏輯（BFS 距離、月白駅前 2 步、暗渠捷徑）
- [x] 地圖渲染（SVG MapView 組件：據點、連線、角色標記、佔領環、崩壞）
- [x] 夜循環系統（自由行動期 → 遭遇結算期 → 夜間結算、Night 10+ 據點崩壞、Night 14 聖杯暴走）
- [x] 佔領機制（停留=佔領、離開=失去、爭奪=無人佔領）
- [x] 起始據點自動分配 + 遭遇偵測
- [x] 魔力供給距離（計算 + 夜報告顯示）
- [x] NightHud（夜數/階段/倒數計時器）
- [x] 247 tests (139 server + 108 client), lint/format clean
- [x] dev.bat（一鍵啟動 Docker + server + client）
- [x] dev-bots.ts（N 個 bot 快速測試）

**交付物**: Git commits `c0ad56b`→`4c6f8a9`, pushed to `origin/main`

> **Phase 1 結束時**：玩家可以進房間、看地圖、移動、佔領據點。最小可互動原型。

## Phase 2 — 角色骨架

角色建立為獨立模組（`server/game/character/`），透過定義好的 IN/OUT API 與遊戲主體交互。
可用 git worktree 平行開發。

### Phase 2-1 — Master 模組 API
**依據**: spec-02
- マスター角色建立模組的 IN/OUT API 定義
- Types: MasterLevel, MasterData, StyleDefinition, EnhancementSpellType
- API: generateMaster / spendCommandSpell / useAntithesis / setGrailWish
- 情報迷霧: buildOwnMasterView / buildServantViewOfMaster
- 查詢: getAvailableLevels / getAvailableStyles
- 純函數模組，零 I/O，自帶單元測試

### Phase 2-2 — Servant 模組 API
**依據**: spec-03
- サーヴァント角色建立模組的 IN/OUT API 定義
- 七職階、五圍骰定（三步驟）、職階技能、保有スキル、宝具
- 職階隨機不重複分配
- 情報迷霧: buildOwnServantView / buildMasterViewOfServant

### Phase 2-3 — 遊戲整合
**依據**: spec-02, spec-03, spec-01
- Preparation Phase（準備階段）遊戲流程
- Redis 持久化（chardata / cmdspells）
- Socket 事件（prep:setLevel / prep:ready 等）
- Client UI（PreparationPage / CharacterPanel / PartnerPanel / CommandSpellIndicator）
- dev-bots.ts 更新

## Phase 3 — 戰鬥核心
**依據**: spec-06
- 戰鬥觸發條件（同據點遭遇）
- 基礎判定流程（攻擊/迴避/傷害）
- 雙人操作（Master + Servant 各出指令）
- 混戰支援
- HP / 戰鬥結果處理

> **Phase 3 結束時**：可跑完「移動 → 遭遇 → 戰鬥 → 勝敗」的完整 loop。**第一次 playtest**。

## Phase 4 — 通訊系統
**依據**: spec-07
- 六種通訊頻道（公開/組內/私訊/區域/陣營/系統）
- 結盟/背叛（純社交層，無系統約束）
- バーサーカー通訊限制（表情/簡單指令）

## Phase 5 — 情報迷霧
**依據**: spec-04
- 7 層可見度系統（Layer 0–6）
- 組內情報不對稱（契約感知 vs 主動揭露）
- 戰鬥中的情報揭露遞進
- 真名看破（被動戰術設定 + 戰鬥修正 +N/-2N）

> **Phase 5 結束時**：核心差異化機制上線。**第二次 playtest**。

## Phase 6 — 進階機制
**依據**: spec-02, spec-01, spec-07
- 令呪覆蓋型 + 対魔力抵抗判定
- 宝具真名解放（從者決定 / 令呪強制）
- 終局流程（最終協商 → 讓渡/主張 → 聖杯爭奪）
- 角色轉型（Master 情報商 / Servant 英靈殘響）
- 再締約

## Phase 7 — NPC AI
**依據**: spec-00
- 戰略層（狀態機：進攻/防守/偵查）
- 戰術層（規則引擎：戰鬥選擇 + 10-15% 失誤率）
- 社交層（模板對話 + 回應延遲）
- NPC 移動/佔領/結盟邏輯

> **Phase 7 結束時**：4 人即可開一場完整遊戲。**正式 playtest**。

## Phase 8 — 平衡 + 打磨
**依據**: spec-09, spec-10
- 數值平衡調整（基於 playtest 數據）
- UI/UX 打磨（角色差異化介面）
- 戰爭規格系統（標準 → 大聖杯戰爭/亞種 等擴展）

---

## 依賴鏈

```
基礎建設 ✅ → 空間+時間 ✅ → 角色 → 戰鬥 → 通訊 → 情報迷霧 → 進階機制 → NPC → 平衡
                                   ↑                ↑                       ↑
                            第一次 playtest    第二次 playtest         正式 playtest
```

## 設計原則

- **空間優先**：所有互動發生在地圖上，先建立空間才能測試其他系統
- **戰鬥先於情報迷霧**：情報迷霧是戰鬥的附加層，沒有戰鬥就無法驗證
- **NPC 放最後**：開發期間可 14 人全人類測試，NPC 是讓 4 人也能玩的補完
- **三次 playtest 節點**：Phase 3 / 5 / 7 各有一次，逐步驗證
