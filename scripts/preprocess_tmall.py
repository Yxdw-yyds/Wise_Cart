#!/usr/bin/env python3
"""
天猫推荐数据集预处理脚本
从 a_logs_1gb.csv + a_product_detail.csv 生成前端可用的 JSON 文件
"""

import csv
import json
import os
import sys
import re
from collections import Counter, defaultdict
from datetime import datetime

# ============ 配置 ============
DATASET_DIR = r"D:\JISHE\a_天猫推荐数据集Rec-Tmall"
LOGS_FILE = os.path.join(DATASET_DIR, "a_logs_1gb.csv")
PRODUCT_FILE = os.path.join(DATASET_DIR, "a_product_detail.csv")
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "src", "models", "tmall")

TOP_USERS = 1000
TOP_PRODUCTS = 2000

# ============ Action 映射 ============
ACTION_MAP = {
    "click": "click",
    "collect": "fav",
    "cart": "cart",
    "alipay": "buy",
}

# ============ 类目映射（基于 title 关键词） ============
CATEGORY_KEYWORDS = {
    "美妆个护": ["面膜", "精华", "保湿", "护肤", "化妆", "口红", "粉底", "眼影", "洗面奶", "乳液", "防晒", "美白", "玻尿酸", "卸妆", "面霜", "唇膏", "美容"],
    "女装服饰": ["连衣裙", "裙子", "女装", "上衣", "T恤", "衬衫", "外套", "风衣", "大衣", "毛衣", "针织", "雪纺", "旗袍", "半身裙", "打底", "孕妇装", "裤子", "牛仔"],
    "食品零食": ["零食", "坚果", "饼干", "糕点", "巧克力", "果干", "肉干", "牛肉", "鱼干", "蜜饯", "特产", "茶叶", "咖啡", "奶粉", "调味", "速食", "酱"],
    "母婴用品": ["婴儿", "宝宝", "儿童", "奶瓶", "纸尿裤", "玩具", "早教", "孕妇", "母婴", "童装", "启蒙", "积木", "安全座椅"],
    "家居家纺": ["床品", "四件套", "毛巾", "浴巾", "窗帘", "抱枕", "地毯", "收纳", "家居", "被子", "枕头", "床单", "被套"],
    "数码电器": ["手机", "电脑", "耳机", "充电", "数据线", "键盘", "鼠标", "音箱", "平板", "相机", "U盘", "移动电源"],
    "家用电器": ["空调", "冰箱", "洗衣机", "电视", "微波炉", "电饭煲", "吸尘器", "油烟机", "燃气灶", "热水器", "净水器", "电磁炉"],
    "运动户外": ["运动", "跑步", "健身", "登山", "户外", "自行车", "帐篷", "头盔", "球", "瑜伽", "泳衣"],
    "图书音像": ["图书", "书", "书籍", "DVD", "CD", "光盘", "教材", "小说", "文学", "杂志"],
    "汽车用品": ["汽车", "车载", "座垫", "车膜", "机油", "车灯", "轮胎", "滤芯", "空调格", "导航"],
    "家居建材": ["门锁", "五金", "灯具", "开关", "插座", "水龙头", "马桶", "瓷砖", "油漆", "工具"],
    "箱包配饰": ["包", "钱包", "手提包", "双肩包", "拉杆箱", "腰带", "墨镜", "手表", "围巾", "帽子", "项链", "手链", "耳环"],
}


def classify_by_title(title):
    """根据商品标题关键词判断类目"""
    for cat, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in title:
                return cat
    return "综合百货"


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # ─── Step 1: 扫描行为日志，统计频率 ───
    print("📊 Step 1: 扫描行为日志...")
    item_counter = Counter()
    user_counter = Counter()
    action_counter = Counter()
    total_logs = 0

    with open(LOGS_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            item_counter[row["item_id"]] += 1
            user_counter[row["user_id"]] += 1
            action_counter[row["action"]] += 1
            total_logs += 1
            if total_logs % 1_000_000 == 0:
                print(f"  ...已扫描 {total_logs:,} 行")

    print(f"  ✅ 总行为: {total_logs:,}")
    print(f"  ✅ 不同用户: {len(user_counter):,}")
    print(f"  ✅ 不同商品: {len(item_counter):,}")
    print(f"  ✅ Action分布: {dict(action_counter)}")

    # ─── Step 2: 筛选 Top 用户和商品 ───
    print(f"\n🎯 Step 2: 筛选 Top {TOP_USERS} 用户 + Top {TOP_PRODUCTS} 商品...")
    top_user_ids = {u for u, _ in user_counter.most_common(TOP_USERS)}
    top_item_ids = {i for i, _ in item_counter.most_common(TOP_PRODUCTS)}
    print(f"  ✅ 选取 {len(top_user_ids)} 用户, {len(top_item_ids)} 商品")

    # ─── Step 3: 加载商品详情 ───
    print("\n📦 Step 3: 加载商品详情...")
    product_details = {}
    loaded = 0
    with open(PRODUCT_FILE, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            iid = row.get("item_id", "")
            if iid in top_item_ids:
                product_details[iid] = {
                    "title": row.get("title", "").strip(),
                    "pict_url": row.get("pict_url", ""),
                    "raw_category": row.get("category", ""),
                    "brand_id": row.get("brand_id", ""),
                    "seller_id": row.get("seller_id", ""),
                }
                loaded += 1
                if loaded >= len(top_item_ids):
                    break
            if loaded % 500 == 0 and loaded > 0:
                print(f"  ...已找到 {loaded}/{len(top_item_ids)} 个商品")

    print(f"  ✅ 已匹配 {len(product_details)}/{len(top_item_ids)} 个商品详情")

    # ─── Step 4: 构建商品列表 ───
    print("\n🏗️ Step 4: 构建商品列表...")
    products = []
    category_counter = Counter()
    idx = 0
    for iid in top_item_ids:
        detail = product_details.get(iid, {})
        title = detail.get("title", f"天猫商品{iid}")

        # 清理 title: 去多余空格
        title = re.sub(r"\s+", " ", title).strip()
        if len(title) > 40:
            title = title[:40] + "..."

        category = classify_by_title(detail.get("title", ""))
        category_counter[category] += 1

        item_count = item_counter.get(iid, 0)
        hot_score = min(100, int(50 + item_count * 0.02))
        ctr = round(3 + (hash(iid) % 100) * 0.08, 1)

        # 商品标签
        tags = []
        if item_count > item_counter.most_common(200)[-1][1]:
            tags.append("热销")
        if item_count > item_counter.most_common(50)[-1][1]:
            tags.append("爆款")
        if not tags:
            tags.append("精选")

        products.append({
            "id": idx + 1,
            "itemId": iid,
            "name": title,
            "category": category,
            "rawCategory": detail.get("raw_category", ""),
            "price": round(10 + (hash(iid) % 500) * 0.5, 1),
            "originalPrice": round(15 + (hash(iid) % 500) * 0.7, 1),
            "shop": f"天猫店铺{detail.get('seller_id', 's' + str(hash(iid) % 10000))}",
            "brandId": detail.get("brand_id", ""),
            "pictUrl": detail.get("pict_url", ""),
            "stock": 20 + (hash(iid) % 200),
            "tags": tags,
            "hotScore": hot_score,
            "ctr": ctr,
            "online": True,
            "behaviorCount": item_count,
        })
        idx += 1

    print(f"  ✅ 生成 {len(products)} 个商品")
    print(f"  类目分布: {dict(category_counter.most_common(15))}")

    # ─── Step 5: 提取交叉行为 ───
    print("\n📋 Step 5: 提取交叉行为...")
    # 建 itemId -> product index 映射
    item_id_to_idx = {p["itemId"]: p for p in products}
    behaviors = []
    behavior_action_counter = Counter()

    with open(LOGS_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            uid = row["user_id"]
            iid = row["item_id"]
            action = row["action"]
            vtime = row.get("vtime", "")

            if uid in top_user_ids and iid in top_item_ids:
                mapped_action = ACTION_MAP.get(action, action)
                product = item_id_to_idx.get(iid)
                category = product["category"] if product else "综合百货"

                # 每条 click 附带一条 view（模拟浏览行为）
                if mapped_action == "click":
                    behaviors.append({
                        "userId": uid,
                        "productId": product["id"] if product else 0,
                        "itemId": iid,
                        "category": category,
                        "action": "view",
                        "vtime": vtime,
                    })
                    behavior_action_counter["view"] += 1

                behaviors.append({
                    "userId": uid,
                    "productId": product["id"] if product else 0,
                    "itemId": iid,
                    "category": category,
                    "action": mapped_action,
                    "vtime": vtime,
                })
                behavior_action_counter[mapped_action] += 1

    # 按时间排序
    behaviors.sort(key=lambda x: x.get("vtime", ""))

    print(f"  ✅ 提取 {len(behaviors):,} 条行为")
    print(f"  Action分布: {dict(behavior_action_counter)}")

    # ─── Step 6: 构建统计数据 ───
    print("\n📈 Step 6: 构建统计数据...")

    # 用户活跃度分层
    user_behavior_counts = Counter()
    for b in behaviors:
        user_behavior_counts[b["userId"]] += 1

    counts = list(user_behavior_counts.values())
    if counts:
        avg = sum(counts) / len(counts)
        high = sum(1 for c in counts if c > avg * 2)
        mid = sum(1 for c in counts if avg * 0.5 <= c <= avg * 2)
        low = sum(1 for c in counts if c < avg * 0.5)
    else:
        high, mid, low = 0, 0, 0

    # 热门推荐商品
    item_behavior_in_subset = Counter()
    for b in behaviors:
        item_behavior_in_subset[b["itemId"]] += 1
    hot_items = [{"itemId": iid, "count": cnt} for iid, cnt in item_behavior_in_subset.most_common(50)]

    # 覆盖率
    unique_users_in_behaviors = len(user_behavior_counts)
    covered = int(unique_users_in_behaviors * 0.72)

    summary = {
        "dataset": "tmall",
        "source": "天猫推荐数据集 Rec-Tmall",
        "totalLogs": total_logs,
        "users": len(user_counter),
        "items": len(item_counter),
        "subsetUsers": len(top_user_ids),
        "subsetItems": len(top_item_ids),
        "subsetBehaviors": len(behaviors),
        "actionDistribution": dict(behavior_action_counter),
        "categoryDistribution": dict(category_counter),
        "timeRange": {
            "start": behaviors[0]["vtime"] if behaviors else "",
            "end": behaviors[-1]["vtime"] if behaviors else "",
        },
    }

    ops = {
        "audienceBuckets": {
            "high": high,
            "mid": mid,
            "low": low,
            "total": len(user_behavior_counts),
        },
        "strategyReach": {
            "recommend": covered,
            "search": int(unique_users_in_behaviors * 0.45),
            "push": int(unique_users_in_behaviors * 0.28),
        },
        "hotRecommendedItems": hot_items,
        "conversionFunnel": {
            "view": behavior_action_counter.get("view", 0),
            "click": behavior_action_counter.get("click", 0),
            "fav": behavior_action_counter.get("fav", 0),
            "cart": behavior_action_counter.get("cart", 0),
            "buy": behavior_action_counter.get("buy", 0),
        },
    }

    # ─── Step 7: 写入 JSON ───
    print("\n💾 Step 7: 写入 JSON 文件...")

    def write_json(name, data):
        path = os.path.join(OUTPUT_DIR, name)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        size_mb = os.path.getsize(path) / 1024 / 1024
        print(f"  ✅ {name}: {size_mb:.1f} MB")

    write_json("tmall-products.json", products)
    write_json("tmall-behaviors.json", behaviors)
    write_json("tmall-summary.json", summary)
    write_json("tmall-ops.json", ops)

    print(f"\n🎉 完成！输出目录: {OUTPUT_DIR}")
    print(f"  商品: {len(products)} 个")
    print(f"  行为: {len(behaviors):,} 条")
    print(f"  类目: {len(category_counter)} 个")


if __name__ == "__main__":
    main()
