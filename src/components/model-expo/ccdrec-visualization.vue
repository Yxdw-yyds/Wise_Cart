<template>
  <div class="viz-page expo-scroll">
    <div class="gallery-container">
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>CCDRec 实物级图解</h2>
          <p>复刻论文原图风格，观察多模态特征向量的真实流动与演变。</p>
        </div>
        <div class="nav-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="tab-btn"
            :class="[`tab-${tab.id}`, { active: activeTab === tab.id }]"
            @click="switchTab(tab.id)"
          >
            <div class="tab-icon">{{ tab.id }}</div>
            <div class="tab-text">
              <strong>{{ tab.title }}</strong>
              <span>{{ tab.subtitle }}</span>
            </div>
          </button>
        </div>
      </aside>

      <main class="main-view">
        <svg style="position: absolute; width: 0; height: 0">
          <defs>
            <marker
              id="arrowhead"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path
                d="M0,2 L8,5 L0,8 Z"
                fill="#94a3b8"
              />
            </marker>
            <marker
              id="arrow-purple"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path
                d="M0,2 L8,5 L0,8 Z"
                fill="#9333ea"
              />
            </marker>

            <g
              id="icon-user"
              transform="scale(1.2)"
            >
              <circle
                cx="12"
                cy="8"
                r="4"
                fill="#64748b"
              />
              <path
                d="M4 20c0-4 4-6 8-6s8 2 8 6"
                fill="none"
                stroke="#64748b"
                stroke-width="2.5"
                stroke-linecap="round"
              />
            </g>
            <g
              id="icon-item"
              transform="scale(1.2)"
            >
              <rect
                x="4"
                y="8"
                width="16"
                height="12"
                rx="2"
                fill="none"
                stroke="#64748b"
                stroke-width="2.5"
              />
              <path
                d="M8 8V6a4 4 0 0 1 8 0v2"
                fill="none"
                stroke="#64748b"
                stroke-width="2.5"
              />
              <circle
                cx="12"
                cy="14"
                r="1.5"
                fill="#64748b"
              />
            </g>
            <g
              id="icon-image"
              transform="scale(1.2)"
            >
              <rect
                x="3"
                y="4"
                width="18"
                height="16"
                rx="2"
                fill="none"
                stroke="#64748b"
                stroke-width="2.5"
              />
              <circle
                cx="8.5"
                cy="9.5"
                r="1.5"
                fill="#64748b"
              />
              <path
                d="M3 16l5-5 4 4 3-3 6 6"
                fill="none"
                stroke="#64748b"
                stroke-width="2.5"
                stroke-linejoin="round"
              />
            </g>
            <g
              id="icon-text"
              transform="scale(1.2)"
            >
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
                fill="none"
                stroke="#64748b"
                stroke-width="2.5"
              />
              <path
                d="M14 2v6h6M8 13h8M8 17h8"
                fill="none"
                stroke="#64748b"
                stroke-width="2.5"
                stroke-linecap="round"
              />
            </g>

            <g id="vec-u">
              <rect
                x="0"
                y="0"
                width="12"
                height="16"
                rx="2"
                fill="var(--color-user)"
              />
              <rect
                x="14"
                y="0"
                width="12"
                height="16"
                rx="2"
                fill="var(--color-user)"
                opacity="0.8"
              />
              <rect
                x="28"
                y="0"
                width="12"
                height="16"
                rx="2"
                fill="var(--color-user)"
                opacity="0.6"
              />
            </g>
            <g id="vec-i">
              <rect
                x="0"
                y="0"
                width="12"
                height="16"
                rx="2"
                fill="var(--color-item)"
              />
              <rect
                x="14"
                y="0"
                width="12"
                height="16"
                rx="2"
                fill="var(--color-item)"
                opacity="0.8"
              />
              <rect
                x="28"
                y="0"
                width="12"
                height="16"
                rx="2"
                fill="var(--color-item)"
                opacity="0.6"
              />
            </g>
            <g id="vec-v">
              <rect
                x="0"
                y="0"
                width="12"
                height="16"
                rx="2"
                fill="var(--color-image)"
              />
              <rect
                x="14"
                y="0"
                width="12"
                height="16"
                rx="2"
                fill="var(--color-image)"
                opacity="0.8"
              />
              <rect
                x="28"
                y="0"
                width="12"
                height="16"
                rx="2"
                fill="var(--color-image)"
                opacity="0.6"
              />
            </g>
            <g id="vec-t">
              <rect
                x="0"
                y="0"
                width="12"
                height="16"
                rx="2"
                fill="var(--color-text)"
              />
              <rect
                x="14"
                y="0"
                width="12"
                height="16"
                rx="2"
                fill="var(--color-text)"
                opacity="0.8"
              />
              <rect
                x="28"
                y="0"
                width="12"
                height="16"
                rx="2"
                fill="var(--color-text)"
                opacity="0.6"
              />
            </g>
            <g id="vec-d">
              <rect
                x="0"
                y="0"
                width="12"
                height="16"
                rx="2"
                fill="var(--color-diff)"
              />
              <rect
                x="14"
                y="0"
                width="12"
                height="16"
                rx="2"
                fill="var(--color-diff)"
                opacity="0.8"
              />
              <rect
                x="28"
                y="0"
                width="12"
                height="16"
                rx="2"
                fill="var(--color-diff)"
                opacity="0.6"
              />
            </g>
            <g id="vec-noise-1">
              <rect
                x="0"
                y="0"
                width="12"
                height="16"
                rx="2"
                fill="var(--color-item)"
                opacity="0.5"
              />
              <rect
                x="14"
                y="0"
                width="12"
                height="16"
                rx="2"
                fill="var(--color-item)"
                opacity="0.3"
              />
              <rect
                x="28"
                y="0"
                width="12"
                height="16"
                rx="2"
                fill="#cbd5e1"
                stroke="var(--color-item)"
                stroke-width="1"
              />
            </g>
            <g id="vec-noise-2">
              <rect
                x="0"
                y="0"
                width="12"
                height="16"
                rx="2"
                fill="#cbd5e1"
                stroke="var(--color-item)"
                stroke-width="1"
              />
              <rect
                x="14"
                y="0"
                width="12"
                height="16"
                rx="2"
                fill="#cbd5e1"
                stroke="var(--color-item)"
                stroke-width="1"
              />
              <rect
                x="28"
                y="0"
                width="12"
                height="16"
                rx="2"
                fill="#cbd5e1"
                stroke="var(--color-item)"
                stroke-width="1"
              />
            </g>
            <g id="graph-net">
              <line
                x1="10"
                y1="10"
                x2="30"
                y2="15"
                stroke="#2563eb"
                stroke-width="2"
              />
              <line
                x1="30"
                y1="15"
                x2="20"
                y2="35"
                stroke="#2563eb"
                stroke-width="2"
              />
              <line
                x1="10"
                y1="10"
                x2="20"
                y2="35"
                stroke="#2563eb"
                stroke-width="2"
              />
              <line
                x1="30"
                y1="15"
                x2="45"
                y2="10"
                stroke="#2563eb"
                stroke-width="2"
              />
              <circle
                cx="10"
                cy="10"
                r="5"
                fill="#fff"
                stroke="#2563eb"
                stroke-width="2"
              />
              <circle
                cx="30"
                cy="15"
                r="5"
                fill="#fff"
                stroke="#2563eb"
                stroke-width="2"
              />
              <circle
                cx="20"
                cy="35"
                r="5"
                fill="#fff"
                stroke="#2563eb"
                stroke-width="2"
              />
              <circle
                cx="45"
                cy="10"
                r="5"
                fill="#fff"
                stroke="#2563eb"
                stroke-width="2"
              />
            </g>
          </defs>
        </svg>

        <div
          class="diagram"
          :class="{ active: activeTab === 1 }"
          id="view-1"
        >
          <div class="diagram-title">多模态输入与架构总览</div>
          <svg viewBox="0 0 1500 500">
            <rect
              x="280"
              y="40"
              width="180"
              height="120"
              class="bg-area blue"
            />
            <!-- DMA 紫色框：可点击跳转图2 -->
            <g
              @click="switchTab(2)"
              style="cursor: pointer"
              class="hotspot-dma"
            >
              <rect
                x="280"
                y="190"
                width="220"
                height="140"
                class="bg-area purple"
              />
              <text
                x="390"
                y="230"
                class="txt-title"
              >
                DMA 对齐模块
              </text>
              <text
                x="390"
                y="250"
                class="txt-sub"
              >
                条件去噪融合
              </text>
              <text
                x="390"
                y="318"
                text-anchor="middle"
                font-size="11"
                fill="#9333ea"
                font-weight="700"
                opacity="0.9"
              >
                点击查看微观机理 →
              </text>
            </g>
            <!-- CNS 绿色框：可点击跳转图3 -->
            <g
              @click="switchTab(3)"
              style="cursor: pointer"
              class="hotspot-cns"
            >
              <rect
                x="520"
                y="320"
                width="180"
                height="100"
                class="bg-area green"
              />
              <text
                x="610"
                y="360"
                class="txt-title"
              >
                CNS 负采样器
              </text>
              <text
                x="610"
                y="406"
                text-anchor="middle"
                font-size="11"
                fill="#4d7c0f"
                font-weight="700"
                opacity="0.9"
              >
                点击查看负采样 →
              </text>
            </g>
            <text
              x="370"
              y="80"
              class="txt-title"
            >
              协同图编码器
            </text>
            <text
              x="370"
              y="100"
              class="txt-sub"
            >
              Item-Item Graph
            </text>
            <rect
              x="40"
              y="60"
              width="60"
              height="70"
              class="dashed-box"
            />
            <use
              href="#icon-user"
              x="55"
              y="68"
            />
            <text
              x="70"
              y="115"
              class="txt-sub"
            >
              user
            </text>
            <use
              href="#vec-u"
              x="110"
              y="85"
            />
            <text
              x="130"
              y="120"
              class="txt-math"
            >
              e_u
            </text>
            <rect
              x="40"
              y="140"
              width="60"
              height="70"
              class="dashed-box"
            />
            <use
              href="#icon-item"
              x="55"
              y="148"
            />
            <text
              x="70"
              y="195"
              class="txt-sub"
            >
              item
            </text>
            <use
              href="#vec-i"
              x="110"
              y="165"
            />
            <text
              x="130"
              y="200"
              class="txt-math"
            >
              e_i
            </text>
            <rect
              x="40"
              y="240"
              width="60"
              height="70"
              class="dashed-box"
            />
            <use
              href="#icon-image"
              x="55"
              y="248"
            />
            <text
              x="70"
              y="295"
              class="txt-sub"
            >
              image
            </text>
            <use
              href="#vec-v"
              x="110"
              y="265"
            />
            <text
              x="130"
              y="300"
              class="txt-math"
            >
              e_i^v
            </text>
            <rect
              x="40"
              y="320"
              width="60"
              height="70"
              class="dashed-box"
            />
            <use
              href="#icon-text"
              x="55"
              y="328"
            />
            <text
              x="70"
              y="375"
              class="txt-sub"
            >
              text
            </text>
            <use
              href="#vec-t"
              x="110"
              y="345"
            />
            <text
              x="130"
              y="380"
              class="txt-math"
            >
              e_i^t
            </text>
            <use
              href="#graph-net"
              x="345"
              y="110"
              transform="scale(1.2)"
            />
            <path
              id="v1-ug"
              d="M 160 90 C 250 10, 600 10, 750 81"
              class="path-line"
            />
            <path
              id="v1-ig"
              d="M 160 170 C 220 170, 220 100, 280 100"
              class="path-line"
            />
            <path
              id="v1-id"
              d="M 160 170 C 220 170, 220 260, 280 260"
              class="path-line"
            />
            <path
              id="v1-vd"
              d="M 160 270 L 280 270"
              class="path-line"
            />
            <path
              id="v1-td"
              d="M 160 350 C 220 350, 220 290, 280 290"
              class="path-line"
            />
            <path
              id="v1-gl"
              d="M 460 100 C 550 100, 550 141, 750 141"
              class="path-line"
            />
            <path
              id="v1-dl"
              d="M 500 260 C 550 260, 550 201, 750 201"
              class="path-line"
              stroke="var(--color-diff)"
            />
            <path
              id="v1-dc"
              d="M 500 280 C 520 280, 520 370, 520 370"
              class="path-line"
              stroke="var(--color-diff)"
            />
            <path
              id="v1-cl"
              d="M 700 370 C 720 370, 740 300, 750 261"
              class="path-line"
              stroke="var(--color-cns)"
            />
            
<g transform="translate(750, 60)">
              <rect
                width="100"
                height="42"
                class="dashed-box"
              />
              <rect
                x="20"
                y="8"
                width="54"
                height="14"
                rx="2"
                fill="var(--color-user)"
              />
              <text
                x="50"
                y="35"
                text-anchor="middle"
                font-size="11"
                fill="#475569"
              >
                User h_u
              </text>
            </g>
            <g transform="translate(750, 120)">
              <rect
                width="100"
                height="42"
                class="dashed-box"
              />
              <rect
                x="20"
                y="8"
                width="54"
                height="14"
                rx="2"
                fill="var(--color-diff)"
              />
              <text
                x="50"
                y="35"
                text-anchor="middle"
                font-size="11"
                fill="#475569"
              >
                正样本 h_p
              </text>
            </g>
            <g transform="translate(750, 180)">
              <rect
                width="100"
                height="42"
                class="dashed-box"
              />
              <rect
                x="20"
                y="8"
                width="54"
                height="14"
                rx="2"
                fill="#cbd5e1"
              />
              <text
                x="50"
                y="35"
                text-anchor="middle"
                font-size="11"
                fill="#475569"
              >
                随机负 h_r
              </text>
            </g>
            <g transform="translate(750, 240)">
              <rect
                width="100"
                height="42"
                class="dashed-box"
                style="stroke: var(--color-cns)"
              />
              <rect
                x="20"
                y="8"
                width="54"
                height="14"
                rx="2"
                fill="var(--color-cns)"
              />
              <text
                x="50"
                y="35"
                text-anchor="middle"
                font-size="11"
                fill="#475569"
              >
                课程负 h_c
              </text>
            </g>
            <rect
              x="700"
              y="30"
              width="560"
              height="300"
              fill="transparent"
              stroke="#94a3b8"
              stroke-width="2"
              stroke-dasharray="8 4"
              rx="12"
            />
            <text
              x="980"
              y="55"
              text-anchor="middle"
              font-size="13"
              font-weight="700"
              fill="#64748b"
            >
              Base Recommender 联合推荐预测
            </text>
            <rect
              x="920"
              y="90"
              width="160"
              height="90"
              class="physical-box"
              style="stroke: var(--color-item); stroke-width: 2"
            />
            <text
              x="1000"
              y="120"
              text-anchor="middle"
              font-size="12"
              font-weight="700"
              fill="#1e293b"
            >
              BPR 推荐损失
            </text>
            <text
              x="1000"
              y="142"
              text-anchor="middle"
              font-size="10"
              fill="#475569"
              font-style="italic"
            >
              L_BPR=-logσ(h_u·h_p-h_u·h_n)
            </text>
            <rect
              x="920"
              y="210"
              width="160"
              height="80"
              class="physical-box"
              style="stroke: var(--color-diff); stroke-width: 2"
            />
            <text
              x="1000"
              y="238"
              text-anchor="middle"
              font-size="12"
              font-weight="700"
              fill="#1e293b"
            >
              扩散对齐损失
            </text>
            <text
              x="1000"
              y="258"
              text-anchor="middle"
              font-size="10"
              fill="#475569"
              font-style="italic"
            >
              L_Diff=||e_i⁰-ê_i⁰||²
            </text>
            <rect
              x="1120"
              y="140"
              width="120"
              height="70"
              class="physical-box"
              style="stroke: #e11d48; stroke-width: 2.5; fill: #fff1f2"
            />
            <text
              x="1180"
              y="168"
              text-anchor="middle"
              font-size="12"
              font-weight="700"
              fill="#e11d48"
            >
              联合优化
            </text>
            <text
              x="1180"
              y="188"
              text-anchor="middle"
              font-size="10"
              fill="#e11d48"
              font-weight="700"
            >
              L=L_BPR+λL_Diff
            </text>
            <path
              id="v1-h1"
              d="M 850 85 C 860 85, 860 135, 920 135"
              class="path-line"
              marker-end="url(#arrowhead)"
            />
            <path
              id="v1-h2"
              d="M 850 145 C 860 145, 860 135, 920 135"
              class="path-line"
              marker-end="url(#arrowhead)"
            />
            <path
              id="v1-h3"
              d="M 850 205 C 860 205, 860 135, 920 135"
              class="path-line"
              marker-end="url(#arrowhead)"
            />
            <path
              id="v1-h4"
              d="M 850 265 C 860 265, 860 135, 920 135"
              class="path-line"
              marker-end="url(#arrowhead)"
            />
            <path
              d="M 1080 135 C 1090 135, 1090 175, 1120 175"
              class="path-line"
              marker-end="url(#arrowhead)"
            />
            <path
              d="M 1080 250 C 1090 250, 1090 175, 1120 175"
              class="path-line"
              marker-end="url(#arrowhead)"
              stroke="var(--color-diff)"
            />
            <g class="particle-layer"></g>
          </svg>
        </div>

        <div
          class="diagram"
          :class="{ active: activeTab === 2 }"
          id="view-2"
        >
          <div class="diagram-title"></div>
          <button @click="switchTab(1)" style="position: absolute; top: 20px; left: 20px; padding: 8px 16px; background: #e11d48; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; z-index: 10;">← 返回</button>
          <div class="diagram-title">DMA (条件扩散) 内部微观机理</div>
          <svg viewBox="0 0 1000 500">
            <text
              x="500"
              y="40"
              class="txt-title"
              style="font-size: 16px"
            >
              前向过程：向协同特征注入噪声，打破固定分布
            </text>
            <rect
              x="250"
              y="70"
              width="80"
              height="50"
              class="dashed-box"
            />
            <use
              href="#vec-i"
              x="270"
              y="85"
            />
            <text
              x="290"
              y="140"
              class="txt-math"
            >
              e_i^0
            </text>
            <rect
              x="390"
              y="70"
              width="80"
              height="50"
              class="dashed-box"
            />
            <use
              href="#vec-noise-1"
              x="410"
              y="85"
            />
            <text
              x="430"
              y="140"
              class="txt-math"
            >
              e_i^1
            </text>
            <text
              x="510"
              y="100"
              class="txt-title"
            >
              ...
            </text>
            <rect
              x="550"
              y="70"
              width="80"
              height="50"
              class="dashed-box"
            />
            <use
              href="#vec-noise-2"
              x="570"
              y="85"
            />
            <text
              x="590"
              y="140"
              class="txt-math"
            >
              e_i^T
            </text>
            <path
              id="v2-f1"
              d="M 340 95 L 380 95"
              class="path-line"
            />
            <path
              id="v2-f2"
              d="M 480 95 L 540 95"
              class="path-line"
            />
            <text
              x="500"
              y="210"
              class="txt-title"
              style="font-size: 16px"
            >
              反向过程：多模态引导 Self-Attention 去噪对齐
            </text>
            <rect
              x="220"
              y="240"
              width="80"
              height="50"
              class="dashed-box"
            />
            <use
              href="#vec-v"
              x="240"
              y="255"
            />
            <text
              x="260"
              y="310"
              class="txt-math"
            >
              h_i^v
            </text>
            <rect
              x="220"
              y="340"
              width="80"
              height="50"
              class="dashed-box"
            />
            <use
              href="#vec-t"
              x="240"
              y="355"
            />
            <text
              x="260"
              y="410"
              class="txt-math"
            >
              h_i^t
            </text>
            <rect
              x="360"
              y="250"
              width="70"
              height="30"
              class="physical-box"
              style="stroke: #cbd5e1"
            />
            <text
              x="395"
              y="270"
              class="txt-title"
            >
              Step t
            </text>
            <rect
              x="480"
              y="260"
              width="160"
              height="90"
              class="physical-box"
              style="stroke: var(--color-diff); stroke-width: 3; fill: #faf5ff"
            />
            <text
              x="560"
              y="300"
              class="txt-title"
            >
              Self-Attention
            </text>
            <text
              x="560"
              y="325"
              class="txt-sub"
            >
              条件去噪预测噪声
            </text>
            <rect
              x="740"
              y="280"
              width="80"
              height="50"
              class="dashed-box"
            />
            <use
              href="#vec-d"
              x="760"
              y="295"
            />
            <text
              x="780"
              y="350"
              class="txt-math"
            >
              ê_i^0 (对齐)
            </text>
            <path
              id="v2-cv"
              d="M 310 265 C 400 265, 400 290, 470 290"
              class="path-line"
            />
            <path
              id="v2-ct"
              d="M 310 365 C 400 365, 400 320, 470 320"
              class="path-line"
            />
            <path
              id="v2-cs"
              d="M 440 265 C 460 265, 460 300, 470 300"
              class="path-line"
            />
            <path
              id="v2-out"
              d="M 650 305 L 730 305"
              class="path-line"
              marker-end="url(#arrow-purple)"
            />
            <g class="particle-layer"></g>
          </svg>
        </div>

        <div
          class="diagram"
          :class="{ active: activeTab === 3 }"
          id="view-3"
        >
          <div class="diagram-title"></div>
          <button @click="switchTab(1)" style="position: absolute; top: 20px; left: 20px; padding: 8px 16px; background: #e11d48; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; z-index: 10;">← 返回</button>
          <div class="diagram-title">基于扩散中间态的课程负采样</div>
          <svg viewBox="0 0 1000 500">
            <text
              x="500"
              y="40"
              class="txt-title"
              style="font-size: 16px"
            >
              NDI (反向扩散推断)：时间轴截取
            </text>
            <line
              x1="200"
              y1="80"
              x2="800"
              y2="80"
              class="path-solid"
              stroke-width="4"
              stroke="#cbd5e1"
            />
            <g transform="translate(230, 100)">
              <rect
                width="80"
                height="60"
                class="dashed-box"
                style="stroke: var(--color-cns); stroke-opacity: 0.3"
              />
              <use
                href="#vec-noise-2"
                x="20"
                y="10"
                transform="scale(0.8)"
              />
              <text
                x="40"
                y="45"
                class="txt-math"
              >
                E_i^{3T/4}
              </text>
              <text
                x="40"
                y="80"
                class="txt-title"
              >
                Easy
              </text>
            </g>
            <g transform="translate(460, 100)">
              <rect
                width="80"
                height="60"
                class="dashed-box"
                style="stroke: var(--color-cns); stroke-opacity: 0.6"
              />
              <use
                href="#vec-noise-1"
                x="20"
                y="10"
                transform="scale(0.8)"
              />
              <text
                x="40"
                y="45"
                class="txt-math"
              >
                E_i^{T/2}
              </text>
              <text
                x="40"
                y="80"
                class="txt-title"
              >
                Medium
              </text>
            </g>
            <g transform="translate(690, 100)">
              <rect
                width="80"
                height="60"
                class="dashed-box"
                style="stroke: var(--color-cns); stroke-width: 2"
              />
              <use
                href="#vec-d"
                x="20"
                y="10"
                transform="scale(0.8)"
              />
              <text
                x="40"
                y="45"
                class="txt-math"
              >
                E_i^{0}
              </text>
              <text
                x="40"
                y="80"
                class="txt-title"
              >
                Hard
              </text>
            </g>
            <rect
              x="150"
              y="250"
              width="700"
              height="150"
              class="bg-area green"
              style="fill: #f7fbee"
            />
            <text
              x="500"
              y="290"
              class="txt-title"
              style="font-size: 16px"
            >
              CNS：根据训练进程动态提升负样本难度
            </text>
            <line
              x1="250"
              y1="350"
              x2="750"
              y2="350"
              class="path-solid"
              stroke-width="6"
              stroke="#e2e8f0"
            />
            <text
              x="250"
              y="380"
              class="txt-title"
            >
              训练初期
            </text>
            <text
              x="500"
              y="380"
              class="txt-title"
            >
              训练中期
            </text>
            <text
              x="750"
              y="380"
              class="txt-title"
            >
              训练后期
            </text>
            <path
              id="v3-d1"
              d="M 270 180 L 270 340"
              class="path-line"
            />
            <path
              id="v3-d2"
              d="M 500 180 L 500 340"
              class="path-line"
            />
            <path
              id="v3-d3"
              d="M 730 180 L 730 340"
              class="path-line"
            />
            <g class="particle-layer"></g>
          </svg>
        </div>

        <div
          class="diagram"
          :class="{ active: activeTab === 4 }"
          id="view-4"
        >
          <div class="diagram-title"></div>
          <button @click="switchTab(1)" style="position: absolute; top: 20px; left: 20px; padding: 8px 16px; background: #e11d48; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; z-index: 10;">← 返回</button>
          <div class="diagram-title">双目标联合端到端优化</div>
          <svg viewBox="0 0 1000 500">
            <g transform="translate(150, 60)">
              <rect
                width="100"
                height="50"
                class="dashed-box"
              />
              <use
                href="#vec-u"
                x="28"
                y="5"
              />
              <text
                x="50"
                y="40"
                class="txt-title"
              >
                User h_u
              </text>
            </g>
            <g transform="translate(150, 140)">
              <rect
                width="100"
                height="50"
                class="dashed-box"
              />
              <use
                href="#vec-d"
                x="28"
                y="5"
              />
              <text
                x="50"
                y="40"
                class="txt-title"
              >
                正样本 h_p
              </text>
            </g>
            <g transform="translate(150, 220)">
              <rect
                width="100"
                height="50"
                class="dashed-box"
              />
              <rect
                x="28"
                y="5"
                width="40"
                height="16"
                rx="2"
                fill="#cbd5e1"
              />
              <text
                x="50"
                y="40"
                class="txt-title"
              >
                随机负 h_r
              </text>
            </g>
            <g transform="translate(150, 300)">
              <rect
                width="100"
                height="50"
                class="dashed-box"
                style="stroke: var(--color-cns)"
              />
              <rect
                x="28"
                y="5"
                width="40"
                height="16"
                rx="2"
                fill="var(--color-cns)"
              />
              <text
                x="50"
                y="40"
                class="txt-title"
              >
                课程负 h_c
              </text>
            </g>
            <rect
              x="420"
              y="100"
              width="220"
              height="120"
              class="physical-box"
              style="stroke: var(--color-item); border-width: 2"
            />
            <text
              x="530"
              y="140"
              class="txt-title"
            >
              BPR 推荐损失
            </text>
            <text
              x="530"
              y="170"
              class="txt-math"
            >
              L_{BPR} = -log σ(h_u h_p - h_u h_n)
            </text>
            <rect
              x="420"
              y="250"
              width="220"
              height="100"
              class="physical-box"
              style="stroke: var(--color-diff); border-width: 2"
            />
            <text
              x="530"
              y="290"
              class="txt-title"
            >
              扩散对齐损失
            </text>
            <text
              x="530"
              y="320"
              class="txt-math"
            >
              L_{Diff} = || e_i^0 - \tilde{e}_i^0 ||^2
            </text>
            <rect
              x="750"
              y="180"
              width="160"
              height="80"
              class="physical-box"
              style="stroke: #e11d48; stroke-width: 3; fill: #fff1f2"
            />
            <text
              x="830"
              y="215"
              class="txt-title"
            >
              联合优化
            </text>
            <text
              x="830"
              y="240"
              class="txt-math"
              style="fill: #e11d48; font-weight: bold"
            >
              L = L_{BPR} + λL_{Diff}
            </text>
            <path
              id="v4-p1"
              d="M 260 85 C 350 85, 350 140, 410 140"
              class="path-line"
            />
            <path
              id="v4-p2"
              d="M 260 165 C 350 165, 350 160, 410 160"
              class="path-line"
            />
            <path
              id="v4-p3"
              d="M 260 245 C 350 245, 350 180, 410 180"
              class="path-line"
            />
            <path
              id="v4-p4"
              d="M 260 325 C 350 325, 350 200, 410 200"
              class="path-line"
            />
            <path
              id="v4-o1"
              d="M 650 160 C 700 160, 700 220, 740 220"
              class="path-line"
            />
            <path
              id="v4-o2"
              d="M 650 300 C 700 300, 700 220, 740 220"
              class="path-line"
              stroke="var(--color-diff)"
            />
            <g class="particle-layer"></g>
          </svg>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";

defineOptions({ name: "ModelExpoCcdrecVisualization" });

const tabs = [
  { id: 1, title: "架构与特征提取", subtitle: "多模态向量与协同图网络" },
  { id: 2, title: "DMA 扩散对齐", subtitle: "向量的加噪粉碎与条件重建" },
  { id: 3, title: "NDI & CNS 负采样", subtitle: "提取多级难度的特征状态" },
  { id: 4, title: "端到端联合优化", subtitle: "推荐损失与生成损失" },
];

const activeTab = ref(1);
const timers = [];
const rafIds = [];

const COLORS = {
  U: "#e11d48",
  I: "#2563eb",
  V: "#16a34a",
  T: "#ea580c",
  D: "#9333ea",
  C: "#4d7c0f",
  N: "#94a3b8",
};

function clearAnimations() {
  while (timers.length) clearInterval(timers.pop());
  while (rafIds.length) cancelAnimationFrame(rafIds.pop());
  document.querySelectorAll(".particle").forEach((p) => p.remove());
}

function makeParticle(layer, color, radius = 4.5) {
  const pt = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  pt.setAttribute("r", String(radius));
  pt.setAttribute("fill", color);
  pt.classList.add("particle");
  layer.appendChild(pt);
  return pt;
}

function animateOnPath(svgIndex, pathId, color, duration = 2400) {
  const view = document.getElementById(`view-${svgIndex}`);
  const pathEl = document.getElementById(pathId);
  const layer = view?.querySelector(".particle-layer");
  if (!view || !pathEl || !layer) return;

  const particle = makeParticle(layer, color);
  const total = pathEl.getTotalLength();
  const start = performance.now();

  const frame = (time) => {
    if (activeTab.value !== svgIndex || !particle.isConnected) return;
    const progress = ((time - start) % duration) / duration;
    const point = pathEl.getPointAtLength(total * progress);
    particle.setAttribute("cx", String(point.x));
    particle.setAttribute("cy", String(point.y));

    const opacity =
      progress < 0.1
        ? progress / 0.1
        : progress > 0.9
          ? (1 - progress) / 0.1
          : 1;
    particle.style.opacity = String(Math.max(0, opacity));

    const id = requestAnimationFrame(frame);
    rafIds.push(id);
  };

  const id = requestAnimationFrame(frame);
  rafIds.push(id);
}

function scheduleFlow(
  svgIndex,
  pathId,
  color,
  count = 2,
  gap = 1100,
  duration = 2200
) {
  for (let i = 0; i < count; i += 1) {
    const timer = setTimeout(
      () => animateOnPath(svgIndex, pathId, color, duration),
      i * gap
    );
    timers.push(timer);
  }
  const loop = setInterval(
    () => {
      for (let i = 0; i < count; i += 1) {
        const timer = setTimeout(
          () => animateOnPath(svgIndex, pathId, color, duration),
          i * gap
        );
        timers.push(timer);
      }
    },
    duration + gap * (count - 1)
  );
  timers.push(loop);
}

function startAnimation(index) {
  if (index === 1) {
    const flows = [
      ["v1-ug", COLORS.U],
      ["v1-ig", COLORS.I],
      ["v1-id", COLORS.I],
      ["v1-vd", COLORS.V],
      ["v1-td", COLORS.T],
      ["v1-gl", COLORS.I],
      ["v1-dl", COLORS.D],
      ["v1-dc", COLORS.D],
      ["v1-cl", COLORS.C],
      ["v1-h1", COLORS.U],
      ["v1-h2", COLORS.D],
      ["v1-h3", COLORS.N],
      ["v1-h4", COLORS.C],
    ];
    flows.forEach(([id, color]) => scheduleFlow(1, id, color, 2, 1200, 2400));
    return;
  }

  if (index === 2) {
    scheduleFlow(2, "v2-cv", COLORS.V, 2, 1000, 2000);
    scheduleFlow(2, "v2-ct", COLORS.T, 2, 1000, 2000);
    scheduleFlow(2, "v2-cs", COLORS.N, 2, 1000, 2000);
    scheduleFlow(2, "v2-out", COLORS.D, 2, 1000, 2000);
    return;
  }

  if (index === 3) {
    scheduleFlow(3, "v3-d1", COLORS.C, 2, 800, 1500);
    scheduleFlow(3, "v3-d2", COLORS.C, 2, 800, 1500);
    scheduleFlow(3, "v3-d3", COLORS.C, 2, 800, 1500);
    return;
  }

  scheduleFlow(4, "v4-p1", COLORS.U, 2, 1200, 2400);
  scheduleFlow(4, "v4-p2", COLORS.D, 2, 1200, 2400);
  scheduleFlow(4, "v4-p3", COLORS.N, 2, 1200, 2400);
  scheduleFlow(4, "v4-p4", COLORS.C, 2, 1200, 2400);
  scheduleFlow(4, "v4-o1", COLORS.U, 2, 1200, 2400);
  scheduleFlow(4, "v4-o2", COLORS.D, 2, 1200, 2400);
}

function switchTab(index) {
  if (activeTab.value === index) return;
  activeTab.value = index;
  clearAnimations();
  nextTick(() => startAnimation(index));
}

onMounted(() => {
  startAnimation(activeTab.value);
});

onBeforeUnmount(() => {
  clearAnimations();
});
</script>

<style scoped>
.viz-page {
  --bg: #f0f4f8;
  --card: #ffffff;
  --text: #1e293b;
  --muted: #64748b;
  --line: #cbd5e1;
  --primary: #2563eb;
  --primary-light: #eff6ff;
  --color-user: #e11d48;
  --color-item: #2563eb;
  --color-image: #16a34a;
  --color-text: #ea580c;
  --color-diff: #9333ea;
  --color-cns: #4d7c0f;
  color: var(--text);
  padding: 8px;
  background-color: var(--bg);
  background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
  background-size: 20px 20px;
}

.expo-scroll {
  height: calc(100vh - 120px);
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 6px;
  scrollbar-gutter: stable;
}

.gallery-container {
  display: flex;
  width: 100%;
  min-height: calc(100vh - 150px);
  background: var(--card);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.sidebar {
  width: 280px;
  background: #f8fafc;
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  padding: 24px 0;
  z-index: 10;
 display: none;}

.sidebar-header {
  padding: 0 24px 20px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 16px;
}
.sidebar-header h2 {
  font-size: 20px;
  color: #0f172a;
  margin-bottom: 6px;
  font-weight: 800;
}
.sidebar-header p {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.5;
}
.nav-tabs {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 16px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
}
.tab-btn:hover {
  background: #f1f5f9;
}
.tab-btn.active {
  background: var(--primary-light);
  border-color: #bfdbfe;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
}
.tab-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  color: #fff;
  font-size: 14px;
  flex-shrink: 0;
}
.tab-1 .tab-icon {
  background: var(--text);
}
.tab-2 .tab-icon {
  background: var(--color-diff);
}
.tab-3 .tab-icon {
  background: var(--color-cns);
}
.tab-4 .tab-icon {
  background: var(--color-user);
}
.tab-text {
  display: flex;
  flex-direction: column;
}
.tab-text strong {
  font-size: 15px;
  color: #0f172a;
  margin-bottom: 4px;
  font-weight: 600;
}
.tab-text span {
  font-size: 12px;
  color: var(--muted);
}
.tab-btn.active .tab-text strong {
  color: var(--primary);
}

.main-view {
  flex-grow: 1;
  position: relative;
  background: #fff;
  display: flex;
  padding: 20px;
}
.diagram {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  bottom: 20px;
  opacity: 0;
  pointer-events: none;
  transform: translateY(15px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.diagram.active {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
  z-index: 5;
}
.diagram-title {
  font-size: 20px;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 20px;
  text-align: center;
}
svg {
  width: 100%;
  height: 100%;
  max-height: 650px;
}
.path-line {
  fill: none;
  stroke: var(--line);
  stroke-width: 2.5;
  stroke-dasharray: 4 4;
  marker-end: url(#arrowhead);
}
.path-solid {
  fill: none;
  stroke: var(--line);
  stroke-width: 2;
  marker-end: url(#arrowhead);
}
.txt-title {
  font-size: 14px;
  font-weight: 600;
  fill: #1e293b;
  text-anchor: middle;
  font-family: sans-serif;
}
.txt-sub {
  font-size: 12px;
  fill: #64748b;
  text-anchor: middle;
  font-family: sans-serif;
}
.txt-math {
  font-size: 14px;
  fill: #475569;
  font-style: italic;
  font-family: "Cambria Math", serif;
  text-anchor: middle;
}
.bg-area {
  fill-opacity: 0.04;
  stroke-dasharray: 6 4;
  stroke-width: 2;
  rx: 16;
}
.bg-area.blue {
  fill: var(--color-item);
  stroke: var(--color-item);
}
.bg-area.purple {
  fill: var(--color-diff);
  stroke: var(--color-diff);
}
.bg-area.green {
  fill: var(--color-cns);
  stroke: var(--color-cns);
}
.physical-box {
  fill: #fff;
  stroke: #cbd5e1;
  stroke-width: 1.5;
  rx: 8;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.05));
}
.dashed-box {
  fill: transparent;
  stroke: #94a3b8;
  stroke-width: 1.5;
  stroke-dasharray: 5 3;
  rx: 8;
}
.particle {
  filter: drop-shadow(0 0 4px currentColor);
}

@media (max-width: 980px) {
  .gallery-container {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    border-right: 0;
    border-bottom: 1px solid var(--line);
   display: none;}
  .main-view {
    min-height: 620px;
  }
}
</style>
