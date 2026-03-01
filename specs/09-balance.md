<spec>
  <metadata>
    <id>spec-09</id>
    <title>數值平衡、節奏控制</title>
    <version>0.3.0</version>
    <dependencies>
      <dependency ref="spec-03">サーヴァント五圍骰定（隨機性平衡）、聖杯願望</dependency>
      <dependency ref="spec-06">戰鬥系統（數值影響戰鬥結果、雙人操作、NPC 戰鬥 AI）</dependency>
      <dependency ref="spec-01">夜循環與聖杯暴走（節奏控制）、勝利條件</dependency>
      <dependency ref="spec-05">魔力供給距離（分頭行動的平衡）</dependency>
      <dependency ref="spec-00">彈性人數模型（NPC 組數量影響平衡）</dependency>
    </dependencies>
  </metadata>

  <overview>
    由於サーヴァント是隨機骰定的，必然會出現強弱差距。這是刻意的設計——
    マスター的策略與從者玩家的操作水準共同決定勝負。
    本 spec 定義平衡隨機性的補償機制、確保 60–90 分鐘結束的節奏控制、
    防止消極遊戲的壓力機制、彈性人數下的平衡考量、以及 NPC 組的難度調校。
  </overview>

  <design_goals>
    <goal>隨機性帶來的強弱差距是特色而非缺陷——正如原作中サーヴァント本就有強弱之分</goal>
    <goal>透過多層補償確保弱サーヴァント的組合仍有勝算</goal>
    <goal>節奏加速機制確保單場在 60–90 分鐘內結束</goal>
    <goal>防止龜縮不戰的消極策略成為最佳解</goal>
    <goal>Master-Servant 內層博弈的張力要足夠但不壓過外層聖杯戰爭</goal>
    <goal>NPC 組的難度在「挑戰性」與「可戰勝」之間取得平衡</goal>
    <goal>人數較少時（4–8 人）遊戲體驗不應大幅劣化</goal>
  </design_goals>

  <rules>
    <section id="random-balance">
      <title>隨機性的平衡</title>
      <description>平衡サーヴァント強弱差距的多層機制。</description>
      <details>
        **弱サーヴァント的補償**：
        - 整體五圍較低的サーヴァント可能獲得額外的保有スキル槽位 [ref:spec-03, section:personal-skills]
        - 或宝具等級提升 [ref:spec-03, section:noble-phantasm]

        **マスター + サーヴァント的雙重決定性**：
        - 令呪 [ref:spec-02, section:command-spells]、背反律 [ref:spec-02, section:style]、級別特技 [ref:spec-02, section:levels] 等マスター側的資源不受サーヴァント強弱影響
        - サーヴァント玩家的操作水準和社交能力同樣是勝負因素——即使數值較弱，聰明的從者玩家可以透過情報操作和戰術選擇扭轉局勢
        - 讓技巧型玩家有翻盤機會

        **級別混合的深度**：
        - 千夜月姬的複數級別混合系統讓マスター構築有極高自由度
        - 即使サーヴァント較弱，也能透過マスター的特化構築補強短板

        **結盟的價值**：
        - 弱者之間的結盟可以對抗強者
        - 強者也需要情報支援
        - 自由結盟機制讓弱者有外交斡旋的空間 [ref:spec-07, section:alliance]
        - 社交層面更豐富，弱組更容易找到結盟對象（包括與 NPC 結盟）
      </details>
    </section>

    <section id="wish-balance">
      <title>聖杯願望的平衡</title>
      <description>控制願望衝突率，確保內層博弈的張力適當。</description>
      <details>
        **願望相容性分佈**：
        - 不能所有組都衝突（會讓所有最終對決變成零和遊戲，太壓抑）
        - 不能所有組都相容（會消滅內層博弈的張力）
        - 建議分佈：約 40% 的組合為衝突型，60% 為相容型
        - 從者的願望池設計應確保這個分佈大致成立

        **願望張力的節奏**：
        - 前期：玩家專注外層戰爭，願望衝突是潛在的隱憂
        - 中期：隨著溝通加深，雙方開始試探對方願望
        - 後期：願望衝突成為最終對決的懸念

        **NPC 組的願望**：
        - NPC 組也有預設的聖杯願望，但不進行組內博弈
        - NPC 的願望類型影響其行為模式（如「征服」型願望的 NPC 更具攻擊性）
      </details>
    </section>

    <section id="pacing">
      <title>節奏控制</title>
      <description>確保每場遊戲在 60–90 分鐘內結束的加速機制。</description>
      <details>
        **魔力消耗壓力**：
        - サーヴァント每夜消耗魔力維持
        - 不佔領靈脈據點的組合會逐漸耗盡魔力 [ref:spec-05, section:strongholds]
        - サーヴァント的能力隨魔力不足而下降
        - 分頭行動的魔力距離懲罰增加消耗 [ref:spec-05, section:mana-distance]
        - 迫使玩家爭奪資源

        **聖杯暴走**：[ref:spec-01, section:grail-rampage]
        - 第 10 夜起據點崩壞、魔力消耗加倍
        - 壓縮活動空間，強制交戰

        **情報自然揭露**：[ref:spec-04, section:natural-reveal]
        - 隨遊戲推進，系統逐漸公開更多サーヴァント資訊
        - 降低情報迷霧密度，讓後期戰鬥更具決定性

        **彈性人數的節奏考量**：
        - 人數較少（4–8 人）：人類組少、NPC 組多，NPC 之間會自動交戰消耗，遊戲節奏可能偏快
        - 人數較多（10–14 人）：溝通量更大，可能需要適當延長自由行動期
        - 戰鬥中雙人同時操作（各自 8 秒），不會額外增加戰鬥時間
        - 準備階段可能需要根據人數調整：4 人約 5 分鐘，14 人約 7–8 分鐘
      </details>
    </section>

    <section id="npc-difficulty">
      <title>NPC 難度平衡</title>
      <description>確保 NPC 組既構成挑戰又不至於壓倒人類玩家。</description>
      <details>
        **NPC 強度定位**：
        - NPC 的目標是「中等水準的玩家」——不是最強也不是最弱
        - NPC サーヴァント的五圍與人類組使用相同的隨機骰定系統——不做額外強化或弱化
        - NPC マスター的級別組合由系統隨機生成，使用與人類相同的規則

        **NPC 的行為弱點（刻意設計）**：
        - NPC 的戰鬥有 10–15% 的次優選擇率 [ref:spec-06, section:npc-combat]
        - NPC 的外交判斷較為機械——可被聰明的人類玩家操縱
        - NPC 不會進行組內背叛或複雜的多層計謀
        - NPC 的行為模式可能在中後期被人類識破

        **NPC 數量與平衡**：

        | 人類組數 | NPC 組數 | 平衡考量 |
        |---------|---------|---------|
        | 7（滿員）| 0 | 純人類對戰，最豐富的社交體驗 |
        | 5–6 | 1–2 | NPC 作為「野怪」角色，增添不確定性 |
        | 3–4 | 3–4 | NPC 佔半數，人類需善用社交優勢 |
        | 2 | 5 | NPC 主導，人類需謹慎選擇戰鬥時機 |

        **NPC 作為平衡因子**：
        - NPC 組之間也會互相交戰——不會全部集中攻擊人類
        - NPC 的自動消耗為人類玩家創造「漁翁得利」的機會
        - 人類玩家可以操縱 NPC 之間的衝突（如故意洩露某 NPC 位置給另一 NPC）
      </details>
    </section>

    <section id="anti-passive">
      <title>防止消極遊戲</title>
      <description>防止玩家全程龜縮不與其他人交戰的壓力機制。</description>
      <details>
        **魔力枯竭**：
        - 不佔領靈脈的組合每夜都在流血
        - 中後期魔力不足的サーヴァント甚至無法使用保有スキル，形同廢人

        **據點崩壞**：
        - 後期據點逐一崩壞，安全藏身處越來越少 [ref:spec-01, section:grail-rampage]

        **視野壓力**：
        - 配水塔等情報據點允許其他人追蹤大致位置 [ref:spec-05, section:strongholds]
        - 無法永遠隱藏

        **分頭行動的風險**：
        - 分頭行動時單獨遭遇敵人 = 戰力減半
        - 魔力距離懲罰限制了分頭行動的持續時間 [ref:spec-05, section:mana-distance]

        **NPC 的壓力作用**：
        - NPC 組會主動巡邏和攻擊——即使人類龜縮，NPC 也會上門挑戰
        - NPC 佔領靈脈會壓縮人類的資源獲取空間
      </details>
      <constraints>
        <constraint>魔力枯竭是漸進式的——不會突然從滿狀態變成無法戰鬥，給玩家反應時間</constraint>
      </constraints>
    </section>
  </rules>

  <edge_cases>
    <case>若某位從者玩家的サーヴァント骰出全 A 以上五圍——是否需要上限補正？→ 不需要，這是 TRPG 的魅力之一</case>
    <case>若所有靈脈據點都在聖杯暴走中被封鎖——所有サーヴァント加速消耗，無法回復</case>
    <case>從者玩家故意消極（不配合マスター）是否算作消極遊戲？→ 不算，這是合法的角色扮演和策略選擇</case>
    <case>只有 2 組人類時，5 組 NPC 之間的戰鬥可能提前消耗大量 NPC → 人類可能面對 NPC 殘局</case>
    <case>NPC 全部被消滅、只剩人類組 → 正常繼續遊戲（變成純人類對戰）</case>
  </edge_cases>

  <open_questions>
    <question>弱サーヴァント補償的具體觸發閾值（五圍總值低於多少觸發？）</question>
    <question>每夜魔力消耗的具體數值與靈脈回復量</question>
    <question>魔力不足對サーヴァント能力的具體降級規則（先失去保有スキル？還是五圍下降？）</question>
    <question>情報自然揭露的具體時間表</question>
    <question>願望衝突率 40% 的具體實現方式——願望池如何設計以保證這個分佈？</question>
    <question>NPC 次優選擇率 10–15% 是否需要根據人類組數量動態調整？（人類少時降低，讓 NPC 更容易被打敗？）</question>
    <question>4 人遊戲（2 組人類 + 5 組 NPC）的具體時長目標——是否縮短到 40–60 分鐘？</question>
    <question>NPC 之間的自動交戰頻率是否需要限制？避免 NPC 太快消耗殆盡</question>
  </open_questions>
</spec>
