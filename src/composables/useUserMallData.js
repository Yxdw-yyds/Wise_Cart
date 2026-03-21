import { computed, ref } from "vue";

const CATEGORY_LABELS = {
  drink: "饮料酒水",
  snack: "休闲零食",
  daily: "日化家清",
  food: "粮油速食",
  beauty: "个护美妆",
  digital: "数码电器",
};

const ACTION_WEIGHT = {
  view: 1,
  fav: 2.5,
  cart: 3.5,
  buy: 5,
};

function getPriceBand(price) {
  if (price < 50) return "low";
  if (price < 150) return "mid";
  return "high";
}

function createProducts() {
  const seed = [
    ["无糖气泡水 500ml", "drink", 6.9, "即饮旗舰店", 85],
    ["高蛋白酸奶 12杯", "drink", 39.9, "鲜活乳品店", 88],
    ["精酿白啤 330ml*6", "drink", 45, "精酿酒馆", 80],
    ["黑巧能量棒 20支", "snack", 59, "轻食优选", 77],
    ["坚果组合装 750g", "snack", 89, "每日坚果", 82],
    ["麻辣牛肉干 500g", "snack", 68, "川味零食铺", 73],
    ["洗衣凝珠 120颗", "daily", 109, "家庭清洁馆", 75],
    ["除菌湿巾 80抽*6", "daily", 49, "家庭清洁馆", 70],
    ["香氛沐浴露 750ml", "daily", 39.9, "个护生活", 66],
    ["东北香米 10kg", "food", 99, "米面粮油馆", 71],
    ["黑椒牛肉意面 6盒", "food", 79, "速食优选", 76],
    ["有机燕麦片 1kg", "food", 36, "轻食优选", 74],
    ["玻尿酸补水面膜 20片", "beauty", 129, "妆品直供", 83],
    ["维C焕亮精华 30ml", "beauty", 219, "妆品直供", 78],
    ["氨基酸洁面乳 200ml", "beauty", 89, "个护生活", 72],
    ["降噪蓝牙耳机", "digital", 299, "数码官方店", 84],
    ["便携电动牙刷", "digital", 169, "数码官方店", 69],
    ["磁吸快充充电宝 20000mAh", "digital", 139, "数码官方店", 81],
  ];

  return seed.map((row, idx) => {
    const [name, category, price, shop, hotScore] = row;
    return {
      id: idx + 1,
      name,
      category,
      price,
      originalPrice: Math.round(price * 1.35),
      shop,
      stock: 20 + ((idx * 17) % 120),
      tags: idx % 3 === 0 ? ["新品"] : idx % 4 === 0 ? ["爆款"] : ["精选"],
      hotScore,
      ctr: Number((5 + ((idx * 1.13) % 8)).toFixed(1)),
      online: idx % 11 !== 0,
      imgBg: `linear-gradient(135deg, hsl(${(idx * 27) % 360}, 85%, 78%), hsl(${(idx * 27 + 45) % 360}, 88%, 68%))`,
    };
  });
}

function createBehaviorLog() {
  const now = Date.now();
  const base = [
    [2, "drink", "view", 1],
    [2, "drink", "buy", 2],
    [3, "drink", "fav", 3],
    [4, "snack", "view", 4],
    [5, "snack", "cart", 5],
    [5, "snack", "buy", 6],
    [6, "snack", "view", 7],
    [9, "daily", "view", 8],
    [7, "daily", "cart", 9],
    [10, "food", "view", 10],
    [11, "food", "buy", 11],
    [13, "beauty", "view", 12],
    [16, "digital", "view", 13],
    [18, "digital", "fav", 14],
  ];

  return base.map(([productId, category, action, days]) => ({
    userId: "mall_user",
    productId,
    category,
    action,
    ts: now - days * 86400000,
  }));
}

export function buildUserInterestVector(behaviorLog) {
  const base = {
    drink: 1,
    snack: 1,
    daily: 1,
    food: 1,
    beauty: 1,
    digital: 1,
  };
  behaviorLog.forEach((event) => {
    base[event.category] += ACTION_WEIGHT[event.action] || 0;
  });
  return base;
}

export function buildGuessLike(products, interestVector, activeCategory = "all") {
  const candidates = products
    .filter((p) => p.online)
    .filter((p) => activeCategory === "all" || p.category === activeCategory)
    .map((p) => {
      const interest = interestVector[p.category] || 1;
      const score = Number((interest * 10 + p.hotScore * 0.6 + p.ctr * 1.8).toFixed(2));
      let reason = "全站热度较高";
      if (interest >= 8) reason = `最近高频关注${CATEGORY_LABELS[p.category]}`;
      else if (interest >= 5) reason = `相似偏好用户在${CATEGORY_LABELS[p.category]}点击更高`;
      return {
        productId: p.id,
        name: p.name,
        score,
        reason,
        category: p.category,
        price: p.price,
      };
    })
    .sort((a, b) => b.score - a.score);

  return candidates;
}

export function buildTop50(products, interestVector, globalWeight = 0.45, interestWeight = 0.55) {
  const ranked = [];
  for (let i = 0; i < 50; i += 1) {
    const p = products[i % products.length];
    const interestScore = Number(((interestVector[p.category] || 1) * 10 + ((i * 0.7) % 6)).toFixed(2));
    const blended = interestScore * interestWeight + p.hotScore * globalWeight;
    let reason = "兴趣分+热度分综合推荐";
    if (interestScore > 75) reason = `你对${CATEGORY_LABELS[p.category]}兴趣较强`;
    if (p.ctr > 10) reason = `${reason}，且点击率高`;

    ranked.push({
      rank: i + 1,
      productId: p.id,
      name: p.name,
      category: p.category,
      interestScore: Number(blended.toFixed(2)),
      hotScore: p.hotScore,
      ctr: p.ctr,
      reason,
      priceBand: getPriceBand(p.price),
      online: p.online,
    });
  }
  ranked.sort((a, b) => b.interestScore - a.interestScore);
  return ranked.map((item, index) => ({ ...item, rank: index + 1 }));
}

function buildUserProfile(interestVector) {
  const total = Object.values(interestVector).reduce((sum, n) => sum + n, 0) || 1;
  const categoryPercents = Object.fromEntries(
    Object.entries(interestVector).map(([k, v]) => [k, Number(((v / total) * 100).toFixed(1))])
  );
  const sorted = Object.entries(categoryPercents).sort((a, b) => b[1] - a[1]);
  const topCategory = CATEGORY_LABELS[sorted[0][0]];
  const secondCategory = CATEGORY_LABELS[sorted[1][0]];
  const tags = ["高活跃", "价格敏感", "新品偏好", "晚间浏览"];
  if (categoryPercents.digital > 16) tags.push("数码偏好");
  if (categoryPercents.beauty > 16) tags.push("美妆偏好");
  const summary = `当前最感兴趣类目为${topCategory}，其次是${secondCategory}，推荐优先展示高性价比和高点击商品。`;
  return { categoryPercents, tags, summary };
}

export function useUserMallData() {
  const products = ref(createProducts());
  const behaviorLog = ref(createBehaviorLog());
  const activeCategory = ref("all");
  const priceBand = ref("all");
  const onlyOnline = ref(false);
  const top50Sort = ref("interest");
  const guessPage = ref(0);

  const interestVector = computed(() => buildUserInterestVector(behaviorLog.value));
  const guessAll = computed(() =>
    buildGuessLike(products.value, interestVector.value, activeCategory.value)
  );

  const guessLikeList = computed(() => {
    const pageSize = 6;
    const start = (guessPage.value % 3) * pageSize;
    const pool = guessAll.value;
    if (!pool.length) return [];
    return pool.slice(start, start + pageSize).length
      ? pool.slice(start, start + pageSize)
      : pool.slice(0, pageSize);
  });

  const top50Raw = computed(() => buildTop50(products.value, interestVector.value));
  const top50List = computed(() => {
    let list = [...top50Raw.value];
    if (activeCategory.value !== "all") {
      list = list.filter((i) => i.category === activeCategory.value);
    }
    if (priceBand.value !== "all") {
      list = list.filter((i) => i.priceBand === priceBand.value);
    }
    if (onlyOnline.value) {
      list = list.filter((i) => i.online);
    }
    if (top50Sort.value === "hot") {
      list.sort((a, b) => b.hotScore - a.hotScore);
    } else {
      list.sort((a, b) => b.interestScore - a.interestScore);
    }
    return list.map((item, idx) => ({ ...item, rank: idx + 1 })).slice(0, 50);
  });

  const userProfile = computed(() => buildUserProfile(interestVector.value));

  const refreshGuess = () => {
    guessPage.value += 1;
  };

  return {
    products,
    behaviorLog,
    interestVector,
    guessLikeList,
    top50List,
    userProfile,
    activeCategory,
    priceBand,
    onlyOnline,
    top50Sort,
    refreshGuess,
    categoryLabels: CATEGORY_LABELS,
  };
}
