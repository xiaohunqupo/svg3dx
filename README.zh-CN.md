<p align="center">
  <img src="assets/title.png" alt="svg 3dx" width="320"/>
</p>

# svg3dx

[English](README.md) | 中文

**svg3dx** 是一种开放的、基于 XML 的参数化三维几何格式。它在 SVG 之上扩展，而非取而代之：保留 SVG 的元素结构、命名空间模型与 CSS 样式机制，并增加一层薄而明确的三维图元、参数、逻辑与显示配置。

命名空间前缀：`s3dx` · 草案 URI：`urn:s3dx:draft:0.1`

## 要解决的问题

现有参数化 CAD 格式（Revit 族、广联达构件编辑器、各厂商专有参数化）封闭且绑定私有内核；通用网格格式（STL、OBJ、GLB）只保存静态结果，没有“配方”概念。svg3dx 填补这一空白：一种**可读、与内核无关的配方格式**，描述几何*如何*被参数化，而不只是最终形状*是什么*。

## 核心设计

- **天生兼容 SVG。** 三维元素位于自定义命名空间（`urn:s3dx:draft:0.1`）。标准 SVG 渲染器会忽略它们，并继续渲染二维内容。根元素上的 `svg3d="true"` 开关启用三维语义。
- **用 CSS 自定义属性承载参数。** 仅支持简化 CSS 子集（类选择器 + 内联自定义属性）。表达式以 `[name]` 或 `var(--name)` 引用参数；外部传参优先级最高，且不修改 DOM。
- **用结构表达逻辑，而非塞进语法。** 条件挂在 `<g>` 上（`if` / `ifnot`）；循环是独立元素（`s3dx:loop-points`、`s3dx:loop-range`）；布尔运算是元素（`s3dx:bool-union` / `subtract` / `intersect`），作用域封闭、按文档顺序求值。
- **与几何内核解耦。** 格式只描述几何操作；求值交给后端（Open CASCADE、Manifold 等）。规范不规定数值精度。
- **配置显示，不定义相机。** `<s3dx:model>` 声明渲染模式（`solid` / `wireframe` / `hidden-line`）以及要显示的几何；视点与投影留给宿主。

## 状态

草案 0.1（内部）。命名空间 URI `urn:s3dx:draft:0.1` 为临时值。各图元属性表正逐步补全，不影响核心语法。

## 仓库结构

```
svg3dx/
├── assets/                 # Logo 与标题图
├── docs/                   # 格式规范
│   └── svg3dx-spec-draft-0.1.md
├── samples/                # 示例 .svg
│   └── draft-0.1-example.svg
├── LICENSE-MIT             # MIT（任选其一）
├── LICENSE-MulanPSL-2.0    # 木兰宽松许可证第2版
├── README.md
└── README.zh-CN.md
```

## 文档

- 格式规范（草案 0.1）：[`docs/svg3dx-spec-draft-0.1.md`](docs/svg3dx-spec-draft-0.1.md)
- 示例文件：[`samples/draft-0.1-example.svg`](samples/draft-0.1-example.svg)

## 目标

- 成为各厂商与工具可独立实现的开放参数化三维构件格式。
- 完整的二维 SVG 回退：不含三维内容的文件仍是合法 SVG。
- 对人可写、对机器可校验、对版本控制友好（diff-friendly）。
- 形成多个独立求值器生态，而非绑定单一参考实现。

## 非目标（v0.1）

- 定义三维视口或相机模型。
- 规定几何内核或求值算法。
- 取代 IFC；svg3dx 定位为可编译到 IFC 或其他交换格式的参数化“配方”层。

## 作者

danny许

## 许可证

Copyright (c) 2026 danny许

本项目采用 **MIT** 与 **木兰宽松许可证第2版（MulanPSL-2.0）** 双授权，任选其一即可。

- [LICENSE-MIT](LICENSE-MIT)
- [LICENSE-MulanPSL-2.0](LICENSE-MulanPSL-2.0)
