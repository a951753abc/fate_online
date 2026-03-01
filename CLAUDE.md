# 聖杯戦争 ONLINE — 專案上下文

## 專案身份

《聖杯戰爭 Online》是一款**彈性人數即時對戰 Web Game**（最多 14 人 / 7 マスター + 7 サーヴァント，最少 4 人 / 2 組人類），以 Fate/stay night 的聖杯戰爭為主題，結合千夜月姬 TRPG 規則系統。マスター與サーヴァント由不同人類玩家扮演，不足的組數由 NPC 整組填補。在月白町展開「雙層博弈」——外層是各組之間的聖杯戰爭，內層是每對 Master-Servant 之間的信任與衝突。

## 核心設計原則

1. **情報迷霧為核心**：玩家不知道對手サーヴァント的真名、宝具效果、詳細數值，必須透過偵查與交戰逐步揭露
2. **自由結盟與背叛**：沒有系統約束，純靠玩家之間的信任與謊言（含組內背叛）
3. **Master-Servant 雙層博弈**：雙方各有獨立的聖杯願望，組內情報不自動共享，令呪是覆蓋從者意志的社交核武
4. **失去搭檔不等於出局**：マスター可轉型為情報商/內應；サーヴァント以英靈殘響模式留在遊戲中
5. **TRPG 骰運**：底層使用千夜月姬 TRPG 的判定系統，戰鬥充滿不確定性
6. **夜循環制**：遊戲以「夜」為回合單位，每夜含自由行動期與遭遇結算期，單場約 60–90 分鐘
7. **彈性人數 + NPC 填補**：4 人即可開戰，NPC 組（中等 AI）填補空缺，系統不標示 NPC 身份

## 語言慣例

- **遊戲內容 / spec 文件**：繁體中文為主，遊戲術語使用日文原文（マスター、サーヴァント、宝具、令呪 等）
- **技術文件 / 程式碼**：英文變數名、註解可繁中或英文
- **Fate/TYPE-MOON 術語**：參照 `specs/glossary.md`

## 模組索引

| Spec ID | 檔案 | 系統 |
|---------|------|------|
| — | [`specs/glossary.md`](specs/glossary.md) | Fate/TYPE-MOON 用語集 |
| spec-00 | [`specs/00-overview.md`](specs/00-overview.md) | 遊戲概念、彈性人數模型、NPC 設計原則、雙層博弈、核心體驗、設計決策 |
| spec-01 | [`specs/01-game-flow.md`](specs/01-game-flow.md) | 遊戲階段、NPC 初始化、夜循環、勝利條件（含願望歸屬、NPC 勝利情況） |
| spec-02 | [`specs/02-master.md`](specs/02-master.md) | マスター級別、風格/背反律、令呪（強化型+覆蓋型）、聖杯願望 |
| spec-03 | [`specs/03-servant.md`](specs/03-servant.md) | サーヴァント玩家角色、職階、五圍骰定、技能、宝具、聖杯願望、狂職體驗 |
| spec-04 | [`specs/04-info-fog.md`](specs/04-info-fog.md) | 情報迷霧系統（跨模組）、組內情報不對稱 |
| spec-05 | [`specs/05-map.md`](specs/05-map.md) | 月白町 12 據點、獨立移動、佔領、魔力供給距離、NPC 移動 |
| spec-06 | [`specs/06-combat.md`](specs/06-combat.md) | 戰鬥觸發、雙人操作、宝具決定權、判定、混戰、NPC 戰鬥 AI |
| spec-07 | [`specs/07-social.md`](specs/07-social.md) | 六種通訊頻道、NPC 通訊行為、結盟/背叛（含組內）、角色轉型、再締約 |
| spec-08 | [`specs/08-tech-architecture.md`](specs/08-tech-architecture.md) | 技術棧、彈性人數同步、NPC AI 三層架構、資訊安全、角色差異化 UI |
| spec-09 | [`specs/09-balance.md`](specs/09-balance.md) | 數值平衡、願望衝突率、NPC 難度平衡、節奏控制 |
| spec-10 | [`specs/10-future.md`](specs/10-future.md) | 戰爭規格系統（標準/大聖杯戰爭/亞種）、未來擴展規劃 |

## 跨模組依賴圖

```
glossary ←──────────────────────── 所有 spec 皆參照
spec-00 (overview / 彈性人數 + NPC + 雙層博弈)
  ├── spec-01 (game-flow / 勝利條件 + 願望歸屬 + NPC 初始化)
  ├── spec-02 (master / 令呪覆蓋型 + 聖杯願望)
  │     └── spec-06 (combat)
  ├── spec-03 (servant / 玩家角色 + 聖杯願望 + 狂職)
  │     ├── spec-06 (combat / 雙人操作 + NPC 戰鬥 AI)
  │     └── spec-04 (info-fog / 組內迷霧)
  ├── spec-05 (map / 獨立移動 + 魔力距離 + NPC 移動)
  │     ├── spec-06 (combat)
  │     └── spec-04 (info-fog)
  ├── spec-04 (info-fog) ← 跨切面：影響 combat, map, social, tech
  ├── spec-06 (combat / 宝具決定權 + NPC 戰鬥行為)
  │     └── spec-09 (balance)
  ├── spec-07 (social / 六頻道 + NPC 通訊 + 組內背叛 + 再締約)
  ├── spec-08 (tech-architecture / NPC AI 三層架構) ← 依賴所有系統 spec
  ├── spec-09 (balance / 願望衝突率 + NPC 難度)
  └── spec-10 (future / 戰爭規格系統)
```

## 技術棧

| 層級 | 技術 |
|------|------|
| 前端 | React + TypeScript (SPA) |
| 即時通訊 | WebSocket (Socket.io) |
| 後端 | Node.js + Express |
| 資料庫 | Redis（即時狀態）+ PostgreSQL（歷史紀錄）|
| 骰子引擎 | 伺服器端 PRNG |
| NPC AI | 伺服器端狀態機 + 規則引擎 + 模板系統 |
| 部署 | Docker + Cloud |

## 共通慣例

### Spec 檔案格式

所有 spec 使用 Markdown + XML tags 結構化。跨模組引用語法：`[ref:spec-XX, section:section-id]`

### 程式碼慣例

- **Immutability**：永遠建立新物件，不可修改既有物件
- **Commit format**：`<type>: <description>`（feat / fix / refactor / docs / test / chore / perf / ci）

## Development

### Setup

```bash
npm run install:all
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d redis postgres
npm run db:migrate
```

### Dev Servers

```bash
npm run dev          # server :3000 (tsx watch)
npm run client:dev   # vite :5173 (proxy to :3000)
```

### Quality Checks

```bash
npm run lint         # ESLint
npm run lint:fix     # ESLint auto-fix
npm run format:check # Prettier check
npm run format       # Prettier auto-format
npm test             # unit tests (vitest)
npm run test:coverage # tests + v8 coverage report
npm run test:all     # server + client tests
```

### Coverage Thresholds

| Metric | Threshold |
|--------|-----------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

### Pre-commit Hooks

`simple-git-hooks` + `lint-staged` — auto-runs ESLint + Prettier on staged files.

### Production Deploy (Ubuntu 24)

```bash
docker compose up --build
```
