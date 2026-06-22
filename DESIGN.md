# DevPulse DESIGN.md

> 开发者个人效能面板 — 设计系统真源文档
>
> 本文件是 DevPulse 所有视觉决策的唯一真源。AI 编码助手读取此文件即可生成风格一致的 UI。
> 格式遵循 [Google Stitch DESIGN.md 规范](https://stitch.withgoogle.com/docs/design-md/overview/)。

---

## 1. Design Philosophy（设计哲学）

**极简数据主义（Minimal Dataism）**

- 信息密度适中：不是运维大屏（一屏 50 个数字），也不是 C 端消费 app（一屏一个数字）
- 暖色点缀：深色底 + 琥珀/橙色 accent，营造个人空间感而非监控室压迫感
- 克制动效：数字过渡使用 ease-out，无弹跳、无旋转、无夸张 scaling
- 质感对比：UI 区域用系统无衬线，数据/代码区域用等宽字体，形成"浏览 vs 精确"的质感区分
- 卡片优先：信息组织以卡片为载体，圆角小、边框少、用微妙背景色差区分层级

---

## 2. Color System（颜色系统）

### 2.1 Core Palette

| Token | Value | Usage |
|---|---|---|
| `bg-root` | `#0a0a0f` | 页面根背景 |
| `bg-surface` | `#13131a` | 卡片、面板底色 |
| `bg-elevated` | `#1a1a24` | 悬浮层（dialog、dropdown、popover） |
| `bg-hover` | `#22222e` | 交互 hover 态 |

| Token | Value | Usage |
|---|---|---|
| `text-primary` | `#ede4d8` | 主文本（暖白，非纯白 #fff） |
| `text-secondary` | `#a09a90` | 次要文本、描述文字 |
| `text-muted` | `#5c5850` | 辅助文字、placeholder |

| Token | Value | Usage |
|---|---|---|
| `border-default` | `#1e1e2a` | 默认边框 |
| `border-emphasis` | `#2a2a38` | 强调边框 |

### 2.2 Accent（强调色）

| Token | Value | Usage |
|---|---|---|
| `accent` | `#e8954c` | 主强调色——按钮、链接、选中态 |
| `accent-hover` | `#f0a868` | hover 态 |
| `accent-subtle` | `#3d2a1a` | 微妙强调背景（低透明度场景） |
| `accent-text` | `#f5c08a` | 强调文本 |

### 2.3 Status Colors（状态色）

保持克制，不荧光、不刺眼，与暖色基调协调。

| Token | Value | Usage |
|---|---|---|
| `success` | `#7d9f6e` | 成功/正常 |
| `success-subtle` | `#1a2a15` | 成功背景 |
| `warning` | `#d4a853` | 警告 |
| `warning-subtle` | `#2a2215` | 警告背景 |
| `error` | `#c75a4a` | 错误 |
| `error-subtle` | `#2a1515` | 错误背景 |
| `info` | `#6b9eb3` | 信息 |
| `info-subtle` | `#151f2a` | 信息背景 |

### 2.4 Data Visualization（图表色谱）

5 色暖色渐变，用于图表数据系列。避免彩虹色，保持低饱和。

| Token | Value |
|---|---|
| `chart-1` | `#e8954c` |
| `chart-2` | `#d4a853` |
| `chart-3` | `#c7826e` |
| `chart-4` | `#b89a6b` |
| `chart-5` | `#a0805c` |

### 2.5 Chart Grid & Axis

| Token | Value | Usage |
|---|---|---|
| `chart-grid` | `#1e1e2a` | 图表网格线 |
| `chart-axis` | `#5c5850` | 轴标签 |
| `chart-empty` | `#22222e` | 空数据填充 |

---

## 3. Typography（字体系统）

### 3.1 Font Families

| Token | Stack | Usage |
|---|---|---|
| `font-ui` | `system-ui, -apple-system, "Microsoft YaHei", "PingFang SC", sans-serif` | 所有 UI 界面 |
| `font-data` | `"JetBrains Mono", "Cascadia Code", "Consolas", monospace` | 数字、API 费用、代码摘要 |
| `font-editor` | `"JetBrains Mono", "Cascadia Code", "Consolas", monospace` | 日记编辑器 |

### 3.2 Type Scale

| Token | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `text-xs` | `0.75rem` | 1rem | 400 | 标签、辅助信息 |
| `text-sm` | `0.875rem` | 1.25rem | 400 | 次要文本 |
| `text-base` | `1rem` | 1.5rem | 400 | 正文 |
| `text-lg` | `1.125rem` | 1.75rem | 500 | 卡片标题 |
| `text-xl` | `1.25rem` | 1.75rem | 600 | 页面标题 |
| `text-2xl` | `1.5rem` | 2rem | 600 | 大数字（KPI 卡片） |
| `text-3xl` | `2rem` | 2.5rem | 700 | 核心指标 |

### 3.3 Data Numerals

数字展示使用 `font-data` + `tabular-nums`（等宽数字），确保数值对齐。

---

## 4. Spacing（间距系统）

基于 4px 基准单位。

| Token | Value | Usage |
|---|---|---|
| `space-xs` | `4px` | 紧凑间距 |
| `space-sm` | `8px` | 组件内间距 |
| `space-md` | `16px` | 卡片内 padding、元素间距 |
| `space-lg` | `24px` | 卡片间距、区块间距 |
| `space-xl` | `32px` | 大区块间距 |
| `space-2xl` | `48px` | 页面级区块分隔 |
| `space-3xl` | `64px` | 极少使用 |

### Layout Widths

| Token | Value | Usage |
|---|---|---|
| `content-sm` | `640px` | 日记编辑器宽度 |
| `content-md` | `768px` | 日记卡片流宽度 |
| `content-lg` | `1200px` | 仪表盘最大宽度 |
| `content-full` | `100%` | 全宽 |

---

## 5. Elevation & Shadows（阴影层级）

不追求 Material Design 的多层阴影。仅 2 级。

| Token | Value | Usage |
|---|---|---|
| `shadow-none` | `none` | 根背景、非卡片区域 |
| `shadow-card` | `0 1px 3px rgba(0, 0, 0, 0.4)` | 卡片 |
| `shadow-elevated` | `0 4px 12px rgba(0, 0, 0, 0.5)` | Dialog、dropdown、popover |

**规则**：不使用彩色阴影、不使用 glow 效果。

---

## 6. Border Radius（圆角）

| Token | Value | Usage |
|---|---|---|
| `radius-none` | `0` | 表格、代码块 |
| `radius-sm` | `4px` | 按钮、标签、输入框 |
| `radius-md` | `8px` | 卡片 |
| `radius-lg` | `12px` | 大面板、dialog |
| `radius-full` | `9999px` | 头像、pill 标签 |

---

## 7. Motion（动效系统）

**原则**：统一 ease-out，不做弹跳、不做旋转、不做夸张缩放。

| Token | Value | Usage |
|---|---|---|
| `duration-fast` | `150ms` | 按钮 hover、开关切换 |
| `duration-normal` | `250ms` | 卡片 hover、面板切换、数字过渡 |
| `duration-slow` | `400ms` | 页面过渡 |
| `easing-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | 全局统一缓动 |

### 具体规则

| 场景 | 行为 |
|---|---|
| 数字变化 | `transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1)` — 仅数值过渡 |
| 卡片 hover | `translateY(-2px)` + `shadow` 过渡 — 微抬，无缩放 |
| 面板展开 | 高度/透明度过渡 |
| 图表更新 | 数据点/柱状条宽度的 ease-out 过渡 |
| 页面切换 | 透明度 fade（400ms），不做 slide |

---

## 8. Component Patterns（组件模式）

### 8.1 KPI Card

```
┌─────────────────────┐
│ AI 成本（本月）      │  ← text-sm / text-secondary
│ ¥ 287                │  ← text-3xl / font-data / text-primary
│ ↑ 12% 较上月         │  ← text-xs / status color
└─────────────────────┘
  bg-surface, radius-md, shadow-card, p-md
```

### 8.2 Chart Card

```
┌─────────────────────┐
│ 代码活动热力图       │  ← text-lg / text-primary
│ ┌─────────────────┐ │
│ │                 │ │  ← chart area
│ │   [Recharts]    │ │
│ │                 │ │
│ └─────────────────┘ │
└─────────────────────┘
  bg-surface, radius-md, shadow-card, p-md
  chart colors: chart-1 → chart-5
```

### 8.3 Diary Card（浏览模式）

```
┌──────────────────────────────┐
│ 2026-06-19           📝 编辑 │  ← text-lg / text-primary + text-xs link
│ ─────────────────────────── │  ← border-default
│ 5 commits · ¥1.2 · +320行   │  ← text-sm / font-data / text-secondary
│                              │
│ 下午踩了 csproj 编译的坑...  │  ← text-base / text-primary (clamped 2行)
│ #踩坑  #架构                 │  ← text-xs tags
└──────────────────────────────┘
  bg-surface, radius-md, shadow-card, p-md
  hover: translateY(-2px)
```

### 8.4 Diary Editor（编辑模式）

```
┌──────────────────────────────┐
│ 2026-06-19                   │  ← text-lg / text-primary
│ ─────────────────────────── │
│ 📊 自动摘要                  │  ← text-sm / text-secondary
│ 5 commits · ¥1.2 · +320行   │
│ ─────────────────────────── │
│                              │
│ [Markdown 即时渲染区域]      │  ← font-editor / text-base / min-h 300px
│                              │
│ ─────────────────────────── │
│ [保存] [标签] [复制为周报]   │  ← accent button + default buttons
└──────────────────────────────┘
  bg-surface, radius-md, shadow-card, p-md
  max-width: content-sm (640px)
```

### 8.5 Button Hierarchy

| Variant | Background | Text | Border | Usage |
|---|---|---|---|---|
| Primary | `accent` | `bg-root` | none | 主要操作（保存、确认） |
| Secondary | `bg-hover` | `text-primary` | `border-default` | 次要操作 |
| Ghost | transparent | `text-secondary` | none | 低优先级、图标按钮 |
| Danger | `error-subtle` | `error` | none | 删除等危险操作 |

All buttons: `radius-sm`, `duration-fast` transition, `px-md py-sm`.

### 8.6 Tag / Pill

```
┌────────┐
│ #踩坑   │  ← text-xs / font-ui / text-secondary
└────────┘
  bg-hover, radius-full, px-sm py-xs
```

### 8.7 Navigation

```
┌──────────────────────────────────────────┐
│ DevPulse   面板 · 日记 · 设置            │  ← 左侧 logo + 右侧 nav
└──────────────────────────────────────────┘
  bg-surface, border-bottom: border-default
  height: 48px
  active nav item: text-accent
  inactive: text-secondary
```

---

## 9. Diary-Specific Design（日记专有设计）

### 9.1 Tag System

预设标签：`#踩坑` `#架构决策` `#性能优化` `#学到了` `#想法` `#部署` `#重构`

颜色映射（微妙区分，不用纯色标签）：

| Tag | Dot Color |
|---|---|
| `#踩坑` | `error` `#c75a4a` |
| `#架构决策` | `accent` `#e8954c` |
| `#性能优化` | `success` `#7d9f6e` |
| `#学到了` | `info` `#6b9eb3` |
| `#想法` | `warning` `#d4a853` |
| 其他 | `text-muted` `#5c5850` |

### 9.2 Auto-Summary Section

自动摘要区域使用 `font-data`，与手动内容形成质感对比。

### 9.3 Markdown Styling

日记编辑器内 Markdown 渲染使用：
- 标题：`text-lg` / `text-xl`，颜色 `text-primary`
- 行内代码：`font-data`，背景 `bg-hover`，`radius-sm`
- 代码块：`font-data`，背景 `bg-root`，`radius-md`，`p-md`
- 链接：`accent`，无下划线，hover 加下划线
- 列表：缩进使用 `space-md`
- 分割线：`border-default`

---

## 10. Empty States（空状态）

| 场景 | 处理 |
|---|---|
| 无成本数据 | 显示 "暂无数据" + 灰色图标，`text-muted` |
| 无日记条目 | 显示 "写下第一篇日记" 引导文案，搭配轻微 accent CTA |
| 图表无数据 | 显示空图表框架 + grid 线，`chart-empty` 填充 |
| 项目无活动 | "该仓库最近无提交" `text-muted` |

空状态一律用 `text-muted`，不做大图标、不做动画。

---

## 11. Responsive Behavior（响应式）

DevPulse 是桌面优先工具，但保留基本响应式：

| 断点 | 布局 |
|---|---|
| ≥ 1200px | 仪表盘 3 列网格，日记编辑器居中 |
| 768px - 1199px | 仪表盘 2 列，日记流占满 |
| < 768px | 单列堆叠，导航折叠为汉堡菜单 |

---

## 12. Icons（图标）

使用 Lucide Icons（通过 `lucide-react`）：
- 尺寸：默认 `16px`，KPI 卡片内 `20px`
- 颜色：继承父级文字颜色，不单独着色
- 不使用彩色图标、不使用 emoji 图标

---

## 13. Theming（主题）

**当前仅支持深色主题。** 浅色主题不在范围内。

如需后续添加：所有 token 通过 CSS 自定义属性或 Tailwind 变量引用，切换主题只更换变量值，不修改组件代码。

---

## 14. i18n（国际化）

所有用户可见文案存储在 `src/locales/zh-CN.json`，通过 `useTranslation(key)` 获取。

当前仅中文。添加新语言只需增加 `locales/{locale}.json`，组件代码零改动。
