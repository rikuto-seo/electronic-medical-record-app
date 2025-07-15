// src/utils/dateUtils.ts

// ISO文字列（UTC扱いされてしまうJSTデータ）を「JSTとして表示」するための補正関数
export const formatJST = (isoString: string): string => {
  const date = new Date(isoString);
  // 9時間補正（JST）
  const jstTime = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return jstTime.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};
