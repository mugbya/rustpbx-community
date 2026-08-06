## 问题根因

提交 `8265bbd feat:去掉antd` 把 Ant Design 换成自研 UI 组件时，`frontend/src/pages/Topic/Create.tsx:288-296` 的标签输入框没还原到位：

- 原来用 antd `Select mode="tags"`，可自由敲字、回车生成标签。
- 改后用自研 `Select mode="multiple"` 且 `options={[]}`。自研 Select 基于 Headless UI `Listbox`，只支持从预设选项点选，无文本输入能力，加上 options 为空 → 既敲不了字也没东西可选 → "标签加不上"。
- 该发帖页被论坛/问答/文章/资源四个分区共用，所以"所有分区都不能添加标签"。

后端正常（`_sync_tags` 逻辑完好），编辑回填 `setValue('tags', data.tags)` 也按字符串数组处理，只要前端能产出 `string[]` 即可闭环。

## 方案：新增独立 `TagInput` 组件（不改 Select）

不自研 Select 硬塞 `mode="tags"`——Listbox 是"点选"原语，强行塞自由文本输入会让 Select 在两种交互模型间大量分支，难维护。改为新增一个专注的 `TagInput` 组件，职责单一，复用现有 `Tag` 组件做芯片展示。

### 1. 新建 `frontend/src/components/ui/TagInput.tsx`

接口（对齐项目风格，与 Input/Select 一致）：
```ts
interface TagInputProps {
  value?: string[]
  onChange?: (value: string[]) => void
  placeholder?: string
  maxCount?: number              // 默认 5
  tokenSeparators?: string[]     // 默认 [',']
  disabled?: boolean
  className?: string
}
```

行为（还原 antd `mode="tags"` 原始体验，无自动补全）：
- 输入文本，按 **回车** 或 **分隔符（逗号）** 确认，把文本加入 `value` 数组。
- **去重**：已存在的标签不加。
- **限流**：达到 `maxCount` 后禁用输入框。
- **删除**：点芯片上的 × 删除；输入框为空时按 **Backspace** 删除最后一个（antd 同款交互）。
- 已选标签用现有 `Tag color="blue"` 组件渲染（内嵌 × 按钮），样式与 UI 库一致。
- 外层容器样式对齐 `Input.tsx`：`min-h-9`、`border-gray-300`、`focus-within:border-primary-600` 等。

### 2. 修改 `frontend/src/pages/Topic/Create.tsx`（第 288-296 行）

```tsx
<FormItem label="标签">
  <TagInput
    placeholder="输入标签后按回车，最多 5 个"
    maxCount={5}
    value={watch('tags') ?? []}
    onChange={(v) => setValue('tags', v)}
  />
</FormItem>
```
- import 增加 `TagInput`，`Select` 在该文件他处仍在用（板块、资源类型），保留不动。
- `Select.tsx` 不做任何改动，blast radius 最小。

## 不做的事
- 不加自动补全（调 `forumApi.getTags`）：原 antd 代码没传 options，原行为就是纯自由输入。如需补全可后续增强（可升级 Select 到 Headless UI `Combobox` 或给 TagInput 加建议下拉），本次不扩范围。
- 不动后端、不动数据模型。
- 不改 `Select.tsx`。

## 验证
- `cd frontend && npx tsc --noEmit` 类型检查通过。
- 手动：发帖/提问/写文章/上传资源四个分区都能输入标签（回车/逗号生成、× 删除、最多 5 个、去重）；编辑模式回填已有标签正常显示并可删除/追加。