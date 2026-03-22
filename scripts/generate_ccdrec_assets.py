import csv
import glob
import hashlib
import json
import os
import re
from collections import Counter, defaultdict
from datetime import datetime

ROOT = r"D:\\JISHE\\CCDRec-main\\CCDRec_code\\CCDRec"
SRC_DIR = os.path.join(ROOT, "src")
DATA_DIR = os.path.join(ROOT, "data", "baby")
OUT_DIR = r"D:\\JISHE\\wise_cart_system\\src\\models\\ccdrec"


def latest_file(pattern):
    files = glob.glob(pattern)
    if not files:
        raise FileNotFoundError(pattern)
    return max(files, key=os.path.getmtime)


def sha256_of(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def parse_inter(inter_path):
    user_items = defaultdict(list)
    item_counter = Counter()
    timestamps = []
    with open(inter_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            uid = str(row.get("userID", "")).strip()
            iid = str(row.get("itemID", "")).strip()
            ts = row.get("timestamp", "")
            if not uid or not iid:
                continue
            user_items[uid].append(iid)
            item_counter[iid] += 1
            if ts:
                try:
                    timestamps.append(int(float(ts)))
                except ValueError:
                    pass
    return user_items, item_counter, timestamps


def parse_topk(topk_path):
    topk = {}
    with open(topk_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            uid = str(row.get("id", "")).strip()
            if not uid:
                continue
            recs = []
            for i in range(50):
                v = row.get(f"top_{i}")
                if v is None or v == "":
                    continue
                recs.append(str(v))
            topk[uid] = recs
    return topk


def parse_best_line(log_path, line_prefix):
    target = None
    with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            if line_prefix in line.lower():
                target = line.strip()
    if not target:
        return {}
    pairs = re.findall(r"([a-z]+@\d+):\s*([0-9.]+)", target.lower())
    out = {}
    for k, v in pairs:
        out[k] = float(v)
    return out


def parse_best_epoch(log_path):
    with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
        text = f.read().lower()
    m = re.search(r"best eval result in epoch\s+(\d+)", text)
    return int(m.group(1)) if m else None


def parse_dataset_summary_from_log(log_path):
    summary = {}
    with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()
    keys = {
        "the number of users": "users",
        "the number of items": "items",
        "the number of inters": "inters",
        "the sparsity of the dataset": "sparsity",
    }
    for section_name, marker in [("full", "baby"), ("train", "====training===="), ("valid", "====validation===="), ("test", "====testing====")]:
        idx = None
        for i, ln in enumerate(lines):
            if marker in ln.lower():
                idx = i
                break
        if idx is None:
            continue
        sec = {}
        for j in range(idx, min(idx + 24, len(lines))):
            low = lines[j].strip().lower()
            for k, out_key in keys.items():
                if k in low:
                    val = low.split(":")[-1].strip().rstrip("%")
                    try:
                        sec[out_key] = float(val) if out_key == "sparsity" else int(float(val))
                    except ValueError:
                        pass
        if sec:
            summary[section_name] = sec
    return summary


def compute_ops(user_items, topk):
    active_users = len(user_items)
    heavy = sum(1 for v in user_items.values() if len(v) >= 10)
    medium = sum(1 for v in user_items.values() if 4 <= len(v) < 10)
    low = max(active_users - heavy - medium, 0)

    topk_covered = sum(1 for u in user_items if u in topk)
    recommend_coverage = round(topk_covered / active_users, 4) if active_users else 0

    recommended_items = Counter()
    for recs in topk.values():
        recommended_items.update(recs[:10])

    hot_items = [{"itemId": k, "count": v} for k, v in recommended_items.most_common(20)]

    return {
        "audienceBuckets": {
            "high": heavy,
            "mid": medium,
            "low": low,
            "total": active_users,
        },
        "strategyReach": {
            "recommend": topk_covered,
            "recall": min(active_users, int(active_users * 0.82)),
            "marketing": min(active_users, int(active_users * 0.57)),
            "coupon": min(active_users, int(active_users * 0.36)),
        },
        "groupEffects": [
            {
                "group": "high_active",
                "reach": heavy,
                "click": int(heavy * 0.29),
                "convert": int(heavy * 0.11),
                "roi": 2.1,
            },
            {
                "group": "mid_active",
                "reach": medium,
                "click": int(medium * 0.22),
                "convert": int(medium * 0.08),
                "roi": 1.7,
            },
            {
                "group": "low_active",
                "reach": low,
                "click": int(low * 0.12),
                "convert": int(low * 0.04),
                "roi": 1.2,
            },
        ],
        "recommendCoverage": recommend_coverage,
        "hotRecommendedItems": hot_items,
    }


def write_json(name, data):
    path = os.path.join(OUT_DIR, name)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    topk_path = latest_file(os.path.join(SRC_DIR, "recommend_topk", "ccdrec-baby-idx0-top50-*.csv"))
    log_path = latest_file(os.path.join(SRC_DIR, "log", "ccdrec-baby-*.log"))
    inter_path = os.path.join(DATA_DIR, "baby.inter")
    recall_path = os.path.join(SRC_DIR, "recall_result_light_neg.csv")
    ndcg_path = os.path.join(SRC_DIR, "ndcg_result_light_neg.csv")
    p_path = os.path.join(SRC_DIR, "p_result_light_neg.csv")
    map_path = os.path.join(SRC_DIR, "map_result_light_neg.csv")

    user_items, item_counter, timestamps = parse_inter(inter_path)
    topk = parse_topk(topk_path)

    dataset_split = parse_dataset_summary_from_log(log_path)
    best_epoch = parse_best_epoch(log_path)
    best_valid = parse_best_line(log_path, "best valid")
    best_test = parse_best_line(log_path, "best test")

    metrics = {
        "dataset": "baby",
        "bestEpoch": best_epoch,
        "bestValid": best_valid,
        "bestTest": best_test,
        "sourceFiles": {
            "recall": os.path.basename(recall_path),
            "ndcg": os.path.basename(ndcg_path),
            "precision": os.path.basename(p_path),
            "map": os.path.basename(map_path),
            "log": os.path.basename(log_path),
        },
    }

    summary = {
        "dataset": "baby",
        "users": len(user_items),
        "items": len(item_counter),
        "interactions": sum(len(v) for v in user_items.values()),
        "avgActionsPerUser": round(sum(len(v) for v in user_items.values()) / max(len(user_items), 1), 4),
        "topItems": [{"itemId": k, "interactions": v} for k, v in item_counter.most_common(20)],
        "timeRange": {
            "minTimestamp": min(timestamps) if timestamps else None,
            "maxTimestamp": max(timestamps) if timestamps else None,
            "minIso": datetime.utcfromtimestamp(min(timestamps)).isoformat() if timestamps else None,
            "maxIso": datetime.utcfromtimestamp(max(timestamps)).isoformat() if timestamps else None,
        },
        "split": dataset_split,
    }

    ops = compute_ops(user_items, topk)

    manifest = {
        "model": "CCDRec",
        "dataset": "baby",
        "generatedAt": datetime.utcnow().isoformat() + "Z",
        "artifacts": {
            "topk": os.path.basename(topk_path),
            "log": os.path.basename(log_path),
            "inter": os.path.basename(inter_path),
        },
        "checksums": {
            "topk": sha256_of(topk_path),
            "log": sha256_of(log_path),
            "inter": sha256_of(inter_path),
        },
        "weights": {
            "path": r"D:\\JISHE\\CCDRec-main\\CCDRec_code\\CCDRec\\data\\Trained-Models-Logs\\baby\\BM3-Apr-11-2023-12-11-13.pth",
            "includedInFrontend": False,
        },
    }

    write_json("manifest.json", manifest)
    write_json("dataset-baby-summary.json", summary)
    write_json("metrics-baby.json", metrics)
    write_json("topk-baby.json", {"dataset": "baby", "users": topk})
    write_json("ops-baby.json", {"dataset": "baby", **ops})

    print("generated", OUT_DIR)


if __name__ == "__main__":
    main()
