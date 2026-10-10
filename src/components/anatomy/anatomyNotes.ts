// Short original summaries. Sources concern anatomy, not treatment advice.
const shoulder = "https://www.ncbi.nlm.nih.gov/books/NBK546633/";
const hip = "https://doi.org/10.2519/jospt.2010.3025";
const back =
  "https://learning.medicine.wsu.edu/cohort-2029/dissector/lab-2-station-6/";
export const anatomyNotes: Record<
  string,
  { description: string; referenceUrl: string }
> = {
  supraspinatus: {
    description:
      "棘上窩から上腕骨大結節へ向かう筋。肩関節の外転に関わり、回旋筋腱板の一部を形成します。",
    referenceUrl: shoulder,
  },
  infraspinatus: {
    description:
      "棘下窩から上腕骨大結節へ向かう筋。肩関節の外旋に関わる回旋筋腱板の構成筋です。",
    referenceUrl: shoulder,
  },
  subscapularis: {
    description:
      "肩甲下窩から上腕骨小結節へ向かう筋。肩関節の内旋に関わる回旋筋腱板の構成筋です。",
    referenceUrl: shoulder,
  },
  "teres minor": {
    description:
      "肩甲骨外側縁から上腕骨大結節へ向かう筋。肩関節の外旋に関わり、回旋筋腱板を構成します。",
    referenceUrl: shoulder,
  },
  "teres major": {
    description:
      "肩甲骨下角付近から上腕骨へ向かう筋。肩関節の内旋・内転に関わります。",
    referenceUrl: shoulder,
  },
  "gluteus medius": {
    description:
      "腸骨外面から大腿骨大転子へ向かう筋。股関節の外転と片脚支持時の骨盤の安定に関わります。",
    referenceUrl: hip,
  },
  "gluteus minimus": {
    description: "中殿筋の深部にある筋。股関節の外転や内旋に関わります。",
    referenceUrl: hip,
  },
  "gluteus maximus": {
    description: "殿部の表層にある大きな筋。股関節の伸展や外旋に関わります。",
    referenceUrl: hip,
  },
  "splenius capitis": {
    description:
      "後頸部から頭蓋へ向かう筋。両側の収縮で頭頸部を伸展し、片側では同側への回旋に関わります。",
    referenceUrl: back,
  },
  "splenius cervicis": {
    description:
      "胸椎上部から頸椎へ向かう筋。頭頸部の伸展や同側への回旋に関わります。",
    referenceUrl: back,
  },
};
export const noteFor = (english: string) =>
  anatomyNotes[english.toLowerCase().replace(/^(left|right) /, "")];
