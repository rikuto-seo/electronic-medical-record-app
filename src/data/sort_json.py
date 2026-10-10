import json
from pathlib import Path

# ===== 設定 =====
input_file  = Path("elementParts_skeletal.json")     # 元のJSONファイル名
output_file = Path("sorted_elementParts_skeletal.json")  # 並べ替え後の保存先
# 並べ替え優先順
region_order = ['頭部', '頚部', '胸部', '腹部', '背部', '上肢', '下肢', '未分類']

# ===== 読み込み =====
with input_file.open(encoding="utf-8") as f:
    data = json.load(f)  # 辞書型で読み込み

# ===== 並べ替え =====
def sort_key(item):
    key, value = item
    # region が定義外の場合は最後に回す
    region_index = region_order.index(value.get("region", "未分類")) \
        if value.get("region") in region_order else len(region_order)
    # region が同じ場合は "order" で昇順
    order_value = value.get("order", 999999)
    return (region_index, order_value)

sorted_data = dict(sorted(data.items(), key=sort_key))

# ===== 保存 =====
with output_file.open("w", encoding="utf-8") as f:
    json.dump(sorted_data, f, ensure_ascii=False, indent=4)

print(f"✅ 並べ替え完了: {output_file}")