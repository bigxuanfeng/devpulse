---
{
  "id": "mql7kieg-svmeon",
  "date": "2026-06-20",
  "title": "今日任务",
  "tags": [],
  "mentions": [
    "devpulse"
  ],
  "createdAt": "2026-06-19T17:34:14.824Z",
  "updatedAt": "2026-06-19T19:03:31.150Z"
}
---

还没想好,今天做了@devpulse

项目定位
开发者个人效能面板——跟踪 AI 成本、代码活动、写工作日记、看项目健康。

Text
技术栈：Next.js 16 + React 19 + TypeScript + Tailwind CSS v4
UI：深色/白天双主题，暖琥珀 accent (#e8954c)
数据：DeepSeek API 余额 + 本地 Git 仓库扫描 + 日记 .md 文件
仪表盘
模块	数据
KPI 卡片 x4	AI 本月成本、本月提交数、活跃天数、项目活跃/总计
代码活动热力图	近 30 天每日 commit 柱状图（Recharts）
AI 成本趋势	余额快照日变化折线图（需运行 2+ 天累积）
项目健康卡片	每个仓库的状态（活跃/不活跃/停止）+ 最近提交 + TODO 数
数据来源：src/lib/data/git-collector.ts（git log 解析）+ src/lib/data/ai-usage.ts（DeepSeek balance API）

日记
功能	实现
原地展开编辑	点卡片原地展开成编辑器，再点标题收回，300ms 过渡动效
标题 + 日期	标题可自定义，日期可改，预览优先显示标题
@项目 / #标签	编辑器快捷按钮 + 手动输入，保存自动识别并加入候选列表
搜索	搜标题/内容/标签/项目，Enter 触发，不丢焦点
日期区间筛选	侧栏两层日期选择器，选起始自动填结束，交叉自动交换
拖拽排序	标签和项目列表 @dnd-kit 实现，鼠标拖手柄 + 手机长按 400ms
管理弹窗	齿轮图标入口，查看/删除/重命名标签和项目，重命名同步全部历史日记
删除	确认两步操作，同步删文件
文件存储	data/diary/{id}.md，YAML frontmatter + Markdown 正文，同一天可多篇
全局
功能	实现
日夜主题	Navbar 太阳/月亮切换，CSS 变量双色表，偏好记 localStorage
标签/项目共享	Zustand store（tags.ts），侧栏、编辑器、管理弹窗、筛选栏全部联动
文件结构
Text
devpulse/
├── DESIGN.md
├── src/
│   ├── app/
│   │   ├── page.tsx              ← 仪表盘
│   │   ├── diary/page.tsx        ← 日记（侧栏 + 搜索 + 卡片流）
│   │   ├── api/dashboard/        ← Git + AI 数据聚合
│   │   ├── api/diary/            ← 日记 CRUD
│   │   └── api/git-stats/        ← Git 统计
│   ├── components/
│   │   ├── dashboard/            ← KpiCard、ChartCard、HealthCard、ActivityHeatmap、CostTrend
│   │   ├── diary/                ← ExpandableDiaryCard、DiaryEditor、DiarySidebar、DateRangePicker、ManageModal、SortableList
│   │   └── layout/Navbar.tsx
│   ├── stores/                   ← diary.ts、theme.ts、tags.ts
│   └── lib/data/                 ← git-collector.ts、ai-usage.ts、types.ts
├── data/diary/                   ← 日记 .md 文件
└── data/ai-balance.json          ← DeepSeek 余额快照@devpulse