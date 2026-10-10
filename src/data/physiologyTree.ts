// src/data/physiologyTree.ts
export type Page = { name: string; path: string };
export type Chapter = { title: string; pages: Page[] };
export type Tree = Record<string, { title: string; chapters: Record<string, Chapter> }>;


export const physiologyTree: Tree = {
  part1: {
    title: "生体の一般生理",
    chapters: {
      chapter1: {
        title: "細胞の微細構造と機能",
        pages: [
          { name: "A 核", path: "/physiology/part1/chapter1/A" },
          { name: "B 細胞小器官", path: "/physiology/part1/chapter1/B" },
          { name: "C 形質膜", path: "/physiology/part1/chapter1/C" },
          { name: "D 膜タンパク質の機能", path: "/physiology/part1/chapter1/D" },
          { name: "E 細胞におけるエネルギー代謝", path: "/physiology/part1/chapter1/E" },
        ],
      },
      chapter2: {
        title: "細胞・生体とその環境",
        pages: [
          { name: "A 生体の構成成分", path: "/physiology/part1/chapter2/A" },
          { name: "B 膜電位と平衡電位", path: "/physiology/part1/chapter2/B" },
          { name: "C 細胞膜を介する物質の移動", path: "/physiology/part1/chapter2/C" },
          { name: "D 細胞間の情報伝達系", path: "/physiology/part1/chapter2/D" },
        ],
      },
      chapter3: {
        title: "水分子の特性と浸透圧",
        pages: [
          { name: "A 水分子の生理的動態", path: "/physiology/part1/chapter3/A" },
          { name: "B 浸透圧", path: "/physiology/part1/chapter3/B" },
        ],
      },
    },
  },

  part2: {
    title: "神経と筋",
    chapters: {
      chapter4: {
        title: "膜興奮性とイオンチャネル",
        pages: [
          { name: "A 神経細胞の構造と機能", path: "/physiology/part2/chapter4/A" },
          { name: "B 膜電位の発生と膜興奮の機序", path: "/physiology/part2/chapter4/B" },
          { name: "C 興奮性細胞の局所電位と軸索における興奮伝導", path: "/physiology/part/chapter4/C" },
          { name: "D 神経細胞の部位による膜特異性と樹状突起の活動電位", path: "/physiology/part2/chapter4/D" },
          { name: "E イオンチャネル", path: "/physiology/part2/chapter4/E" },
          { name: "F Caイオンの細胞生理学的役割", path: "/physiology/part2/chapter4/F" },
          { name: "G イオンチャネル異常による疾患", path: "/physiology/part2/chapter4/G" },
        ],
      },
      chapter5: {
        title: "筋肉とその収縮",
        pages: [
          { name: "A 骨格筋", path: "/physiology/part2/chapter5/A" },
          { name: "B 興奮収縮連関", path: "/physiology/part2/chapter5/B" },
          { name: "C 筋収縮", path: "/physiology/part2/chapter5/c" },
          { name: "D 筋収縮機構", path: "/physiology/part2/chapter5/D" },
          { name: "E 心筋細胞の興奮収縮連関", path: "/physiology/part2/chapter5/E" },
          { name: "F 平滑筋収縮とその制御", path: "/physiology/part2/chapter5/F" },
        ],
      },
      chapter6: {
        title: "興奮伝達",
        pages: [
          { name: "A シナプス伝達概論", path: "/physiology/part2/chapter6/A" },
          { name: "B 伝達物質とその受容体", path: "/physiology/part2/chapter6/B" },
          { name: "C シナプス伝達の調節", path: "/physiology/part2/chapter6/C" },
          { name: "D 中枢神経系におけるシナプス伝達", path: "/physiology/part2/chapter6/D" },
        ],
      },
    },
  },

  part3: {
    title: "神経系の形態と機能/概説",
    chapters: {
      chapter7: {
        title: "神経細胞学/総論",
        pages: [
          { name: "A 神経系の構成", path: "/physiology/part3/chapter7/A" },
          { name: "B 神経細胞と神経膠細胞", path: "/physiology/part3/chapter7/B" },
          { name: "C 脳脊髄液環境", path: "/physiology/part3/chapter7/C" },
          { name: "D 細胞骨格と軸索輸送", path: "/physiology/part3/chapter7/D" },
          { name: "E 神経細胞の発生と分化", path: "/physiology/part3/chapter7/E" },
          { name: "F 視床の機能解剖学", path: "/physiology/part3/chapter7/F" },
          { name: "G 大脳皮質の機能解剖学", path: "/physiology/part3/chapter7/G" },
        ],
      },
      chapter8: {
        title: "神経回路機能/総論",
        pages: [
          { name: "A 神経回路の要素", path: "/physiology/part3/chapter8/A" },
          { name: "B 反射と反射弓", path: "/physiology/part3/chapter8/B" },
        ],
      },
    },
  },

  part4: {
    title: "感覚機能",
    chapters: {
      chapter9: {
        title: "感覚機能総論",
        pages: [
          { name: "A 感覚の種類", path: "/physiology/part4/chapter9/A" },
          { name: "B 感覚の心理物理学", path: "/physiology/part4/chapter9/B" },
          { name: "C 感覚の神経生理学", path: "/physiology/part4/chapter9/C" },
        ],
      },
      chapter10: {
        title: "体性感覚",
        pages: [
          { name: "A 末梢神経系", path: "/physiology/part4/chapter10/A" },
          { name: "B 脊髄感覚系", path: "/physiology/part4/chapter10/B" },
          { name: "C 脊髄伝導路", path: "/physiology/part4/chapter10/C" },
          { name: "D 視床と体性感覚", path: "/physiology/part4/chapter10/D" },
          { name: "E 大脳皮質と体性感覚野", path: "/physiology/part4/chapter10/E" },
          { name: "F 感覚系の認識中枢", path: "/physiology/part4/chapter10/F" },
          { name: "G 痛覚系", path: "/physiology/part4/chapter10/G" },
        ],
      },
      chapter11: {
        title: "聴覚",
        pages: [
          { name: "A 集音", path: "/physiology/part4/chapter11/A" },
          { name: "B 中耳の機構と伝音機能", path: "/physiology/part4/chapter11/B" },
          { name: "C 蝸牛器官", path: "/physiology/part4/chapter11/C" },
          { name: "D 求心性および遠心性シナプス伝導", path: "/physiology/part4/chapter11/D" },
          { name: "E 音情報の符号化と聴神経線維（第Ⅷ脳神経）", path: "/physiology/part4/chapter11/E" },
          { name: "F 蝸牛神経核", path: "/physiology/part4/chapter11/F" },
          { name: "G 上オリーブ核群", path: "/physiology/part4/chapter11/G" },
          { name: "H 外側毛帯核", path: "/physiology/part4/chapter11/H" },
          { name: "I 下丘", path: "/physiology/part4/chapter11/I" },
          { name: "J 内側膝状体および大脳皮質聴覚野", path: "/physiology/part4/chapter11/J" },
        ],
      },
      chapter12: {
        title: "平衡感覚",
        pages: [
          { name: "A 前庭器官の構造", path: "/physiology/part4/chapter12/A" },
          { name: "B 有毛細胞", path: "/physiology/part4/chapter12/B" },
          { name: "C 半規管と耳石器の最適刺激方向", path: "/physiology/part4/chapter12/C" },
          { name: "D 前庭神経", path: "/physiology/part4/chapter12/D" },
          { name: "E 前庭神経核", path: "/physiology/part4/chapter12/E" },
          { name: "F 前庭反射（迷路反射）", path: "/physiology/part4/chapter12/F" },
          { name: "G 平衡と運動の知覚", path: "/physiology/part4/chapter12/G" },
        ],
      },
      chapter13: {
        title: "視覚",
        pages: [
          { name: "A 眼球およびその付属器官の構造と機能", path: "/physiology/part4/chapter13/A" },
          { name: "B 光学系ーレンズ系の構造と機能", path: "/physiology/part4/chapter13/B" },
          { name: "C 光受容系ー網膜の構造と機能", path: "/physiology/part4/chapter13/C" },
          { name: "D 視覚経路および視覚中枢の構造と機能", path: "/physiology/part4/chapter13/D" },
          { name: "E 眼球運動", path: "/physiology/part4/chapter13/E" },
          { name: "F 視覚の特性とそのメカニズム", path: "/physiology/part4/chapter13/F" },
        ],
      },
      chapter14: {
        title: "味覚と聴覚",
        pages: [
          { name: "A 味覚", path: "/physiology/part4/chapter14/A" },
          { name: "B 嗅覚", path: "/physiology/part4/chapter14/B" },
        ],
      },
    },
  },

  part5: {
    title: "運動機能",
    chapters: {
      chapter15: {
        title: "筋と運動ニューロン",
        pages: [
          { name: "A 運動単位", path: "/physiology/part5/chapter15/A" },
          { name: "B 運動単位の機能分化", path: "/physiology/part5/chapter15/B" },
          { name: "C 運動単位の活動の順序", path: "/physiology/part5/chapter15/C" },
        ],
      },
      chapter16: {
        title: "脊髄",
        pages: [
          { name: "A 脊髄運動中枢", path: "/physiology/part5/chapter16/A" },
          { name: "B 脊髄反射", path: "/physiology/part5/chapter16/B" },
          { name: "C 脊髄のシナプス前抑制", path: "/physiology/part5/chapter16/C" },
          { name: "D 歩行運動と脊髄", path: "/physiology/part5/chapter16/D" },
          { name: "E 運動性上・下行路の脊髄機序", path: "/physiology/part5/chapter16/E" },
        ],
      },
      chapter17: {
        title: "脳幹",
        pages: [
          { name: "A 脳幹とは", path: "/physiology/part5/chapter17/A" },
          { name: "B 脳幹運動系の特徴", path: "/physiology/part5/chapter17/B" },
          { name: "C 脳幹の機能", path: "/physiology/part5/chapter17/C" },
          { name: "D 姿勢調整", path: "/physiology/part5/chapter17/D" },
          { name: "E 歩行運動", path: "/physiology/part5/chapter17/E" },
          { name: "F 眼球と頭の運動", path: "/physiology/part5/chapter17/F" },
          { name: "G 顎の運動", path: "/physiology/part5/chapter17/G" },
          { name: "H 発声と情動行動", path: "/physiology/part5/chapter17/H" },
        ],
      },
      chapter18: {
        title: "大脳皮質運動野と大脳基底核",
        pages: [
          { name: "A 大脳皮質運動野", path: "/physiology/part5/chapter18/A" },
          { name: "B 大脳基底核", path: "/physiology/part5/chapter18/B" },
        ],
      },
      chapter19: {
        title: "小脳",
        pages: [
          { name: "A 小脳の構造・細胞構築", path: "/physiology/part5/chapter19/A" },
          { name: "B 小脳の神経回路", path: "/physiology/part5/chapter19/B" },
          { name: "C 小脳による運動制御", path: "/physiology/part5/chapter19/C" },
          { name: "D 小脳と運動学習", path: "/physiology/part5/chapter19/D" },
          { name: "E 小脳の損傷と臨床症状", path: "/physiology/part5/chapter19/E" },
        ],
      },
      chapter20: {
        title: "発声と構音",
        pages: [
          { name: "A 発声", path: "/physiology/part5/chapter20/A" },
          { name: "B 構音", path: "/physiology/part5/chapter20/B" },
          { name: "C 言語の産生にかかわる脳の機能", path: "/physiology/part5/chapter20/C" },
        ],
      },
    },
  },

  part6: {
    title: "自律機能と本能行動",
    chapters: {
      chapter21: {
        title: "自律神経系",
        pages: [
          { name: "A 末梢自律神経系の構成", path: "/physiology/part6/chapter21/A" },
          { name: "B 自律神経支配の特徴", path: "/physiology/part6/chapter21/B" },
          { name: "C 自律神経系の化学伝達物質とその受容体", path: "/physiology/part6/chapter21/C" },
          { name: "D 自律神経節", path: "/physiology/part6/chapter21/D" },
          { name: "E 自律神経ー効果器伝達", path: "/physiology/part6/chapter21/E" },
          { name: "F 自律神経と内分泌系,免疫系", path: "/physiology/part6/chapter21/F" },
          { name: "G 内臓感覚", path: "/physiology/part6/chapter21/G" },
          { name: "H 自律神経系の中枢", path: "/physiology/part6/chapter21/H" },
          { name: "I 自律機能の反射性調節", path: "/physiology/part6/chapter21/I" },
        ],
      },
      chapter22: {
        title: "本能的欲求に基づく動機づけ行動",
        pages: [
          { name: "A 摂食行動", path: "/physiology/part6/chapter22/A" },
          { name: "B 飲水行動", path: "/physiology/part6/chapter22/B" },
          { name: "C 性行動", path: "/physiology/part6/chapter22/C" },
        ],
      },
    },
  },

  part7: {
    title: "高次神経機能",
    chapters: {
      chapter23: {
        title: "大脳皮質の機能局在",
        pages: [
          { name: "A 機能局在と全体論", path: "/physiology/part7/chapter23/A" },
          { name: "B 大脳皮質の感覚機能", path: "/physiology/part7/chapter23/B" },
          { name: "C 大脳皮質と運動機能", path: "/physiology/part7/chapter23/C" },
          { name: "D 連合野のさまざまな高次機能", path: "/physiology/part7/chapter23/D" },
          { name: "E 大脳皮質の左右機能差", path: "/physiology/part7/chapter23/E" },
          { name: "F 大脳皮質の進化", path: "/physiology/part7/chapter23/F" },
        ],
      },
      chapter24: {
        title: "統合機能",
        pages: [
          { name: "A 脳活動の非侵襲的計測", path: "/physiology/part7/chapter24/A" },
          { name: "B 睡眠・覚醒と意識", path: "/physiology/part7/chapter24/B" },
          { name: "C 学習と記憶", path: "/physiology/part7/chapter24/C" },
          { name: "D 情動と動機づけ", path: "/physiology/part7/chapter24/D" },
        ],
      },
    },
  },

  part8: {
    title: "体液",
    chapters: {
      chapter25: {
        title: "ヒトにおける体液の調節ー統合機能の重要性",
        pages: [
          { name: "A 体液とその区分", path: "/physiology/part8/chapter25/A" },
          { name: "B 各臓器の体液調節への関与", path: "/physiology/part8/chapter25/B" },
          { name: "C 浸透圧濃度", path: "/physiology/part8/chapter25/C" },
        ],
      },
      chapter26: {
        title: "酸塩基平衡の基本概念",
        pages: [
          { name: "A 生体内における酸の生成", path: "/physiology/part8/chapter26/A" },
          { name: "B CO₂の運搬と炭酸脱水酵素", path: "/physiology/part8/chapter26/B" },
          { name: "C 体液の緩衝作用とpH", path: "/physiology/part8/chapter26/C" },
          { name: "D 両性電解質について", path: "/physiology/part8/chapter26/D" },
          { name: "E 酵素活性とpH", path: "/physiology/part8/chapter26/E" },
          { name: "F ヒトにおける酸塩基平衡の調節", path: "/physiology/part8/chapter26/F" },
          { name: "G 生体での酸塩基平衡防御反応", path: "/physiology/part8/chapter26/G" },
          { name: "H 酸塩基平衡調節の全体像", path: "/physiology/part8/chapter26/H" },
          { name: "I 酸塩基平衡の異常", path: "/physiology/part8/chapter26/I" },
        ],
      },
    },
  },

  part9: {
    title: "血液",
    chapters: {
      chapter27: {
        title: "血液の組成と性状",
        pages: [
          { name: "A 血液の組成", path: "/physiology/part9/chapter27/A" },
          { name: "B 血液の性状", path: "/physiology/part9/chapter27/B" },
          { name: "C 血漿タンパク", path: "/physiology/part9/chapter27/C" },
        ],
      },
      chapter28: {
        title: "血液細胞の産生",
        pages: [
          { name: "A 造血幹細胞", path: "/physiology/part9/chapter28/A" },
          { name: "B 血液細胞の分化", path: "/physiology/part9/chapter28/B" },
        ],
      },
      chapter29: {
        title: "赤血球",
        pages: [
          { name: "A 赤血球の数と形態", path: "/physiology/part9/chapter29/A" },
          { name: "B 赤血球の生成", path: "/physiology/part9/chapter29/B" },
          { name: "C 赤血球の成熟と分化", path: "/physiology/part9/chapter29/C" },
          { name: "D 赤血球の老化と破壊", path: "/physiology/part9/chapter29/D" },
          { name: "E 赤血球の代謝とヘモグロビン", path: "/physiology/part9/chapter29/E" },
        ],
      },
      chapter30: {
        title: "鉄の代謝",
        pages: [
          { name: "A 鉄の吸収", path: "/physiology/part9/chapter30/A" },
          { name: "B 鉄の恒常性の維持", path: "/physiology/part9/chapter30/B" },
          { name: "C 赤血球造血と鉄代謝", path: "/physiology/part9/chapter30/C" },
          { name: "D 貯蔵鉄", path: "/physiology/part9/chapter30/D" },
        ],
      },
      chapter31: {
        title: "白血球",
        pages: [
          { name: "A 白血球の分化", path: "/physiology/part9/chapter31/A" },
          { name: "B 白血球の機能", path: "/physiology/part9/chapter31/B" },
          { name: "C リンパ球の分化", path: "/physiology/part9/chapter31/C" },
        ],
      },
      chapter32: {
        title: "免疫反応と炎症",
        pages: [
          { name: "A 生体防御と免疫", path: "/physiology/part9/chapter32/A" },
          { name: "B 自然免疫系と獲得免疫系", path: "/physiology/part9/chapter32/B" },
          { name: "C 炎症反応と生体防御", path: "/physiology/part9/chapter32/C" },
        ],
      },
      chapter33: {
        title: "血小板と凝固機能",
        pages: [
          { name: "A 止血・凝固のメカニズム", path: "/physiology/part9/chapter33/A" },
        ],
      },
      chapter34: {
        title: "血液型",
        pages: [
          { name: "A 赤血球の型物質と輸血", path: "/physiology/part9/chapter34/A" },
          { name: "B 白血球の型物質と臓器移植", path: "/physiology/part9/chapter34/B" },
        ],
      },
    },
  },

  part10: {
    title: "循環",
    chapters: {
      chapter35: {
        title: "循環系の基本的性質",
        pages: [
          { name: "A 循環系と内部環境の維持", path: "/physiology/part10/chapter35/A" },
          { name: "B 血液循環の物理的基礎", path: "/physiology/part10/chapter35/B" },
          { name: "C 循環回路と循環系のモデル", path: "/physiology/part10/chapter35/C" },
        ],
      },
      chapter36: {
        title: "血液循環",
        pages: [
          { name: "A 末梢循環", path: "/physiology/part10/chapter36/A" },
          { name: "B 微小循環", path: "/physiology/part10/chapter36/B" },
          { name: "C リンパ循環", path: "/physiology/part10/chapter36/C" },
        ],
      },
      chapter37: {
        title: "心臓の動き",
        pages: [
          { name: "A 心臓の機能解剖学", path: "/physiology/part10/chapter37/A" },
          { name: "B 心臓の電気的活動", path: "/physiology/part10/chapter37/B" },
          { name: "C 心電図", path: "/physiology/part10/chapter37/C" },
          { name: "D 心筋の機械的性質", path: "/physiology/part10/chapter37/D" },
          { name: "E 心臓の機械的活動", path: "/physiology/part10/chapter37/E" },
        ],
      },
      chapter38: {
        title: "循環系の調節",
        pages: [
          { name: "A 循環調節機構", path: "/physiology/part10/chapter38/A" },
          { name: "B 中枢調節機構", path: "/physiology/part10/chapter38/B" },
          { name: "C 内分泌調節機構", path: "/physiology/part10/chapter38/C" },
          { name: "D 局所調節機構", path: "/physiology/part10/chapter38/D" },
          { name: "E 高血圧とショック", path: "/physiology/part10/chapter38/E" },
        ],
      },
      chapter39: {
        title: "局所循環",
        pages: [
          { name: "A 脳循環", path: "/physiology/part10/chapter39/A" },
          { name: "B 冠循環", path: "/physiology/part10/chapter39/B" },
        ],
      },
    },
  },

  part11: {
    title: "呼吸",
    chapters: {
      chapter40: {
        title: "呼吸生理学の基礎",
        pages: [
          { name: "A 大気環境の歴史と生物", path: "/physiology/part11/chapter40/A" },
          { name: "B 呼吸の比較生理と胎生期の呼吸", path: "/physiology/part11/chapter40/B" },
          { name: "C ガスの基本法則,呼吸気量の換算,記号・略語", path: "/physiology/part11/chapter40/C" },
        ],
      },
      chapter41: {
        title: "肺の換気",
        pages: [
          { name: "A 気道・肺胞・胸郭の構造と機能", path: "/physiology/part11/chapter41/A" },
          { name: "B 呼吸運動", path: "/physiology/part11/chapter41/B" },
          { name: "C 肺気量分画", path: "/physiology/part11/chapter41/C" },
          { name: "D 肺胞換気量", path: "/physiology/part11/chapter41/D" },
          { name: "E 発声および声門について", path: "/physiology/part11/chapter41/E" },
        ],
      },
      chapter42: {
        title: "肺循環とガス交換",
        pages: [
          { name: "A 肺循環", path: "/physiology/part11/chapter42/A" },
          { name: "B 肺におけるガス交換", path: "/physiology/part11/chapter42/B" },
          { name: "C 換気血流の適合と血液ガスへの影響", path: "/physiology/part11/chapter42/C" },
        ],
      },
      chapter43: {
        title: "血液ガスの運搬",
        pages: [
          { name: "A 酸素の運搬", path: "/physiology/part11/chapter43/A" },
          { name: "B 血液による二酸化炭素の運搬", path: "/physiology/part11/chapter43/B" },
          { name: "C 呼吸と血液酸塩基平衡の関連", path: "/physiology/part11/chapter43/C" },
          { name: "D 組織呼吸", path: "/physiology/part11/chapter43/D" },
        ],
      },
      chapter44: {
        title: "呼吸の調節",
        pages: [
          { name: "A 呼吸中枢", path: "/physiology/part11/chapter44/A" },
          { name: "B 神経性呼吸調節", path: "/physiology/part11/chapter44/B" },
          { name: "C 呼吸の化学調節", path: "/physiology/part11/chapter44/C" },
        ],
      },
      chapter45: {
        title: "呼吸の適応と病態",
        pages: [
          { name: "A 呼吸の適応", path: "/physiology/part11/chapter45/A" },
          { name: "B 呼吸の病態生理", path: "/physiology/part11/chapter45/B" },
        ],
      },
    },
  },

  part12: {
    title: "腎臓",
    chapters: {
      chapter46: {
        title: "腎臓生理学の基礎",
        pages: [
          { name: "A 腎臓の構造", path: "/physiology/part12/chapter46/A" },
          { name: "B 尿生成のしくみ", path: "/physiology/part12/chapter46/B" },
          { name: "C 腎クリアランス", path: "/physiology/part12/chapter46/C" },
          { name: "D 下部尿路の構造と機能", path: "/physiology/part12/chapter46/D" },
        ],
      },
      chapter47: {
        title: "糸球体濾過と腎循環",
        pages: [
          { name: "A 糸球体濾過と腎循環の意義", path: "/physiology/part12/chapter47/A" },
          { name: "B 圧利尿と髄質循環", path: "/physiology/part12/chapter47/B" },
          { name: "C 血流再分布とその意義", path: "/physiology/part12/chapter47/C" },
          { name: "D 糸球体と傍糸球体装置", path: "/physiology/part12/chapter47/D" },
          { name: "E 糸球体濾過の機序", path: "/physiology/part12/chapter47/E" },
          { name: "F 糸球体濾過の調節機序", path: "/physiology/part12/chapter47/F" },
        ],
      },
      chapter48: {
        title: "有機物質の尿細管再吸収と分泌",
        pages: [
          { name: "A 概要", path: "/physiology/part12/chapter48/A" },
          { name: "B 各種物質の再吸収と分泌", path: "/physiology/part12/chapter48/B" },
          { name: "C 代謝産物の再吸収と排泄", path: "/physiology/part12/chapter48/C" },
        ],
      },
      chapter49: {
        title: "尿細管のNa⁺,Cl⁻輸送",
        pages: [
          { name: "A 尿細管の輸送経路", path: "/physiology/part12/chapter49/A" },
          { name: "B ネフロン各セグメントのNaCl輸送", path: "/physiology/part12/chapter49/B" },
        ],
      },
      chapter50: {
        title: "K⁺輸送",
        pages: [
          { name: "A 生体におけるK⁺平衡", path: "/physiology/part12/chapter50/A" },
          { name: "B 尿細管におけるK⁺輸送", path: "/physiology/part12/chapter50/B" },
          { name: "C 高K血症と低K血症", path: "/physiology/part12/chapter50/C" },
        ],
      },
      chapter51: {
        title: "Ca²⁺,Mg²⁺,リン酸の輸送",
        pages: [
          { name: "A カルシウム（Ca）の輸送", path: "/physiology/part12/chapter51/A" },
          { name: "B マグネシウム（Mg）", path: "/physiology/part12/chapter51/B" },
          { name: "C リンの輸送（P）", path: "/physiology/part12/chapter51/C" },
          { name: "D 高Ca血症と低Ca血症", path: "/physiology/part12/chapter51/D" },
        ],
      },
      chapter52: {
        title: "尿濃縮と希釈",
        pages: [
          { name: "A 細胞外液の浸透圧調節", path: "/physiology/part12/chapter52/A" },
          { name: "B 対向流増幅系", path: "/physiology/part12/chapter52/B" },
          { name: "C 皮質髄質浸透圧勾配", path: "/physiology/part12/chapter52/C" },
          { name: "D 対向流交換系", path: "/physiology/part12/chapter52/D" },
          { name: "E 尿素循環", path: "/physiology/part12/chapter52/E" },
          { name: "F 抗利尿ホルモンの作用と水チャネル", path: "/physiology/part12/chapter52/F" },
        ],
      },
      chapter53: {
        title: "腎における体液量調節",
        pages: [
          { name: "A 尿生成と腎臓による体液量調節の関係", path: "/physiology/part12/chapter53/A" },
          { name: "B 体液調節にかかわる神経液性因子", path: "/physiology/part12/chapter53/B" },
          { name: "C 体液量調節の病的状態", path: "/physiology/part12/chapter53/C" },
        ],
      },
      chapter54: {
        title: "腎における酸塩基輸送と調節",
        pages: [
          { name: "A 酸塩基輸送", path: "/physiology/part12/chapter54/A" },
          { name: "B 酸塩基調節", path: "/physiology/part12/chapter54/B" },
        ],
      },
    },
  },

  part13: {
    title: "消化と吸収",
    chapters: {
      chapter55: {
        title: "消化と吸収の一般原理",
        pages: [
          { name: "A 消化管の基本構造", path: "/physiology/part13/chapter55/A" },
          { name: "B 消化管運動の一般的性質", path: "/physiology/part13/chapter55/B" },
          { name: "C 消化液分泌の一般的性質", path: "/physiology/part13/chapter55/C" },
          { name: "D 消化器系の循環", path: "/physiology/part13/chapter55/DB" },
          { name: "E 消化管における免疫防御", path: "/physiology/part13/chapter55/E" },
        ],
      },
      chapter56: {
        title: "食物の摂取と輸送",
        pages: [
          { name: "A 摂食・嚥下の概要", path: "/physiology/part13/chapter56/A" },
          { name: "B 咀嚼", path: "/physiology/part13/chapter56/B" },
          { name: "C 唾液の役割", path: "/physiology/part13/chapter56/C" },
          { name: "D 咽頭の機能", path: "/physiology/part13/chapter56/D" },
          { name: "E 食道の機能", path: "/physiology/part13/chapter56/E" },
        ],
      },
      chapter57: {
        title: "胃",
        pages: [
          { name: "A 胃の構造", path: "/physiology/part13/chapter57/A" },
          { name: "B 胃の運動", path: "/physiology/part13/chapter57/B" },
          { name: "C 胃液分泌", path: "/physiology/part13/chapter57/C" },
          { name: "D 壁細胞", path: "/physiology/part13/chapter57/D" },
          { name: "E 胃粘膜防御機構", path: "/physiology/part13/chapter57/E" },
        ],
      },
      chapter58: {
        title: "肝・胆および膵外分泌系",
        pages: [
          { name: "A 肝・胆の構造と外分泌", path: "/physiology/part13/chapter58/A" },
          { name: "B 膵臓と膵外分泌", path: "/physiology/part13/chapter58/B" },
        ],
      },
      chapter59: {
        title: "小腸",
        pages: [
          { name: "A 小腸の構造と機能", path: "/physiology/part13/chapter59/A" },
          { name: "B 小腸運動", path: "/physiology/part13/chapter59/B" },
          { name: "C 摂食前後の小腸運動の調節", path: "/physiology/part13/chapter59/C" },
          { name: "D 小腸の分泌", path: "/physiology/part13/chapter59/D" },
        ],
      },
      chapter60: {
        title: "大腸の機能と排便",
        pages: [
          { name: "A 大腸の構造と機能", path: "/physiology/part13/chapter60/A" },
          { name: "B 大腸の収縮運動の測定法", path: "/physiology/part13/chapter60/B" },
          { name: "C 大腸収縮運動の形態", path: "/physiology/part13/chapter60/C" },
          { name: "D 大腸収縮運動の調節", path: "/physiology/part13/chapter60/D" },
          { name: "E 便通異常", path: "/physiology/part13/chapter60/E" },
          { name: "F 排便", path: "/physiology/part13/chapter60/F" },
        ],
      },
      chapter61: {
        title: "栄養素などの消化と吸収",
        pages: [
          { name: "A 概要", path: "/physiology/part13/chapter61/A" },
          { name: "B 糖質の消化と吸収", path: "/physiology/part13/chapter61/B" },
          { name: "C タンパク質の消化と吸収", path: "/physiology/part13/chapter61/C" },
          { name: "D 脂質の消化と吸収", path: "/physiology/part13/chapter61/D" },
          { name: "E ビタミンの消化と吸収", path: "/physiology/part13/chapter61/E" },
          { name: "F 液体と電解質の吸収", path: "/physiology/part13/chapter61/F" },
          { name: "G 大腸における吸収", path: "/physiology/part13/chapter61/G" },
        ],
      },
    },
  },

  part14: {
    title: "環境と生体",
    chapters: {
      chapter62: {
        title: "エネルギー代謝",
        pages: [
          { name: "A エネルギー平衡", path: "/physiology/part14/chapter62/A" },
          { name: "B エネルギー代謝の測定", path: "/physiology/part14/chapter62/B" },
          { name: "C 代謝量", path: "/physiology/part14/chapter62/C" },
          { name: "D エネルギー代謝の中枢調節", path: "/physiology/part14/chapter62/D" },
        ],
      },
      chapter63: {
        title: "体温とその調節",
        pages: [
          { name: "A 正常体温", path: "/physiology/part14/chapter63/A" },
          { name: "B 体熱平衡と体温", path: "/physiology/part14/chapter63/B" },
          { name: "C 体温調節反応", path: "/physiology/part14/chapter63/C" },
          { name: "D 体温調節機構", path: "/physiology/part14/chapter63/D" },
          { name: "E 体温の異常", path: "/physiology/part14/chapter63/E" },
          { name: "F 温度適応", path: "/physiology/part14/chapter63/F" },
        ],
      },
      chapter64: {
        title: "概日リズム",
        pages: [
          { name: "A 概日リズムの特性", path: "/physiology/part14/chapter64/A" },
          { name: "B 概日リズムと睡眠覚醒リズム", path: "/physiology/part14/chapter64/B" },
          { name: "C 概日リズムの生理作用", path: "/physiology/part14/chapter64/C" },
          { name: "D 概日リズムの機構", path: "/physiology/part14/chapter64/D" },
        ],
      },
      chapter65: {
        title: "運動と体力",
        pages: [
          { name: "A 筋収縮とそのエネルギー供給", path: "/physiology/part14/chapter65/A" },
          { name: "B 運動後のエネルギー源の回復", path: "/physiology/part14/chapter65/B" },
          { name: "C 運動中に使用されるエネルギー源", path: "/physiology/part14/chapter65/C" },
          { name: "D トレーニング方法とその効果", path: "/physiology/part14/chapter65/D" },
          { name: "E 筋力,好気的運動能に関与する要因", path: "/physiology/part14/chapter65/E" },
          { name: "F 運動時の筋血流調節", path: "/physiology/part14/chapter65/F" },
        ],
      },
      chapter66: {
        title: "環境因子と発達,成長,加齢",
        pages: [
          { name: "A 発達と成長", path: "/physiology/part14/chapter66/A" },
          { name: "B 老化", path: "/physiology/part14/chapter66/B" },
        ],
      },
    },
  },

  part15: {
    title: "内分泌",
    chapters: {
      chapter67: {
        title: "内分泌総論",
        pages: [
          { name: "A 内分泌系の機能", path: "/physiology/part15/chapter67/A" },
          { name: "B ホルモンの定義と分類", path: "/physiology/part15/chapter67/B" },
          { name: "C ホルモンの合成", path: "/physiology/part15/chapter67/C" },
          { name: "D ホルモンの分泌", path: "/physiology/part15/chapter67/D" },
          { name: "E ホルモンの生物効果", path: "/physiology/part15/chapter67/E" },
          { name: "F 内分泌系の調節機構", path: "/physiology/part15/chapter67/F" },
        ],
      },
      chapter68: {
        title: "視床下部ホルモン",
        pages: [
          { name: "A 神経内分泌系", path: "/physiology/part15/chapter68/A" },
          { name: "B 視床下部ホルモン", path: "/physiology/part15/chapter68/B" },
          { name: "C その他の神経ぺプチド", path: "/physiology/part15/chapter68/C" },
        ],
      },
      chapter69: {
        title: "下垂体ホルモン",
        pages: [
          { name: "A 下垂体の構造と機能", path: "/physiology/part15/chapter69/A" },
          { name: "B 下垂体前葉ホルモン", path: "/physiology/part15/chapter69/B" },
          { name: "C 下垂体後葉ホルモン", path: "/physiology/part15/chapter69/C" },
          { name: "D 下垂体中葉ホルモン", path: "/physiology/part15/chapter69/D" },
        ],
      },
      chapter70: {
        title: "ACTH,副腎皮質ホルモン",
        pages: [
          { name: "A ACTH（副腎皮質刺激ホルモン）", path: "/physiology/part15/chapter70/A" },
          { name: "B 副腎皮質ホルモン", path: "/physiology/part15/chapter70/B" },
          { name: "C ACTHーコルチコイド系の分泌調節", path: "/physiology/part15/chapter70/C" },
          { name: "D 電解質コルチコイド分泌調節", path: "/physiology/part15/chapter70/D" },
        ],
      },
      chapter71: {
        title: "副腎髄質ホルモン",
        pages: [
          { name: "A 副腎髄質", path: "/physiology/part15/chapter71/A" },
          { name: "B クロム親和性細胞", path: "/physiology/part15/chapter71/B" },
          { name: "C カテコールアミン", path: "/physiology/part15/chapter71/C" },
          { name: "D 副腎髄質ホルモンの生理作用", path: "/physiology/part15/chapter71/D" },
          { name: "E カテコールアミン受容体", path: "/physiology/part15/chapter71/E" },
        ],
      },
      chapter72: {
        title: "ゴナドトロピンと性腺ホルモン",
        pages: [
          { name: "A ゴナドトロピンの種類", path: "/physiology/part15/chapter72/A" },
          { name: "B ゴナドトロピンの分泌調節", path: "/physiology/part15/chapter72/B" },
          { name: "C 性腺ホルモン", path: "/physiology/part15/chapter72/C" },
          { name: "D ゴナドトロピンによる性機能制御", path: "/physiology/part15/chapter72/D" },
        ],
      },
      chapter73: {
        title: "甲状腺刺激ホルモンと甲状腺ホルモン",
        pages: [
          { name: "A 甲状腺の構造", path: "/physiology/part15/chapter73/A" },
          { name: "B 甲状腺刺激ホルモン", path: "/physiology/part15/chapter73/B" },
          { name: "C 甲状腺ホルモンの合成とその調節", path: "/physiology/part15/chapter73/C" },
          { name: "D 甲状腺ホルモンの作用", path: "/physiology/part15/chapter73/D" },
        ],
      },
      chapter74: {
        title: "カルシウム代謝の内分泌制御",
        pages: [
          { name: "A カルシウムの動態と生理機能", path: "/physiology/part15/chapter74/A" },
          { name: "B 骨の生理学", path: "/physiology/part15/chapter74/B" },
          { name: "C 副甲状腺ホルモン", path: "/physiology/part15/chapter74/C" },
          { name: "D ビタミンD", path: "/physiology/part15/chapter74/D" },
          { name: "E カルシトニン", path: "/physiology/part15/chapter74/E" },
          { name: "F 骨,カルシウム代謝に関与するその他のホルモン", path: "/physiology/part15/chapter74/F" },
        ],
      },
      chapter75: {
        title: "消化管ホルモン",
        pages: [
          { name: "A 消化管ホルモン", path: "/physiology/part15/chapter75/A" },
          { name: "B 神経ペプチド", path: "/physiology/part15/chapter75/B" },
        ],
      },
      chapter76: {
        title: "膵島ホルモン",
        pages: [
          { name: "A 膵島の解剖と産生ホルモン", path: "/physiology/part15/chapter76/A" },
          { name: "B インスリン", path: "/physiology/part15/chapter76/B" },
          { name: "C グルカゴン", path: "/physiology/part15/chapter76/C" },
          { name: "D ソマトスタチン", path: "/physiology/part15/chapter76/D" },
          { name: "E 膵ポリペプチド（PP）", path: "/physiology/part15/chapter76/E" },
        ],
      },
    },
  },

  part16: {
    title: "生殖",
    chapters: {
      chapter77: {
        title: "生殖腺の性分化・発達",
        pages: [
          { name: "A 性の決定", path: "/physiology/part16/chapter77/A" },
          { name: "B 生殖腺の性分化", path: "/physiology/part16/chapter77/B" },
          { name: "C 副生殖器の性分化", path: "/physiology/part16/chapter77/C" },
          { name: "D 脳の性分化", path: "/physiology/part16/chapter77/D" },
          { name: "E 思春期", path: "/physiology/part16/chapter77/E" },
        ],
      },
      chapter78: {
        title: "男性の生殖機能",
        pages: [
          { name: "A 男性生殖器の構造", path: "/physiology/part16/chapter78/A" },
          { name: "B 男性生殖機能", path: "/physiology/part16/chapter78/B" },
          { name: "C 精子", path: "/physiology/part16/chapter78/C" },
          { name: "D 男性の生殖活動", path: "/physiology/part16/chapter78/D" },
          { name: "E 男性生殖機能の老化", path: "/physiology/part16/chapter78/E" },
        ],
      },
      chapter79: {
        title: "女性の生殖機能",
        pages: [
          { name: "A 女性生殖系の構造", path: "/physiology/part16/chapter79/A" },
          { name: "B 生殖機能の調節:周期的な変化", path: "/physiology/part16/chapter79/B" },
          { name: "C 卵巣周期", path: "/physiology/part16/chapter79/C" },
          { name: "D 子宮内膜周期", path: "/physiology/part16/chapter79/D" },
          { name: "E 女性の生殖活動", path: "/physiology/part16/chapter79/E" },
          { name: "F 女性生殖機能の老化", path: "/physiology/part16/chapter79/F" },
        ],
      },
      chapter80: {
        title: "妊娠と分娩",
        pages: [
          { name: "A 受精", path: "/physiology/part16/chapter80/A" },
          { name: "B 着床", path: "/physiology/part16/chapter80/B" },
          { name: "C 胎盤", path: "/physiology/part16/chapter80/C" },
          { name: "D 羊水", path: "/physiology/part16/chapter80/D" },
          { name: "E 胎児", path: "/physiology/part16/chapter80/E" },
          { name: "F 母体の変化", path: "/physiology/part16/chapter80/F" },
          { name: "G 分娩", path: "/physiology/part16/chapter80/G" },
          { name: "H 新生児", path: "/physiology/part16/chapter80/H" },
          { name: "I 授乳", path: "/physiology/part16/chapter80/I" },
        ],
      },
    },
  },
};