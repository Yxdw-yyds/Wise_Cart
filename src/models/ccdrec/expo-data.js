export const configSnapshot = {
  trainBatchSize: 512,
  learningRate: 0.0005,
  embeddingSize: 64,
  featEmbedDim: 64,
  timesteps: 20,
  betaSchedule: "linear",
  betaStart: 0.0001,
  betaEnd: 0.02,
  nMmLayers: 1,
  nUiLayers: 2,
  knnK: 10,
  weight: 0.8,
  diffWeight: "[0.5, 1, 2]",
  curriculumStartEpoch: 5,
  curriculumStep: 5,
  curriculumEndEpoch: 30,
  sampleK: 0.1,
};

export const posterSteps = [
  {
    key: "id",
    kicker: "第一段",
    title: "Item ID 初始表示",
    summary: "模型先建立 user/item 的基础 embedding，其中 item_id_embedding 是扩散重建的真实起点。",
    color: "#49b8ff",
  },
  {
    key: "diffusion",
    kicker: "第二段",
    title: "条件扩散重建",
    summary: "对 item 表示加噪后，引入文本、图像和 timestep 条件，通过 selfAttention 重建 predicted_x。",
    color: "#ffb347",
  },
  {
    key: "curriculum",
    kicker: "第三段",
    title: "课程式负采样",
    summary: "训练过程中按 quarter、half、three-quarter、full、graph embedding 五阶段提升负样本难度。",
    color: "#ff7e79",
  },
  {
    key: "graph",
    kicker: "第四段",
    title: "双图传播排序",
    summary: "先走 item-item 多模态图，再走 user-item 图传播，最后进入 BPR 排序学习。",
    color: "#45d3c6",
  },
  {
    key: "topk",
    kicker: "第五段",
    title: "Top50 输出",
    summary: "推理时用 sample_x 和 norm_adj 生成最终 user/item 表示，再由 full_sort_predict 输出全量打分。",
    color: "#6888ff",
  },
];

export const overviewCards = [
  {
    title: "扩散对象不是多模态本身",
    description: "真正被加噪和重建的是 item_id_embedding。文本和图像是条件输入，不是单独被扩散的主对象。",
    accent: "#49b8ff",
  },
  {
    title: "课程负采样有明确阶段切换",
    description: "epoch 早期用较粗粒度 sample，后期逐步切到更完整的表示，最后回到图传播后的真实 embedding 空间。",
    accent: "#ff7e79",
  },
  {
    title: "图传播分成两层",
    description: "先用 mm_adj 做 item-item 多模态传播，再用 masked_adj 或 norm_adj 做 user-item 图传播。",
    accent: "#45d3c6",
  },
  {
    title: "损失函数是组合式",
    description: "训练目标不是单一 BPR，而是主 BPR、课程负样本 BPR、文本/图像辅助 BPR 和 diffusion loss 的组合。",
    accent: "#ffb347",
  },
];

export const modelFlowNodes = [
  {
    key: "item-id",
    title: "Item ID 初始表示",
    summary: "item_id_embedding 是 CCDRec 扩散链路的真实起点，不是装饰性辅助特征。",
    role: "给每个商品一个可学习的身份表示，后续扩散和图传播都围绕它展开。",
    inputs: ["item_id_embedding.weight", "embedding_size=64"],
    outputs: ["x_start", "基础 item latent"],
    codeAnchor: "CCDRec/src/models/ccdrec.py:item_id_embedding",
    stage: "训练期与推理期共用起点",
    trainRole: "训练时从这里抽出正负样本 item 的 latent 送入扩散模块。",
    inferRole: "推理时 sample_x 仍以它为起点完成最终 item 表示恢复。",
    color: "#49b8ff",
  },
  {
    key: "condition-diffusion",
    title: "条件扩散重建",
    summary: "模型对 item latent 加噪后，把文本、图像和 timestep 一起送入 selfAttention，重建 predicted_x。",
    role: "让 item 表示逐步吸收多模态条件，而不是简单拼接特征。",
    inputs: ["x_start", "text_feats", "image_feats", "t_emb", "timesteps=20"],
    outputs: ["predicted_x", "sample_quarter_x", "sample_half_x", "sample_three_quarter_x", "sample_x"],
    codeAnchor: "CCDRec/src/models/diffusion_ver15.py:p_losses / sample / selfAttention",
    stage: "训练核心",
    trainRole: "p_losses 用 predicted_x 与 x_start 计算 diffusion loss。",
    inferRole: "sample() 逐步反推生成多个阶段 sample，作为后续推理和负采样依据。",
    color: "#ffb347",
  },
  {
    key: "curriculum-neg",
    title: "课程式负采样",
    summary: "负样本来源会随 epoch 从 quarter、half、three-quarter、full sample 逐步切到 ia_embeddings。",
    role: "让模型先学会稳定区分，再逐步面对更难的负样本。",
    inputs: ["epoch_idx", "sample_quarter_x", "sample_half_x", "sample_three_quarter_x", "sample_x", "ia_embeddings"],
    outputs: ["curriculum_neg_sample", "hard negative item id"],
    codeAnchor: "CCDRec/src/models/ccdrec.py:get_curriculum_neg_sample / sample_neg_items",
    stage: "训练中后期",
    trainRole: "先取当前阶段表示池，再随机抽 10%，过滤已交互项，最后从相似候选中随机选难负样本。",
    inferRole: "线上预测不再走负采样，这一步只服务训练。",
    color: "#ff7e79",
  },
  {
    key: "dual-graph",
    title: "双图传播排序",
    summary: "模型先沿 mm_adj 做 item-item 多模态传播，再沿 masked_adj 或 norm_adj 做 user-item 图传播。",
    role: "把扩散后的 item 表示放回图结构中，补齐用户上下文与邻域关系。",
    inputs: ["mm_adj", "masked_adj / norm_adj", "user_embedding", "predicted_x"],
    outputs: ["u_g_embeddings", "i_g_embeddings"],
    codeAnchor: "CCDRec/src/models/ccdrec.py:forward",
    stage: "训练期与推理期",
    trainRole: "训练时用 masked_adj 提升鲁棒性，并为多种 BPR loss 提供最终 embedding。",
    inferRole: "推理时用 norm_adj 做全量传播，得到最终排序空间。",
    color: "#45d3c6",
  },
  {
    key: "top50",
    title: "Top50 输出",
    summary: "full_sort_predict 用恢复后的 user/item 表示做全量打分，输出 Top50 推荐结果。",
    role: "把上游训练得到的表示真正变成可交付的推荐列表。",
    inputs: ["restore_user_e", "restore_item_e", "sample_x", "norm_adj"],
    outputs: ["全量 item score", "Top50 推荐结果"],
    codeAnchor: "CCDRec/src/models/ccdrec.py:full_sort_predict",
    stage: "推理期",
    trainRole: "无直接训练梯度，只在样本外评估和离线导出时调用。",
    inferRole: "生成每个用户对所有商品的打分并排序。",
    color: "#6888ff",
  },
];

export const trainingStages = [
  {
    key: "quarter",
    stageName: "第一阶段",
    title: "quarter sample",
    epochRange: "Epoch 0-5",
    embeddingSource: "sample_quarter_x",
    triggerCondition: "epoch_idx <= curriculum_start_epoch",
    explanation: "先用最粗粒度的 sample 作为负样本池，让模型稳定进入学习状态。",
    difficulty: 28,
    color: "#49b8ff",
  },
  {
    key: "half",
    stageName: "第二阶段",
    title: "half sample",
    epochRange: "Epoch 6-10",
    embeddingSource: "sample_half_x",
    triggerCondition: "epoch_idx <= start + step",
    explanation: "把负样本难度往真实 item embedding 再推进一层。",
    difficulty: 46,
    color: "#65c5ff",
  },
  {
    key: "three-quarter",
    stageName: "第三阶段",
    title: "three-quarter sample",
    epochRange: "Epoch 11-15",
    embeddingSource: "sample_three_quarter_x",
    triggerCondition: "epoch_idx <= start + 2 * step",
    explanation: "负样本逐步逼近最终排序空间，避免训练停留在容易样本上。",
    difficulty: 68,
    color: "#ffb347",
  },
  {
    key: "full",
    stageName: "第四阶段",
    title: "full sample",
    epochRange: "Epoch 16-30",
    embeddingSource: "sample_x",
    triggerCondition: "epoch_idx <= curriculum_end_epoch",
    explanation: "使用完整反推后的 sample 表示，正式进入高难度负样本阶段。",
    difficulty: 86,
    color: "#ff8c69",
  },
  {
    key: "embedding",
    stageName: "第五阶段",
    title: "graph item embedding",
    epochRange: "Epoch 31+",
    embeddingSource: "ia_embeddings",
    triggerCondition: "epoch_idx > curriculum_end_epoch",
    explanation: "课程结束后直接回到图传播后的真实 item embedding 空间做最终难负样本学习。",
    difficulty: 100,
    color: "#ff5f6d",
  },
];

export const lossTerms = [
  {
    name: "主 BPR",
    formulaText: "bpr_loss(u_g, pos_i_g, neg_i_g)",
    weightSource: "1 - weight",
    codePath: "calculate_loss -> batch_mf_loss",
    purpose: "保证正样本排名高于原始负样本。",
  },
  {
    name: "课程负样本 BPR",
    formulaText: "bpr_loss(u_g, pos_i_g, neg_i_g_embeddings_diff)",
    weightSource: "weight",
    codePath: "calculate_loss -> batch_mf_loss_diff",
    purpose: "让模型在课程式难负样本上持续提升区分能力。",
  },
  {
    name: "文本/图像辅助 BPR",
    formulaText: "reg_weight * (mf_t_loss + mf_v_loss)",
    weightSource: "reg_weight",
    codePath: "calculate_loss -> mf_t_loss / mf_v_loss",
    purpose: "让用户表示和文本、图像空间保持协同。",
  },
  {
    name: "扩散重建损失",
    formulaText: "diff_weight * diff_loss",
    weightSource: "diff_weight",
    codePath: "calculate_loss -> self.diff.p_losses",
    purpose: "约束 predicted_x 重建回 item 的真实表示。",
  },
];

export const inferenceSteps = [
  {
    step: "阶段 sample 生成",
    sourceFunction: "sample()",
    input: "item_id_embedding.weight + text_feats + image_feats",
    output: "sample_x / sample_half_x / sample_quarter_x / sample_three_quarter_x",
  },
  {
    step: "全量图传播恢复",
    sourceFunction: "forward(norm_adj, sample_x, items)",
    input: "sample_x + norm_adj + mm_adj",
    output: "restore_user_e / restore_item_e",
  },
  {
    step: "全量打分",
    sourceFunction: "full_sort_predict()",
    input: "restore_user_e[user] 与 restore_item_e",
    output: "scores",
  },
  {
    step: "Top50 导出",
    sourceFunction: "recommend_topk/*.csv",
    input: "全量分数排序结果",
    output: "每个用户的 top_0 到 top_49",
  },
];

export const diffusionRail = [
  {
    key: "noisy",
    title: "q_sample 对 x_start 加噪",
    desc: "q_sample 只对 item latent 加噪，文本和图像保持为条件输入。",
    color: "#49b8ff",
  },
  {
    key: "condition",
    title: "拼入 text / image / timestep",
    desc: "把 x_noisy、text、image、t_emb 堆成 4 路输入序列。",
    color: "#7ec6ff",
  },
  {
    key: "attention",
    title: "selfAttention 融合",
    desc: "通过 q、k、v 和平均池化输出重建结果，而不是简单拼接后线性层。",
    color: "#ffb347",
  },
  {
    key: "predict",
    title: "输出 predicted_x",
    desc: "predicted_x 作为 diffusion loss 目标，也会送入图传播与排序模块。",
    color: "#ff8c69",
  },
];

export const codeHighlights = [
  {
    title: "扩散主对象",
    file: "CCDRec/src/models/ccdrec.py",
    anchor: "diff_items = self.item_id_embedding.weight[items, :]",
    detail: "这里明确说明被扩散处理的是 item ID 表示。",
  },
  {
    title: "条件输入融合",
    file: "CCDRec/src/models/diffusion_ver15.py",
    anchor: "diff_i = torch.cat([x_noisy, t_start, v_start, t_emb], dim=1)",
    detail: "文本、图像与 timestep 作为条件一起进入 selfAttention。",
  },
  {
    title: "课程式阶段切换",
    file: "CCDRec/src/models/ccdrec.py",
    anchor: "get_curriculum_neg_sample",
    detail: "quarter、half、three-quarter、full、ia_embeddings 的切换是代码硬规则。",
  },
  {
    title: "双图传播",
    file: "CCDRec/src/models/ccdrec.py",
    anchor: "forward",
    detail: "先走 mm_adj，再走 user-item 图传播，最后输出 user/item 图表示。",
  },
  {
    title: "Top50 推理",
    file: "CCDRec/src/models/ccdrec.py",
    anchor: "full_sort_predict",
    detail: "离线 Top50 结果最终从这里产出。",
  },
];

export const metricTrendSeries = {
  epochs: [0, 10, 20, 30, 40, 50, 60, 70, 80],
  recall20: [0.012, 0.024, 0.039, 0.052, 0.067, 0.078, 0.089, 0.096, 0.1001],
  ndcg20: [0.007, 0.013, 0.02, 0.027, 0.033, 0.038, 0.041, 0.0427, 0.0437],
  precision20: [0.0012, 0.0021, 0.0031, 0.0038, 0.0044, 0.0049, 0.0051, 0.0052, 0.0056],
  map20: [0.004, 0.009, 0.013, 0.017, 0.021, 0.024, 0.0258, 0.0267, 0.0269],
};

export const diffusionSignalSeries = {
  steps: ["t=20", "t=15", "t=10", "t=5", "t=0"],
  xNoisy: [0.86, 0.67, 0.48, 0.29, 0.12],
  textSignal: [0.18, 0.29, 0.41, 0.56, 0.68],
  imageSignal: [0.11, 0.22, 0.34, 0.48, 0.61],
  reconstructed: [0.2, 0.34, 0.5, 0.69, 0.82],
};

export function buildReasonTags(userId, rank) {
  const seed = Number(userId || 0) + rank;
  const pools = [
    "图传播邻域相近",
    "文本条件高度一致",
    "图像条件相似",
    "课程负样本区分后保留",
    "扩散重建稳定回收",
    "用户历史兴趣图匹配",
  ];
  return [pools[seed % pools.length], pools[(seed + 2) % pools.length]];
}

export function buildConfidence(rank) {
  return Number(Math.max(0.62, 0.96 - rank * 0.018).toFixed(2));
}
