<p align="center">
  <img src="assets/title.png" alt="svg 3dx" width="320"/>
</p>

# svg3dx

[English](README.md) | 中文

**svg3dx** 是一种开放的、基于 XML 的参数化三维几何格式。它在 SVG 之上扩展，而非取而代之：保留 SVG 的元素结构、命名空间模型与 CSS 样式机制，并增加一层薄而明确的三维图元、参数、逻辑与显示配置。

命名空间前缀：`s3dx` · 草案 URI：`urn:s3dx:draft:0.1`

## 关联库

| 仓库 | 职责 |
|------|------|
| **svg3dx**（本仓） | 格式规范与 samples |
| [svg3dx-core](https://github.com/xiaohunqupo/svg3dx-core) | 解析求值引擎（WASM + C ABI） |
| [svg3dx-viewer](https://github.com/xiaohunqupo/svg3dx-viewer) | 可嵌入的查看器组件 |
| [svg3dx-studio](https://github.com/xiaohunqupo/svg3dx-studio) | svg3dx 编辑器 |

## 要解决的问题

现有参数化 CAD 格式（Revit 族、广联达构件编辑器、各厂商专有参数化）封闭且绑定私有内核；通用网格格式（STL、OBJ、GLB）只保存静态结果，没有“配方”概念。svg3dx 填补这一空白：一种**可读、与内核无关的配方格式**，描述几何*如何*被参数化，而不只是最终形状*是什么*。

## 核心设计

- **天生兼容 SVG。** 三维元素位于自定义命名空间（`urn:s3dx:draft:0.1`）。标准 SVG 渲染器会忽略它们，并继续渲染二维内容。根元素上的扩展属性 `svg3d="true"` 开关启用三维语义。三维变换写在 `s3dx:transform` 上，不占用 SVG 的 `transform`。
- **用 CSS 自定义属性承载参数。** 声明写 `--name`，引用写 `var(--name)`，标量运算用 `calc(...)`（如 `calc(var(--D) - 10)`）。文档级默认用 `:root { --H: 100; }`，类规则可覆盖。循环注入 `--loop-index` / `--loop-value`。**外部传参只能覆盖 `:root` 中的直接字面量**（不含 `var`/`calc`），类规则与派生量不可被外部改写。图元属性名采用 lowerCamelCase（如 `length`、`lengthVec`）。
- **用结构表达逻辑，而非塞进语法。** 条件是独立元素（`s3dx:if` / `s3dx:if-not`，属性 `test`）；循环是独立元素（`s3dx:loop-points`、`s3dx:loop-range`）；布尔运算是元素（`s3dx:bool-union` / `subtract` / `intersect`），作用域封闭、按文档顺序求值。`<g>` 只做分组、命名与参数作用域。
- **与几何内核解耦。** 格式只描述几何操作；求值交给后端（Open CASCADE、Manifold 等）。规范不规定数值精度。
- **配置显示，不定义相机。** `<s3dx:model>` 声明渲染模式（`solid` / `wireframe` / `hidden-line`）以及要显示的几何；视点与投影留给宿主。
- **SMIL 形基础动画。** `<s3dx:animate>` 驱动 CSS 自定义属性（参数时间轴）；`<s3dx:animateTransform>` 驱动 `s3dx:transform`（机构演示）。时钟由宿主实现。

## 状态

- **草案 0.1（稳定轨）**：`urn:s3dx:draft:0.1` — 现有样例与 viewer 可继续使用。
- **草案 0.2（演进轨）**：`urn:s3dx:draft:0.2` — 定位点 `s3dx:point`、活引用 `ref(#id)`、动画子集等。实现须兼读两版。

## 仓库结构

```
svg3dx/
├── assets/                 # Logo 与标题图
├── docs/                   # 格式规范（0.1 稳定 / 0.2 演进）
│   ├── svg3dx-spec-draft-0.2.md
│   └── svg3dx-spec-draft-0.1.md
├── namespaces/             # 命名空间定义与注册表索引
│   ├── registry.xml
│   ├── svg3dx/svg3dx.draft.0.2.xml
│   ├── svg3dx/svg3dx.draft.0.1.xml
│   └── acme/acme.equipment.1.0.xml
├── samples/                # draft-0.1-*（稳定）与 draft-0.2-*（新能力）
├── LICENSE-MIT             # MIT（任选其一）
├── LICENSE-MulanPSL-2.0    # 木兰宽松许可证第2版
├── README.md
└── README.zh-CN.md
```

## 文档

- 格式规范（草案 0.2）：[`docs/svg3dx-spec-draft-0.2.md`](docs/svg3dx-spec-draft-0.2.md)
- 格式规范（草案 0.1 稳定）：[`docs/svg3dx-spec-draft-0.1.md`](docs/svg3dx-spec-draft-0.1.md)
- 元数据命名空间注册表：[`namespaces/registry.xml`](namespaces/registry.xml)
- 定位点与引用：[`draft-0.2-point-ref.svg3dx`](samples/draft-0.2-point-ref.svg3dx)
- 动画：[`animate-param`](samples/draft-0.2-animate-param.svg3dx) / [`animate-transform`](samples/draft-0.2-animate-transform.svg3dx)
- 综合示例（0.1）：[`samples/draft-0.1-example.svg3dx`](samples/draft-0.1-example.svg3dx)
- 曲线图元：[`line`](samples/draft-0.1-line.svg3dx) / [`arc`](samples/draft-0.1-arc.svg3dx) / [`path`](samples/draft-0.1-path.svg3dx) / [`curves`](samples/draft-0.1-curves.svg3dx)
- 构造体：[`extrude`](samples/draft-0.1-extrude.svg3dx) / [`revolve`](samples/draft-0.1-revolve.svg3dx) / [`loft`](samples/draft-0.1-loft.svg3dx) / [`sweep`](samples/draft-0.1-sweep.svg3dx) / [`pipe`](samples/draft-0.1-pipe.svg3dx)
- 元数据（SVG `<metadata>` + 厂商 NS）：[`metadata-oem-nozzle`](samples/draft-0.1-metadata-oem-nozzle.svg3dx)

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
