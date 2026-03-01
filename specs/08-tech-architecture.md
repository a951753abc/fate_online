<spec>
  <metadata>
    <id>spec-08</id>
    <title>技術架構——技術棧、同步、資訊安全、UI、NPC AI</title>
    <version>0.3.0</version>
    <dependencies>
      <dependency ref="spec-04">情報迷霧（資訊安全的核心需求來源、組內迷霧）</dependency>
      <dependency ref="spec-06">戰鬥系統（即時結算、倒計時機制、雙人操作、NPC 戰鬥 AI）</dependency>
      <dependency ref="spec-07">社交系統（通訊頻道架構、六種頻道類型、NPC 通訊）</dependency>
      <dependency ref="spec-00">彈性人數模型、NPC 設計原則</dependency>
    </dependencies>
  </metadata>

  <overview>
    技術架構設計以「情報迷霧的技術實現」為最高優先——伺服器必須嚴格控制向每位玩家發送的資訊。
    支援 4–14 位人類玩家同時在線，每位玩家有不同的資料視角（マスター vs サーヴァント），
    並支援組內情報不對稱的技術實現。
    NPC 組由伺服器端 AI 引擎驅動，行為在伺服器內部完成，不佔用 WebSocket 連線。
    採用 React + TypeScript 前端、Node.js + Express 後端、Socket.io 即時通訊、Redis + PostgreSQL 資料庫的技術棧。
  </overview>

  <design_goals>
    <goal>伺服器權威架構——所有遊戲狀態由伺服器管理，前端只負責顯示和輸入</goal>
    <goal>情報迷霧的技術保障——前端不存儲其他玩家的隱藏資料，徹底防止客戶端作弊</goal>
    <goal>4–14 人即時同步——低延遲 WebSocket 連線</goal>
    <goal>骰子公平性——所有骰定在伺服器端執行</goal>
    <goal>角色差異化 UI——マスター和サーヴァント看到不同的介面和資訊</goal>
    <goal>NPC AI 在伺服器端高效運行——不影響人類玩家的即時體驗</goal>
  </design_goals>

  <rules>
    <section id="tech-stack">
      <title>技術棧</title>
      <description>各層級的技術選型。</description>
      <details>
        | 層級 | 技術 | 說明 |
        |------|------|------|
        | 前端 | React + TypeScript | SPA 架構，組件化 UI，支援角色差異化視角 |
        | 即時通訊 | WebSocket (Socket.io) | 4–14 人即時同步，低延遲 |
        | 後端 | Node.js + Express | 遊戲邏輯、判定計算、NPC AI 引擎、資料視角管理 |
        | 資料庫 | Redis + PostgreSQL | Redis 處理即時狀態，PG 存儲歷史紀錄 |
        | 骰子引擎 | 伺服器端 PRNG | 所有骰子判定在伺服器端執行，防作弊 |
        | NPC AI 引擎 | 伺服器端狀態機 + 規則引擎 | NPC 行為決策在伺服器內部完成 |
        | 部署 | Docker + Cloud | 容器化部署，支援水平擴展 |
      </details>
    </section>

    <section id="game-room">
      <title>遊戲房間</title>
      <description>每場遊戲為一個獨立的「房間」。支援彈性人數。</description>
      <details>
        - 房間有房主
        - 房主設定遊戲參數：
          - **戰爭規格**：標準模式（7 組）[ref:spec-10, section:war-formats]
          - 回合時長、是否使用進階級別等
        - 玩家加入時選擇扮演マスター或サーヴァント
        - 最少 4 位人類玩家（2 マスター + 2 サーヴァント）即可開局
        - 不足的組數由系統自動生成 NPC 組填補 [ref:spec-00, section:player-scaling]
        - 系統隨機配對人類 Master-Servant 組合
        - 奇數玩家處理：最後一位落單玩家等待下一位加入，或房主手動決定是否開始
      </details>
    </section>

    <section id="sync">
      <title>同步機制</title>
      <description>人類玩家與伺服器的即時同步方案。NPC 由伺服器內部驅動。</description>
      <details>
        - 使用 WebSocket 維持人類玩家（4–14 位）與伺服器的即時連線
        - NPC 組**不佔用** WebSocket 連線——行為完全在伺服器端計算
        - 所有遊戲狀態由**伺服器權威**管理
        - 前端只負責顯示和輸入
        - 每個行動階段有倒計時限制，超時自動選擇「待機」
        - 斷線重連機制允許 **30 秒**內重新加入
        - マスター斷線 → 其角色由 NPC AI 暫時接管（防禦模式），從者玩家不受影響但失去マスター支援
        - サーヴァント斷線 → 其角色由 NPC AI 暫時接管（自動防禦模式）
        - 斷線玩家重連後，NPC AI 立即歸還控制權
      </details>
      <constraints>
        <constraint>所有遊戲判定必須在伺服器端完成，前端不做任何判定計算</constraint>
        <constraint>斷線超過 30 秒 → 角色由 NPC AI 接管，不會自動撤退</constraint>
        <constraint>NPC 行為的計算不得阻塞人類玩家的即時回應</constraint>
      </constraints>
    </section>

    <section id="npc-ai-architecture">
      <title>NPC AI 架構</title>
      <description>
        NPC 組的行為由三層 AI 系統驅動，全部在伺服器端運行。
      </description>
      <details>
        **三層行為架構：**

        | 層級 | 負責 | 實現方式 |
        |------|------|---------|
        | 戰略層 | 移動、佔領、目標選擇 | 狀態機（State Machine）——根據血量/魔力/情報切換模式（進攻/防守/偵查）|
        | 戰術層 | 戰鬥中的行動選擇 | 規則引擎（Rule Engine）——根據敵我數值差選擇最佳行動 [ref:spec-06, section:npc-combat] |
        | 社交層 | 結盟、背叛、通訊 | 模板系統 + 簡單策略——台詞庫 + 外交決策規則 [ref:spec-07, section:npc-communication] |

        **戰略層狀態機：**
        ```
        INIT → EXPLORE → {AGGRESSIVE / DEFENSIVE / RECON}
                              ↓           ↓          ↓
                          HP > 70%    HP < 40%    缺乏情報
                              ↓           ↓          ↓
                         攻擊最近敵人  退守靈脈  巡邏空據點
        ```
        - 狀態切換條件：HP 閾值、魔力閾值、已知敵方數量、盟友數量
        - 每夜開始時重新評估狀態

        **戰術層規則引擎：**
        - 輸入：己方數值、敵方已知數值、地形效果、可用技能列表
        - 輸出：最佳行動 + 目標選擇
        - 加入 10–15% 隨機偏差，避免完美決策暴露 NPC 身份

        **社交層模板系統：**
        - 每個英靈有 30–50 條預設台詞，分類為：挑釁/試探/回應結盟/回應威脅/日常感想
        - 外交決策基於簡單的利益計算：結盟收益 vs 背叛收益
        - 回應延遲：5–15 秒（模擬人類思考和打字時間）

        **NPC AI 的執行時序：**
        - 自由行動期開始時：戰略層決定移動目標（瞬間完成）
        - 收到私訊時：社交層生成回應（延遲 5–15 秒後發送）
        - 遭遇結算期：戰術層決定交戰/撤退（瞬間完成，但延遲到人類玩家提交後一起結算）
        - 戰鬥回合中：戰術層選擇行動（瞬間完成，延遲到倒計時結束一起結算）
      </details>
      <constraints>
        <constraint>NPC AI 的所有決策必須在 100ms 內完成——不得成為性能瓶頸</constraint>
        <constraint>NPC 的行動時序必須與人類玩家同步——不能提前或延遲結算</constraint>
        <constraint>NPC AI 引擎必須是無狀態的（state stored in Redis, engine is stateless）——方便水平擴展</constraint>
      </constraints>
    </section>

    <section id="info-security">
      <title>資訊安全——情報迷霧的技術實現</title>
      <description>
        情報迷霧機制的技術保障方案。
        伺服器嚴格控制向每位玩家發送的資訊，需管理最多 14 個獨立的資料視角。
        NPC 的資料視角在伺服器內部管理，不發送到任何客戶端。
      </description>
      <details>
        **獨立資料視角：**
        - 每位人類玩家只能收到**自己有權看到的數據** [ref:spec-04, section:visibility-levels]
        - マスター玩家看到的從者資訊取決於從者主動揭露的程度 [ref:spec-04, section:intra-pair]
        - サーヴァント玩家看到的マスター資訊同理
        - 未揭露真名的サーヴァント在前端只會顯示為「??? のセイバー」
        - 所有判定結果也只顯示玩家有權知道的部分
        - 前端**不存儲**其他玩家的隱藏資料
        - NPC 的資料同樣受情報迷霧保護——人類玩家看不到 NPC 的隱藏數值

        **組內情報的技術實現：**
        - 從者向マスター揭露資訊時，伺服器記錄揭露狀態
        - 揭露後的資訊才會包含在マスター的 payload 中
        - 從者可以「撤回」部分揭露（如謊報後更正）——伺服器更新揭露狀態
        - 系統不驗證組內溝通的真偽——從者可以說任何話

        **NPC 的情報管理：**
        - NPC 的情報狀態（已知/未知）在伺服器端以相同資料結構管理
        - NPC 與人類交戰時，情報揭露遵循相同規則（戰鬥中揭露職階技能等）
        - NPC 的隱藏資訊不因為是 AI 而額外暴露
      </details>
      <constraints>
        <constraint>伺服器發送給客戶端的 payload 必須經過情報層級過濾，不可包含任何超越該玩家情報層級的資料</constraint>
        <constraint>WebSocket 訊息必須加密傳輸（WSS）</constraint>
        <constraint>組內揭露狀態由伺服器管理——前端無法偽造揭露請求</constraint>
        <constraint>NPC 的情報 payload 不發送到任何客戶端——只在伺服器內部使用</constraint>
      </constraints>
    </section>

    <section id="dice-engine">
      <title>骰子引擎</title>
      <description>伺服器端的骰定系統。</description>
      <details>
        - 所有骰子判定在伺服器端執行
        - 使用密碼學安全的 PRNG（如 `crypto.randomBytes`）
        - 防止客戶端預測或操縱骰子結果
        - NPC 的骰子判定使用相同的 PRNG——不會被作弊
      </details>
      <constraints>
        <constraint>客戶端不可執行任何骰定——所有隨機數來源為伺服器</constraint>
      </constraints>
    </section>

    <section id="ui-overview">
      <title>前端 UI 概要</title>
      <description>マスター和サーヴァント各有差異化的 UI 配置。NPC 不需要 UI。</description>
      <details>
        **共通面板：**

        | 面板 | 說明 |
        |------|------|
        | 主畫面 | 月白町地圖（俯瞰視角），顯示據點位置、己方位置、已知的其他角色位置 |
        | 通訊面板 | 分頁式聊天（公開/組內私頻/私訊/區域），支援快速切換 [ref:spec-07, section:channels] |
        | 戰鬥介面 | 彈出式戰鬥結算面板，顯示數據 Log |
        | 戰況面板 | 側邊欄：存活者列表（不標示 NPC）、已公開戰果、當前夜數與倒計時 |

        **マスター專屬：**

        | 面板 | 說明 |
        |------|------|
        | 從者面板 | 顯示從者**已揭露**的資訊（職階 + 從者主動分享的數據）。未揭露部分顯示為「???」|
        | 令呪面板 | 令呪剩餘數、可用效果列表（強化型/覆蓋型）|
        | マスター構築面板 | 己方級別、風格、背反律資訊 |
        | 敵方情報面板 | 已偵查到的敵方サーヴァント資訊（依情報層級顯示，含 NPC サーヴァント）|

        **サーヴァント專屬：**

        | 面板 | 說明 |
        |------|------|
        | 英靈面板 | 自己的完整資料（五圍、保有スキル、宝具、真名）|
        | 聖杯願望面板 | 自己的聖杯願望內容、與マスター願望的相容性判斷（需自行推測）|
        | 揭露控制面板 | 選擇向マスター揭露哪些資訊（勾選式 UI）|
        | 敵方情報面板 | 已偵查到的敵方サーヴァント資訊（依情報層級顯示，含 NPC サーヴァント）|

        **バーサーカー專屬 UI：**
        - 文字聊天被替換為表情/指令面板
        - 表情選擇：怒/悲/喜/殺意/困惑/忠誠/拒絕
        - 指令選擇：攻擊/防禦/前進/後退/跟隨/等待
        - 戰鬥 UI 保留完整操作權，但額外顯示「暴走」選項
      </details>
    </section>
  </rules>

  <edge_cases>
    <case>人類玩家全部使用代理或 VPN 導致延遲極高 → 需要延遲補償機制或最低延遲限制</case>
    <case>房主斷線後的房間管理權轉移規則</case>
    <case>同時有多個房間時的伺服器資源分配——NPC AI 引擎的 CPU 開銷需監控</case>
    <case>マスター和サーヴァント同時斷線（同一組）→ 該組整體由 NPC AI 接管</case>
    <case>NPC 組數量較多時（如 5 組 NPC + 2 組人類），AI 計算負載是否影響性能？→ 應在 100ms 內完成所有 NPC 決策</case>
  </edge_cases>

  <open_questions>
    <question>是否需要遊戲重播（replay）功能的後端支援？需要記錄哪些粒度的事件？</question>
    <question>Redis 中的即時狀態資料結構設計——最多 7 組 × 各自的情報層級矩陣</question>
    <question>PostgreSQL 的歷史紀錄 schema 設計</question>
    <question>前端地圖的渲染方式——Canvas / SVG / DOM？</question>
    <question>從者的揭露控制 UI 的具體設計——逐項勾選？還是等級式揭露？</question>
    <question>NPC AI 引擎的具體技術選型——自研狀態機還是使用現成的 AI behavior tree 函式庫？</question>
    <question>NPC 台詞庫的存儲格式和多語言支援——JSON 台詞檔？國際化架構？</question>
    <question>斷線玩家由 NPC AI 接管時，AI 的行為模式是否應比正常 NPC 更保守？（防禦優先，避免 AI 做出玩家不希望的激進行為）</question>
  </open_questions>
</spec>
