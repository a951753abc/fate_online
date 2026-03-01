<spec>
  <metadata>
    <id>spec-06</id>
    <title>戰鬥系統——觸發、回合、判定、混戰</title>
    <version>0.3.0</version>
    <dependencies>
      <dependency ref="spec-02">マスター級別與令呪（Master 參戰、令呪強化與覆蓋）</dependency>
      <dependency ref="spec-03">サーヴァント五圍、職階技能、保有スキル、宝具（從者玩家操作）</dependency>
      <dependency ref="spec-05">據點地形效果與遭遇觸發</dependency>
      <dependency ref="spec-00">NPC 設計原則（戰術層級行為）</dependency>
    </dependencies>
  </metadata>

  <overview>
    戰鬥採用千夜月姬 TRPG 的行動點制度，適配為即時數據結算模式。
    在 7+7 制下，マスター玩家和サーヴァント玩家**同時但獨立**選擇行動——
    マスター負責戰略層面（令呪、建議、自身參戰），サーヴァント負責戰術執行（攻擊、技能、宝具）。
    NPC 組的戰鬥行動由規則引擎自動決定，遵循與人類組完全相同的戰鬥規則。
    支援多人混戰，以及マスター/サーヴァント單獨遭遇的場景。
  </overview>

  <design_goals>
    <goal>純數據結算——快速顯示結果，不拖慢遊戲節奏</goal>
    <goal>策略深度——行動選擇、目標選擇、技能時機的決策空間</goal>
    <goal>混戰的囚徒困境——多方交戰時自然形成臨時攻守關係</goal>
    <goal>マスター參戰為高風險高回報的選項——不只是看サーヴァント打</goal>
    <goal>Master-Servant 雙人協作——戰鬥中的配合（或不配合）體現組內關係</goal>
    <goal>NPC 戰鬥行為像「中等水準的玩家」——不做明顯愚蠢的事，但也不完美</goal>
  </design_goals>

  <rules>
    <section id="trigger">
      <title>戰鬥觸發</title>
      <description>遭遇結算期自動觸發的戰鬥判定。人類組和 NPC 組遵循相同的觸發規則。</description>
      <details>
        - 所有位於同一據點的**敵對角色**（マスター或サーヴァント，非同組/盟友，含 NPC）之間觸發遭遇判定
        - 每位玩家可選擇「**交戰**」或「**嘗試撤退**」
        - NPC 根據戰術 AI 自動選擇（見 NPC 戰鬥行為 section）
        - 只要有**任何一方**選擇交戰，戰鬥就會開始
        - 撤退需要通過**敏捷/行動對抗判定**，失敗則被強制拉入戰鬥

        **分頭行動時的遭遇場景：**
        - サーヴァント單獨遭遇敵方 → 從者玩家自行決定交戰或撤退，マスター不在場無法干預（也無法使用強化型令呪）
        - マスター單獨遭遇敵方 → 極度危險，マスター戰力遠低於サーヴァント
        - 同組的マスター和サーヴァント在同一據點 → 正常的組隊戰鬥
      </details>
      <constraints>
        <constraint>教會前三夜不可觸發戰鬥 [ref:spec-05, section:strongholds]</constraint>
        <constraint>盟友判定為純社交層面——系統不追蹤同盟關係，玩家可隨時對「盟友」開戰</constraint>
        <constraint>令呪的空間跳躍（二枚）可在自由行動期使用，將從者傳送到マスター身邊（或反向）以應對緊急遭遇</constraint>
      </constraints>
    </section>

    <section id="round-structure">
      <title>回合結構</title>
      <description>每個戰鬥回合的四階段流程。マスター和サーヴァント同時但獨立操作。</description>
      <details>
        **1. 準備階段**
        - マスター玩家：選擇マスター側準備動作（強化魔術、結界、偵查等）
        - サーヴァント玩家：選擇サーヴァント側準備動作（架式、強化、技能準備等）
        - 雙方**同時**操作，各自 **10 秒**時間選擇
        - マスター可透過組內私頻向從者發送戰術建議（從者可無視）
        - NPC 組的選擇由規則引擎瞬間完成（但系統延遲到時限結束才一起結算，不暴露 NPC 身份）

        **2. 行動階段**
        - 按照行動點從高到低排序（所有參戰角色，包括マスター和サーヴァント）
        - マスター玩家選擇マスター的行動 + 目標
        - サーヴァント玩家選擇サーヴァント的行動 + 目標
        - 雙方**同時且獨立**選擇，各自 **8 秒**時間
        - 系統自動進行判定並即時顯示結果
        - 從者可以無視マスター的戰術建議——除非マスター使用令呪強制

        **3. 中斷（割り込み）**
        - 部分技能分類為「中斷」
        - 可在非自己的行動時機發動
        - 用於反擊、防禦或特殊干涉

        **4. 結算階段**
        - 計算所有傷害、狀態效果
        - 更新 HP / TP / 行動點
        - 系統以數據 Log 形式展示本回合所有事件
      </details>
      <constraints>
        <constraint>超時未選擇行動 → 自動選擇「待機」[ref:spec-08, section:sync]</constraint>
      </constraints>
    </section>

    <section id="actions">
      <title>可選行動</title>
      <description>戰鬥中可選擇的行動類型，依角色類別分類。人類組和 NPC 組使用完全相同的行動列表。</description>
      <details>
        **サーヴァント行動（由從者玩家選擇 / NPC 自動選擇）：**

        | 行動 | 類型 | 說明 |
        |------|------|------|
        | 近戰攻擊 | 攻擊 | 使用近戰判定值進行攻擊，傷害受筋力加成 |
        | 射擊攻擊 | 攻擊 | 使用射擊判定值進行遠程攻擊 |
        | 精神攻擊 | 攻擊 | 使用精神判定值進行魔術/精神攻擊 |
        | 防禦 | 防禦 | 使用防禦點減少受到的傷害 |
        | 迴避 | 防禦 | 使用行動判定進行迴避，完全躲開攻擊 |
        | 使用保有スキル | 特殊 | 使用保有スキル [ref:spec-03, section:personal-skills] |
        | 宝具解放 | 特殊 | **從者玩家決定**宣告或不宣告真名 [ref:spec-03, section:noble-phantasm] |
        | 撤退 | 移動 | 嘗試脫離戰鬥（行動對抗判定）|

        **マスター行動（由マスター玩家選擇 / NPC 自動選擇）：**

        | 行動 | 類型 | 說明 |
        |------|------|------|
        | 令呪（強化型）| 特殊 | 強化サーヴァント判定/傳送/極限突破 [ref:spec-02, section:command-spells] |
        | 令呪（覆蓋型）| 特殊 | 強制從者執行指定行動 [ref:spec-02, section:command-spells] |
        | 使用級別特技 | 特殊 | 使用マスター級別特技（偵查、支援魔術等）[ref:spec-02, section:levels] |
        | 背反律 | 特殊 | 發動一次性的風格能力 [ref:spec-02, section:style] |
        | 直接參戰 | 攻擊 | マスター親自參與近距離戰鬥（高風險）[ref:spec-06, section:master-combat] |
        | 撤退 | 移動 | マスター嘗試脫離戰鬥（行動對抗判定）|
        | 戰術建議 | 社交 | 向從者發送建議（非強制，不消耗行動）|
      </details>
    </section>

    <section id="npc-combat">
      <title>NPC 戰鬥行為</title>
      <description>
        NPC 組在戰鬥中的行動選擇由規則引擎決定，目標是模擬「中等水準的玩家」。
      </description>
      <details>
        **遭遇判定（交戰/撤退）：**

        | 情況 | NPC 傾向 |
        |------|---------|
        | 數值優勢（己方強於對方）| 交戰（90%）|
        | 數值劣勢（己方弱於對方）| 撤退（70%）|
        | 數值接近 | 根據性格參數決定（進攻型/防守型）|
        | HP 低於 30% | 撤退（85%）|
        | 己方マスター不在場 | 撤退傾向 +20% |
        | 混戰（3 方以上）| 觀望，優先攻擊最弱目標 |

        **戰鬥中的行動選擇：**
        - NPC サーヴァント根據敵我數值差選擇最佳行動
        - 優先使用高倍率的攻擊方式（近戰/射擊/精神取最高判定值）
        - 保有スキル在有利時機使用（HP 高於 50% 時進攻型技能，HP 低時防禦型技能）
        - 宝具解放：NPC 在勝算較低時或有決定性優勢時使用真名解放
        - NPC マスター根據局勢使用令呪強化（但**不使用覆蓋型**——NPC 組由同一 AI 控制，無組內意志衝突）
        - 覆蓋型令呪的対魔力抵抗判定僅適用於人類組（マスター與サーヴァント皆為人類玩家的情況）[ref:spec-02, section:command-spells]

        **NPC 的「不完美」：**
        - NPC 有 10–15% 的機率做出次優選擇（模擬人類失誤）
        - NPC 不會完美預判對手行動——不做「讀心」式反應
        - NPC 在混戰中可能選錯目標（非最優解）
      </details>
      <constraints>
        <constraint>NPC 使用與人類完全相同的行動列表和判定規則——沒有特殊能力或限制</constraint>
        <constraint>NPC 的行動選擇在伺服器端完成，結果與人類玩家在同一時點結算</constraint>
        <constraint>NPC 的「次優選擇」機率為可調參數，用於難度平衡</constraint>
      </constraints>
    </section>

    <section id="noble-phantasm-decision">
      <title>宝具真名解放的決定權</title>
      <description>
        宝具真名解放是戰鬥中最具戲劇性的時刻，決定權歸屬是 Master-Servant 內層博弈的焦點。
        NPC 組的宝具決定由 AI 自動執行。
      </description>
      <details>
        **人類組：**
        - **從者玩家決定**是否解放宝具真名
        - マスター可以透過戰術建議「請求」從者解放或不解放
        - 如果從者拒絕，マスター可以：
          - 消耗 1 枚令呪**強制解放**（覆蓋從者意志，宝具全力發動 + 真名暴露）
          - 消耗 1 枚令呪**禁止解放**（阻止從者在本次戰鬥中使用真名解放）
        - 這是 Master-Servant 之間**最大的張力點**——令呪的使用直接影響雙方的信任關係

        **NPC 組：**
        - NPC サーヴァント在勝算低於 40% 或有決定性優勢（可一擊殲滅）時使用真名解放
        - NPC 不會為了隱藏真名而故意不使用宝具（但也不會每場都用）
      </details>
    </section>

    <section id="resolution">
      <title>判定規則</title>
      <description>千夜月姬 TRPG 的達成值對抗系統。人類組和 NPC 組使用完全相同的判定規則。</description>
      <details>
        **命中判定**：
        - 攻擊方命中達成值 = 2D6 + 對應判定修正 + 能力加成 + 真名看破修正
        - 防禦方迴避達成值 = 2D6 + 行動修正 + 幸運加成 + 真名看破修正
        - 攻擊方達成值 **≥** 防禦方 → 命中

        **真名看破修正** [ref:spec-04, section:true-name-identification]：
        - 對該敵方サーヴァント的真名預判正確 → 全判定 **+N**
        - 預判錯誤 → 全判定 **-2N**（懲罰為獎勵的兩倍）
        - 未設定預判 → ±0

        **傷害計算**：
        - 實際傷害 = 基礎傷害 + 武器/技能傷害 + 筋力加成 - 防禦點
        - 從 HP 中扣除

        **消滅判定**：
        - HP 歸零的サーヴァント即被消滅
        - 擁有「戦闘続行」的サーヴァント可延續 1 回合 [ref:spec-03, section:class-skills]
      </details>
    </section>

    <section id="melee">
      <title>多人混戰規則</title>
      <description>三方以上在同一據點交戰時的混戰模式。</description>
      <details>
        - 所有參戰方（人類 + NPC）在行動階段**同時**選擇行動和目標
        - 按行動點從高到低依序結算
        - 創造囚徒困境——多方會自然形成臨時攻守關係

        **混戰特殊規則**：
        - 區域攻擊技能可以同時命中多個目標
        - 撤退判定的難度根據敵人數量提高
        - 被多人集火的目標在迴避判定上受到累積減值

        **多人混戰場景**：
        - 如果多組的マスター和サーヴァント都在同一據點，可能出現大規模混戰
        - 每個角色（マスター和サーヴァント）各自選擇目標
        - 同組的 Master-Servant 可以**但不必然**攻擊相同目標——配合程度取決於溝通
        - NPC 在混戰中傾向集火最弱目標，但有隨機偏差 [ref:spec-06, section:npc-combat]
      </details>
    </section>

    <section id="master-combat">
      <title>マスター直接參戰</title>
      <description>マスター親自參與戰鬥的高風險高回報選項。</description>
      <details>
        - マスター的戰鬥力通常遠低於サーヴァント
        - 混合了劍士、武鬥家等級別的マスター在特定條件下可發揮可觀戰力 [ref:spec-02, section:levels]
        - マスター被擊敗（HP 歸零）→ **直接死亡出局**
        - マスター死亡後其サーヴァント因失去魔力供應，在數回合內開始消散
        - 從者玩家在消散前可嘗試**緊急締約**——如果場上有失去サーヴァント的マスター [ref:spec-07, section:re-contract]
        - アーチャー的「単独行動」技能允許其在失去マスター後無限期獨立存在 [ref:spec-03, section:class-skills]
      </details>
      <constraints>
        <constraint>マスター HP 歸零 = 死亡出局，無復活機制</constraint>
        <constraint>サーヴァント消散的具體回合數取決於サーヴァント的魔力等級</constraint>
        <constraint>マスター死亡時，從者玩家會收到「魔力供給中斷」的系統提示</constraint>
      </constraints>
    </section>
  </rules>

  <edge_cases>
    <case>所有交戰方同時選擇撤退 → 無戰鬥發生，遭遇和平結束</case>
    <case>混戰中某方サーヴァント被消滅，其マスター在同一戰鬥中是否立即成為可攻擊目標？→ 是，但其他方可能選擇忽略</case>
    <case>令呪空間跳躍是否可在戰鬥中使用以逃離？→ 是，消耗二枚令呪 [ref:spec-02, section:command-spells]</case>
    <case>バーサーカー在戰鬥中保留完整操作權，但行動選項額外出現「暴走」選項——隨機攻擊場上任何人（含マスター）[ref:spec-03, section:berserker]</case>
    <case>從者玩家故意不出全力（選擇較弱的行動）= 隱性背叛——系統不偵測，マスター需自行察覺</case>
    <case>マスター和サーヴァント分別在不同據點遭遇戰鬥 → 各自獨立結算，令呪的強化效果需要在場才能使用</case>
    <case>NPC 組的マスター被消滅 → NPC サーヴァント遵循相同的消散/単独行動規則</case>
    <case>人類組 vs NPC 組混戰 → 完全相同的判定規則，NPC 不享受額外加成或減免</case>
  </edge_cases>

  <open_questions>
    <question>行動階段的 8 秒時限是否足夠？是否需根據場上人數調整？</question>
    <question>中斷（割り込み）技能的具體觸發條件與優先級規則</question>
    <question>混戰中的集火減值具體數值：每多一名攻擊者迴避減多少？</question>
    <question>撤退判定的難度提升公式：基礎難度 + 每名敵人 × N？</question>
    <question>令呪的強化效果是否需要 Master-Servant 在同一據點？如果分開行動中從者遭遇敵人，マスター能否遠距離使用令呪？</question>
    <question>NPC 戰鬥 AI 的「次優選擇率」10–15% 是否合適？需要 playtest 驗證</question>
    <question>NPC 宝具真名解放的閾值（勝算 40%）是否需要根據職階調整？（如バーサーカー可能更衝動）</question>
  </open_questions>
</spec>
