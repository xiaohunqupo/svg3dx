# svg3dx 格式规范（草案 0.2）· 中文版

> 项目概览与授权说明见仓库根目录 [README.zh-CN.md](../README.zh-CN.md) / [README.md](../README.md)。作者：danny许。  
> **语言**：本文件为**中文版**。English edition: [svg3dx-spec-draft-0.2.en.md](./svg3dx-spec-draft-0.2.en.md)。  
> **官方名词**：属性、类型、预制材质的官方中文名见 [svg3dx-vocab-draft-0.2.md](./svg3dx-vocab-draft-0.2.md)；文档中的英文标识符为保存用词，中文名为规范显示名。

## 0. 文档状态

- 本规范为草案 **0.2**（试水轨）。本版用于特性试水，条目可能改写或撤掉；版本计划见 [路线图](./roadmap.md)。命名空间 URI `urn:s3dx:draft:0.2` 为临时值，正式发布时将更换。
- 草案 **0.1**（`urn:s3dx:draft:0.1`）为**稳定轨**：现有样例与宿主可继续使用；实现须兼读 0.1 与 0.2。从 0.1 升级见文末**迁移**章。
- 项目/格式名：`svg3dx`。命名空间前缀：`s3dx`。Logo 标识为 `s3dx`，全称标题为 `svg 3dx`。
- 本草案文件不保证在正式版中可解析。实现应按 URI 识别三维命名空间，不依赖前缀字面量（推荐前缀 `s3dx`）。
- 文件扩展名使用 `.svg`，通过根属性 `svg3d="true"` 区分三维内容。正式版可考虑 `.svg3dx`【待定】。
- **双语与名词**：规范同时维护中文版与英文版；文件内属性名 / 元素名 / 材质关键词为英文标识符，中文版正文使用官方中文名（见名词表）。

## 1. 文档模型

### 1.1 根元素与开关

- 根元素为 SVG `<svg>`，可包含本格式定义的扩展属性 `svg3d`（无命名空间前缀，挂在 SVG 根上）。
- `svg3d="true"` 启用三维语义；缺省或 `svg3d="false"` 时，所有 `s3dx:*` 元素及其子树按 SVG 未知命名空间元素处理：保留在 DOM 中，不参与求值，不渲染，不影响二维内容。
- `svg3d` 是总开关，优先级高于命名空间：`false` 时即使命名空间正确也忽略。
- 属性名为 `svg3d`。语义是“本 SVG 是否包含三维内容”，与项目名解耦。标准 SVG 用户代理会忽略未知属性，不影响二维渲染。

### 1.2 命名空间

- 三维元素使用命名空间 `urn:s3dx:draft:0.2`，推荐前缀 `s3dx`。
- 三维**元素**进命名空间：核心图元见 3.2（`point`、`box`、`cylinder`、`sphere`、`cone`、`torus`、`wedge`、`pyramid`、`prism`、`sector-cylinder`、`line`、`arc`、`path`、`extrude`、`revolve`、`loft`、`sweep`、`pipe`、`gltf`）；子元 `<s3dx:section>`（以及作为轨迹容器时的 `<s3dx:path>`）；以及 `<s3dx:if>`、`<s3dx:if-not>`、`<s3dx:loop-points>`、`<s3dx:loop-range>`、`<s3dx:bool-union>`、`<s3dx:bool-subtract>`、`<s3dx:bool-intersect>`、`<s3dx:use>`、`<s3dx:model>`、`<s3dx:materials>`、`<s3dx:material>`、`<s3dx:animate>`、`<s3dx:animateTransform>`。可机读元素/属性目录见 [`namespaces/svg3dx/svg3dx.draft.0.2.xml`](../namespaces/svg3dx/svg3dx.draft.0.2.xml)，并在 [`namespaces/registry.xml`](../namespaces/registry.xml) 登记；**求值与语义仍以本文为准**。
- **无前缀属性**（null 命名空间）：图元几何属性（lowerCamelCase，见 3.2）、以及 `href`、`mode`、`test`、`points`、`start`、`end`、`step`、`active`、`svg3d`、三维着色相关的 `fill` / `material` / `opacity`（见第 8 节）、动画相关的 `attributeName` / `from` / `to` / `dur` / `repeat` / `begin` / `calcMode` / `type` 以及动画元素上的 `fill`（见第 10 节）等。
- **带命名空间的属性**：三维变换使用 `s3dx:transform`（见 3.4），**不**占用 SVG 标准的 `transform` 表现属性，以免与二维 6 数 `matrix` 冲突。
- 标准 SVG 解析器对未知命名空间元素的处理：包含在 DOM 中，不渲染，不进一步处理。本格式依赖此行为实现二维兼容。
- **外挂命名空间与元数据（强制）**：实现解析时须将外国命名空间元素/属性完整纳入 DOM；官方往返与 optimize 须原样保留这些节点。几何求值范围仅包含本规范定义的 `s3dx` 语义与 SVG 分组/样式作用域（见第 12 节）；外国命名空间与标准 SVG [`<metadata>`](https://www.w3.org/TR/SVG11/metadata.html) 子树留在 DOM 中供宿主/领域工具读取（见第 9 节）。动画元素保留在 DOM 中，由实现动画时钟的宿主解释（见第 10 节）。

### 1.3 二维兼容

- 纯二维内容仅使用 SVG 标准命名空间元素，实例化使用标准 `<use>`，不依赖 `<s3dx:use>`。
- 同一 `<g>` 可同时被标准 `<use>` 和 `<s3dx:use>` 引用：前者在二维渲染中生效，后者在三维求值中生效，互不干扰。
- 本格式不定义三维视口范围。三维几何的投影、观察变换、可见范围由宿主环境决定。

### 1.4 世界坐标系

- **右手坐标系**；**`+Z` 为高度方向**。
- **XY 平面**对应 SVG 二维绘图平面：截面内无前缀 SVG 几何（`path` / `circle` / …）以及缺省 `normal="0 0 1"` 的截面，都落在局部 XY。
- 水平布置、平面折线优先写在 XY；需要“立起来”时沿 `+Z` 升高。

## 2. 参数系统

### 2.1 声明位置

参数以 CSS 自定义属性形式声明，支持以下位置（查找时最近声明者优先，见 2.3）：

1. `<style>` 块内的 `:root` 规则：`:root { --参数名: 值; }`（文档级默认，继承到全部后代）
2. `<style>` 块内的类规则：`.类名 { --参数名: 值; }`
3. 元素内联 `style` 属性：`style="--参数名: 值;"`（含根 `<svg>` 内联）

**参数查找**：须识别 `:root`、类选择器，以及内联 `style` 上的自定义属性。`:root` 与 CSS 一致，等价于在文档根声明；根元素内联 `style` 与 `:root` 同属文档根作用域，内联优先。文档仍可使用完整 CSS 做二维样式（实现可忽略未列出的选择器）。

### 2.2 引用语法

- 参数引用使用标准 CSS 形式的 `var(--名字)`（`<dashed-ident>`，与 SVG / CSS 自定义属性一致）。
- 声明与引用成对：声明 `--D: 200`，引用 `var(--D)`（括号内必须带 `--`）。
- **标量运算**使用标准 CSS `calc(...)`，不要把运算符直接粘在 `var()` 后面：
  - 正确：`calc(var(--D) - 10)`、`calc(var(--R) / 3)`
  - 错误：`var(--D)-10`、`var(--R)/3`
- 不支持 `[名字]`、省略 `--` 的 `var(名字)`；实现遇到此类写法应视为语法错误并警告。
- 循环迭代变量为合法 dashed-ident：`var(--loop-index)`、`var(--loop-value)` 等（见第 6 节）。

### 2.3 作用域查找顺序

沿 DOM 祖先链向上查找，最近声明者优先，找到即停：

1. 外部传入参数（最高优先级）
2. 动画采样覆盖（见第 10 节；仅实现动画时钟的宿主注入）
3. 最近祖先 `<g>` 的类规则或内联 `style`
4. 更远祖先的类规则或内联 `style`
5. 文档根作用域：根元素内联 `style`，其次 `:root` 规则
6. 默认值

嵌套 `s3dx:loop-*` 时，内层迭代变量遮蔽外层。

### 2.4 类型解析

- 纯数字字符串 → 数字。
- 空格分隔的数字序列 → 向量。
- `true`/`false` → 布尔。
- 其余 → 字符串。
- 表达式求值时类型不匹配（如字符串用于数值运算）→ 求值错误。

### 2.5 外部传参

- 外部参数是“参数名 → 值”的映射，注入形式由宿主环境决定，规范不绑定（URL query、宿主 API、命令行均可）。
- 优先级最高。命中时直接使用外部值，不再沿 DOM 链查找。
- 不修改 DOM，不改变 CSS 计算值；只在求值阶段作为最高优先级查找结果。
- 未提供的外部参数回退到 DOM 声明；DOM 也没有则求值错误。
- 外部参数键名对应自定义属性名：可传 `D` 或 `--D`（实现应归一化，去掉可选的前导 `--` 再查找）。
- 外部参数值按 2.4 同规则解析类型。
- **与参数 UI 的边界（澄清）**：把 `:root` 直接字面量**展示**在宿主参数栏，**不等于**已提供外部传参。仅当宿主**显式钉住**（用户确认覆盖、或 API/URL 注入）时，该键才按本条外部优先级生效。未钉住时仍走 §2.3 后续档（含动画采样与 DOM）。
- **与动画同时命中同一属性**：外部钉住优先生效（动画对该键本帧不生效）。宿主 UI **宜**标明“已覆盖动画”，并提供取消钉住以恢复动画驱动；不宜在无提示的情况下把表单编辑静默提升为外部覆盖。

**白名单（强制）**：外部**仅允许**覆盖在 `<style>` 的 `:root` 规则中**直接字面量**声明的自定义属性。

- 允许：`:root { --H: 100; --Label: tank; }`，外部可传 `H` / `Label`。
- 不允许覆盖：
  - 仅出现在类规则中的参数（如 `.tanks { --R: 50; }`）
  - `:root` 中含 `var(` / `calc(` 的派生声明（如 `--D: calc(var(--H) - 20)`）
  - 根元素或其他元素内联 `style` 上的自定义属性（公开可调参数应写在 `:root`）
- 实现遇到白名单外的外部键：必须**不应用**该键，并产生警告；不得静默当作任意 DOM 参数覆盖。
- 目的：把宿主可调入口收敛为文档显式公开的直接量，避免外部传参改写内部派生量或局部参数导致模型行为失控。

### 2.6 表达式与 `calc()` / `ref()`

分层约定（尽量贴近 CSS，比较/逻辑与定位点引用由本格式补齐）：

| 层次 | 写法 | 用途 |
|---|---|---|
| 参数引用 | `var(--名字)` | 取自定义属性 / 循环注入变量 |
| 标量算术 | `calc(...)` | `+ - * /` 与括号，语法对齐 CSS Values `calc()` |
| 定位点引用 | `ref(#id)` | 取文档中 `<s3dx:point id="…">` 的当前坐标（见 2.9） |
| 比较 / 逻辑 | 本格式表达式 | `=` `<` `>` `<=` `>=` `<>`，以及 `and` `or` `not`（用于 `s3dx:if` / `s3dx:if-not` 的 `test` 等） |

- 数值属性中：字面量、`var(--*)`、或 `calc(...)`。
- **点**与**点列**属性中：字面量三数、`var(--*)`（向量）、`calc(...)`（标量分量嵌入）、或 `ref(#id)`（见 2.9）。
- 条件 `test` 中：比较两侧可为字面量、`var(--*)` 或 `calc(...)`，例如 `test="var(--R) = 50"`、`test="calc(var(--R) / 2) &lt; 20"`。`test` 中不得使用 `ref(#id)`。
- `=` 表示相等比较，不存在赋值。
- XML 属性中含 `<`、`&` 须转义为 `&lt;`、`&amp;`。
- `calc()` 内建议按 CSS 习惯在 `+` / `-` 两侧留空格（如 `calc(var(--D) - 10)`）。
- 求值失败（语法错误、未定义参数、类型不匹配、无效 `ref`）→ 跳过出错元素子树 + 警告。

### 2.7 与 CSS / SVG 的对齐说明

- **`var()` / `calc()` 本身是 CSS 标准**，在支持 CSS 的 SVG 用户代理中，用于 **CSS 属性**（`<style>`、元素 `style="..."`）时按 CSS 级联与计算。
- 本格式另外规定：在 **svg3dx 求值的属性值**中（如数值属性、`test`、`s3dx:transform` 等）也可书写 `var(--*)` / `calc(...)` /（点属性中的）`ref(#id)`，由 **svg3dx 求值器**解析。这不要求浏览器对**非 CSS 的 XML 属性**做变量替换。
- 因此：二维样式走 CSS；三维参数/表达式走 svg3dx 求值器——语法对齐，宿主分工不同。
- 自定义属性名须为合法 CSS `<dashed-ident>`（如 `--D`、`--loop-value`）；**不得**使用 `--loop.value` 这类含 `.` 的名字。
- 一个 `var(--*)` 的值可以是多个空格分隔的 token（CSS 允许多 token 替换）；本格式用此表达向量嵌入（见 2.8）。

### 2.8 向量在属性值中的展开

- 向量类型变量（如 `var(--loop-value)` 在 `loop-points` 中为三维点）嵌入属性值时，按空格展开为三个数字（对齐 CSS `var()` 多 token 替换）。
- 例：`s3dx:transform="matrix(1 0 0 0 1 0 0 0 1 var(--loop-value))"` 在 `--loop-value: 100 200 300` 时等价于 `matrix(1 0 0 0 1 0 0 0 1 100 200 300)`。
- 三维矩阵 **规范写法用空格分隔**（见 3.4），以便向量直接嵌入。
- 如需单独访问分量，使用独立自定义属性：`var(--loop-value-x)`、`var(--loop-value-y)`、`var(--loop-value-z)`（由循环展开时注入，见第 6 节）。
- 对分量做运算时用 `calc`，例如 `calc(var(--loop-value-x) * 50)`。
- `points` 属性中的向量序列与 `ref(#id)` 按同样规则展开（每个 `ref(#id)` 展开为三个数字）。

### 2.9 定位点引用 `ref(#id)`

- 语法：`ref(#id)`，`id` 为文档内某个 `<s3dx:point>` 的 `id` 属性（仅片段引用；不得为外部 IRI）。
- 适用范围：类型为**点**的属性整值，或**点列**中代替单个点的一个 token（可与字面量点混写）。
- 不设并行的 `*-ref` 属性；字面量、`var`/`calc` 与 `ref` 写在同一属性槽，由语法区分。
- **活绑定**：文件中持久化 `ref(#id)` 本身；官方 optimize **不得**把 `ref(#id)` 内联成数字。
- **每次求值**推导坐标（不是写入时的快照）：
  1. \(P_{\mathrm{world}} = M_{\mathrm{ancestors}}(\mathrm{point})\cdot M_{\mathrm{point}}\cdot \mathrm{at}\)
  2. \(P_{\mathrm{local}} = \bigl(M_{\mathrm{ancestors}}(\mathrm{consumer})\cdot M_{\mathrm{consumer}}\bigr)^{-1}\cdot P_{\mathrm{world}}\)
  - 其中 \(M\) 为该节点自身与祖先三维组装容器上的 `s3dx:transform` 累积（见 3.1）；`at` 为定位点局部坐标。
- 目标须为 `s3dx:point`；找不到 id、类型不符、或变换不可逆 → 警告并跳过消费该属性的图元（与属性求值失败一致）。
- 引用解析使用文档中带该 `id` 的原始定位点元素；不解析 `<s3dx:use>` 实例化产生的合成路径 id。
- `<s3dx:point>` 的 `at` 属性本身不得再写 `ref(#id)`（本草案仅允许字面量 / `var` / `calc`）。

```xml
<s3dx:point id="A" at="0 0 0"/>
<s3dx:point id="B" at="100 0 0"/>
<s3dx:line from="ref(#A)" to="ref(#B)"/>
<s3dx:path form="polyline" points="ref(#A)  ref(#B)  100 0 100"/>
```

## 3. 三维图元

### 3.1 通用规则

- 三维图元是 `s3dx:` 命名空间下的元素。图元之间一般不互相嵌套（分组用 `<g>`）；允许的子元素仅限：
  - `<s3dx:section>`（拉伸体 / 旋转体 / 放样体 / 扫掠体的截面，见 3.2.4）
  - `<s3dx:path>`（扫掠体 / 圆管的轨迹容器；亦可作独立复合曲线，见 3.2.3）
  - **例外**：`<s3dx:path>` 可直接包含 `<s3dx:line>` / `<s3dx:arc>` 作为曲线段（对齐 STEP `composite_curve` / OCC `Wire`）
  - `<s3dx:animateTransform>`（变换动画；不参与几何操作图，见第 10 节）
- 图元属性表以本节与附录维护；属性表增补不改变文档格式语法。未在表中列出的属性，实现应忽略并警告。
- 局部坐标 → 父级变换 → 世界坐标的累积规则：图元属性定义的局部几何，先应用图元自身 `s3dx:transform`，再沿祖先**三维组装容器**累积 `s3dx:transform`（`<g>`、`<s3dx:use>`、`<s3dx:if>` / `<s3dx:if-not>`、`<s3dx:loop-*>`、`<s3dx:bool-*>` 等）。`<s3dx:section>` 内的二维轮廓子节点属于截面组成，不进入该三维变换链。
- **分层原则**：核心层只收各厂商都能映射的通用体元、曲线与经 `gltf` 引用的三角资产；行业专用形体（风管配件、封头等）不进核心，见附录 13.3（可用 `loft` / `revolve` / 布尔组合表达）。

### 3.2 图元属性表（草案 0.2）

属性名与 [`samples/draft-0.1-example.svg3dx`](../samples/draft-0.1-example.svg3dx) 对齐；几何语义对齐 AutoCAD 实体图元、Open CASCADE 构造算子（`MakePrism` / `MakeRevol` / `ThruSections`）、以及由 `s3dx:gltf` 引用的 glTF 2.0 资产。

**属性命名**：图元属性名采用 SVG 常见的 **lowerCamelCase**（全小写开头，如 `length`、`lengthVec`、`bottomCenterPt`）。元素名保持小写；多词时用连字符（如 `sector-cylinder`、`if-not`、`loop-points`、`bool-union`）。XML 属性名大小写敏感；实现不得把 `Length` 当作 `length` 的别名。

**官方中文名**：下表「属性」列为保存用英文标识符；对应官方中文名（如 `length` → **长度**、`bottomCenterPt` → **底面圆心**）以 [官方名词表](./svg3dx-vocab-draft-0.2.md) 为准。图元标题括号内名称（如 `s3dx:box`（长方体））为该类型的官方中文名。

#### 3.2.1 类型与通用约定

| 类型记号 | 含义 | 属性值写法 |
|---|---|---|
| 数字 | 标量长度/尺寸 | `100`、`var(--D)`、`calc(var(--D) - 10)` |
| 布尔 | 真/假 | `true` / `false` |
| 点 | 三维点 | `x y z`（三数，空格分隔）；或 `ref(#id)`（见 2.9） |
| 向量 | 三维方向或位移 | `x y z`；实现时应归一化方向向量（零向量为错误） |
| 角度 | 度（°），逆时针为正 | `90`、`var(--A)`、`calc(var(--A) * 2)` |
| 点列 | 点序列 | `x1 y1 z1 x2 y2 z2 …`（长度须为 3 的倍数）；序列中任一点可写为 `ref(#id)` |
| 向量列 | 向量序列 | 同点列（每向量 3 数） |
| 数列 | 标量序列 | `u0 v0 u1 v1 …` |
| IRI | 资源引用 | 与 SVG 外部资源相同的解析规则（相对**文档基 URL**） |

**通用可选属性**（适用于所有三维图元，不在下表逐行重复）：

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `s3dx:transform` | 12 数矩阵 | 单位变换 | 见 3.4；先于父级变换应用；**不是** SVG 的 `transform` |

**尺寸量级与推荐默认**：

- 图元主尺寸（边长、直径、高度、路径跨度等）宜取约 **`100`** 的量级（与文档用户单位一致），便于样例与互操作对齐。
- 下表「默认」列：对**可选**属性表示省略时的求值默认；对**必选**属性给出的数表示**推荐默认**，文档仍应写出该属性。球体等以直径约 `100` 为参照时，半径推荐 `50`。

**局部坐标系通则**：

- 图元属性在局部坐标中定义几何；再应用自身 `s3dx:transform`，再累积祖先三维组装容器上的 `s3dx:transform`（见 3.1）。
- 对带 `lengthVec` / `widthVec` 的图元：高度方向为 `normalize(lengthVec × widthVec)`（右手系）。未给出时默认 `lengthVec="1 0 0"`、`widthVec="0 1 0"`，高度沿 `+Z`。
- 对带底/顶中心的回转体：轴线为 `topCenterPt − bottomCenterPt`；长度为其模长。两端中心重合视为错误。
- 角度未给出时，闭合回转体按整圈 `360` 处理。
- 长度类属性须为正；直径/半径须为正。`topDiameter="0"` 的圆锥退化为尖顶，允许。

#### 3.2.3 基本实体

##### `s3dx:box`（长方体）

对齐 AutoCAD `BOX` 的长/宽/高语义；方向由向量给出以便任意姿态。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `length` | 是 | 数字 | `100` | 沿 `lengthVec` 的边长 |
| `width` | 是 | 数字 | `100` | 沿 `widthVec` 的边长 |
| `height` | 是 | 数字 | `100` | 沿 `lengthVec × widthVec` 的边长 |
| `lengthVec` | 否 | 向量 | `1 0 0` | 长度方向 |
| `widthVec` | 否 | 向量 | `0 1 0` | 宽度方向（应与 lengthVec 不共线） |

局部原点：底面一角；底面由 `lengthVec`/`widthVec` 张成，向高度方向挤出。

##### `s3dx:cylinder`（圆柱）

对齐“底面圆心 + 另一圆心 + 直径”写法（等同 AutoCAD 圆柱“另一圆心”与 OCC `MakeCylinder` 的轴段）。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `diameter` | 是 | 数字 | `100` | 圆柱直径 |
| `bottomCenterPt` | 是 | 点 | `0 0 0` | 底面圆心 |
| `topCenterPt` | 是 | 点 | `0 0 100` | 顶面圆心 |

端面垂直于轴线。扇形柱面见 `sector-cylinder`。

##### `s3dx:sphere`（球体）

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `radius` | 是 | 数字 | `50` | 半径（直径约 `100` 量级） |
| `center` | 是 | 点 | `0 0 0` | 球心 |

##### `s3dx:cone`（圆锥 / 圆台）

对齐 OCC `MakeCone(r1,r2,h)`：两端直径可不等；`topDiameter=0` 为尖锥。偏心两端用 `loft` 表达，不单开图元。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `bottomDiameter` | 是 | 数字 | `100` | 底面直径 |
| `topDiameter` | 是 | 数字 | `40` | 顶面直径；`0` 表示尖顶 |
| `bottomCenterPt` | 是 | 点 | `0 0 0` | 底面圆心 |
| `topCenterPt` | 是 | 点 | `0 0 100` | 顶面圆心 |

两端须共轴（圆心连线为轴）。

##### `s3dx:torus`（圆环）

对齐 AutoCAD `TORUS` / OCC `MakeTorus`。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `diameter1` | 是 | 数字 | `100` | 主直径 = 2 ×（环心到圆管中心） |
| `diameter2` | 是 | 数字 | `25` | 圆管截面直径 |
| `angle` | 否 | 角度 | `360` | 环向扫掠角；`<360` 为扇环 |
| `torusCenterPt` | 是 | 点 | `0 0 0` | 环心 |
| `normal` | 是 | 向量 | `0 0 1` | 环平面法向 |

扫掠起始方位：实现可选固定启发式；正式版可增补 `refDir`【待定】。

##### `s3dx:wedge`（楔体）

对齐 AutoCAD `WEDGE`；截顶楔参考 OCC `ltx`。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `length` | 是 | 数字 | `100` | 底面长度（楔形倾斜沿此方向） |
| `width` | 是 | 数字 | `100` | 底面宽度 |
| `height` | 是 | 数字 | `100` | 厚端高度 |
| `lengthVec` | 否 | 向量 | `1 0 0` | 长度方向（指向薄端） |
| `widthVec` | 否 | 向量 | `0 1 0` | 宽度方向 |
| `topLength` | 否 | 数字 | `0` | 薄端顶边长度；`0` 为尖楔 |

##### `s3dx:prism`（棱柱）

底面多边形沿法向直挤出（`extrude` 的矩形/多边形快捷形式）。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `points` | 是 | 点列 | `0 0 0  100 0 0  100 100 0  0 100 0` | 底面多边形顶点，至少 3 点；顺序、不自交；首尾不必重复 |
| `height` | 是 | 数字 | `100` | 挤出高度 |
| `normal` | 否 | 向量 | 由底面三点按右手系推定 | 挤出方向 |

##### `s3dx:sector-cylinder`（扇形柱）

对齐 OCC `MakeCylinder(r, h, angle)`。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `diameter` | 是 | 数字 | `100` | 直径 |
| `bottomCenterPt` | 是 | 点 | `0 0 0` | 底面圆心 |
| `topCenterPt` | 是 | 点 | `0 0 100` | 顶面圆心 |
| `angle` | 否 | 角度 | `360` | 绕轴扫掠角（度）；`360` 等价于 `cylinder` |

角参数约定（对齐 OCC `MakeCylinder`）：

- 轴线：`bottomCenterPt` → `topCenterPt`。
- **0°** 在垂直于轴线的平面内，取世界 **`+X` 投影到该平面**的方向（若轴线平行于 `+X`，则改用 `+Y` 投影）。
- 扫掠绕轴线按**右手系**计量（自轴正向看为逆时针），自 0° 转到 `angle`。

##### `s3dx:pyramid`（棱锥 / 棱台）

对齐 IFC `IfcRectangularPyramid`、PDMS `PYRA`：矩形底 + 顶点（或顶面矩形）。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `length` | 是 | 数字 | `100` | 底面边长 |
| `width` | 是 | 数字 | `100` | 底面边宽 |
| `height` | 是 | 数字 | `100` | 底面到顶的高度 |
| `lengthVec` | 否 | 向量 | `1 0 0` | 底面长度方向 |
| `widthVec` | 否 | 向量 | `0 1 0` | 底面宽度方向 |
| `topLength` | 否 | 数字 | `0` | 顶面边长；`0` 为尖顶棱锥 |
| `topWidth` | 否 | 数字 | `topLength` | 顶面边宽；缺省与 `topLength` 相同 |

局部原点：底面中心；高度沿 `lengthVec × widthVec`。

#### 3.2.2 定位点

##### `s3dx:point`（定位点）

命名空间中的可引用空间锚点：出现在节点树中，求值发出定位点指令供宿主（尤其是编辑器）绘制标记；**不参与**布尔实体运算。其它图元的点属性可通过 `ref(#id)` 引用其当前坐标（见 2.9）。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `id` | 条件 | 字符串 | — | 文档内唯一；被 `ref(#id)` 引用时必选 |
| `at` | 否 | 点 | `0 0 0` | 局部坐标；仅字面量 / `var` / `calc`，不得为 `ref(#id)` |

通用可选属性：`s3dx:transform`、`class`、以及宿主绘制用的 `fill` / `opacity`（见通用 drawable）。

```xml
<s3dx:point id="A" at="0 0 0"/>
<s3dx:point id="B" at="100 0 50" s3dx:transform="translate(0 20 0)"/>
```

#### 3.2.4 曲线图元（线 / 圆弧 / 复合路径）

对齐 STEP / IFC 的 `polyline` / `trimmed_curve(circle)` / `composite_curve`，以及 OCC `Edge` / `Wire`：三维线与圆弧是一等图元，可独立显示，也可作为 `<s3dx:path>` 的**轨迹子段**（描述中心线本身长什么样）。

注意：扫掠体 / 圆管在折角处**面如何衔接**（圆角 / 斜切 / 斜接；外角 / 内角可不同）由父体的外角 / 内角属性在求值时自动生成。`path` 里的 `line`/`arc` 只表达轨迹几何。

对照关系（非规范性）：

| svg3dx | STEP | IFC | OCC |
|---|---|---|---|
| `line` | `polyline`（两点）/ `line`+trim | `IfcPolyline`（两点） | `Geom_Line` → `Edge` |
| `arc` | `trimmed_curve` + `circle` | `IfcTrimmedCurve` + `IfcCircle`；或 `IfcArcIndex` | `Geom_Circle` → `Edge` |
| `path` | `composite_curve` | `IfcCompositeCurve` / `IfcIndexedPolyCurve` | `TopoDS_Wire` |

##### `s3dx:line`（三维直线段）

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `from` | 条件 | 点 | `0 0 0` | 起点；作为 `path` 子段且紧接上一段时，可省略（默认接上一段终点） |
| `to` | 是 | 点 | `100 0 0` | 终点；不得与起点重合 |

```xml
<s3dx:line from="0 0 0" to="100 0 0"/>
```

##### `s3dx:arc`（三维圆弧段）

圆弧位于以 `center` 为原点、`normal` 为法向的平面上；角参数自 `xDir`（投影到该平面）起，绕 `normal` 按右手系计量。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `form` | 否 | 枚举 | 见推断 | 参数形式：`angles`（角参数）或 `ends`（起终点）；缺省由属性推断；写出与 optimize 输出宜写明 `form` |
| `center` | 是 | 点 | `0 0 0` | 圆心 |
| `normal` | 是 | 向量 | `0 0 1` | 圆弧平面法向 |
| `radius` | 条件 | 数字 | `100` | 半径；`form="ends"` 时可省略并由弦长校核 |
| `xDir` | 否 | 向量 | 见说明 | **`angles`**：角参数 0° 参考方向；缺省取平面内与世界轴尽量对齐的稳定方向 |
| `startAngle` | 否 | 角度 | `0` | **`angles`**：起点角 |
| `angle` | 条件 | 角度 | `90` | **`angles`**：扫掠角（可负，表示反向） |
| `from` | 条件 | 点 | — | **`ends`**：弧起点（须在圆上，容差内）；作为 `path` 子段时可省略以接上一段终点 |
| `to` | 条件 | 点 | — | **`ends`**：弧终点（须在圆上） |

**`form`（参数形式）**：两种写法互斥；实现须按 `form` 解释，并忽略（或优化时移除）另一形式的专属属性。缺省推断：同时有非空 `from` 与 `to` → `ends`，否则 → `angles`。

1. **`form="angles"`**（圆心 + 半径 + 角）：`center` `normal` `radius` `startAngle` `angle`（可选 `xDir`）
2. **`form="ends"`**（圆心 + 起终点）：`center` `normal` `from` `to`（可选 `radius`）；劣弧 / 优弧歧义时附加 `major="true"`【待定】消解，0.1 默认取 ≤180° 劣弧

```xml
<!-- 角参数写法 -->
<s3dx:arc form="angles" center="0 0 0" normal="0 0 1" radius="100"
          xDir="1 0 0" startAngle="0" angle="90"/>

<!-- 起终点写法（90° 弯管常用） -->
<s3dx:arc form="ends" center="100 0 50" normal="0 -1 0" radius="50"
          from="100 0 0" to="150 0 50"/>
```

约束：`radius > 0`；`|angle|` 为 0 视为退化（跳过 + 警告）；整圆可用 `angle="360"`（显示为闭曲线；作路径段时起终点重合）。

##### `s3dx:path`（复合三维曲线 / 轨迹）

对齐 `composite_curve` / `Wire`：有序曲线段首尾相接。可：

- 作为**独立图元**（中心线、标注辅助线、管道路由预览等）
- 作为 `sweep` / `pipe` 的**轨迹子元素**

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `form` | 否 | 枚举 | 见推断 | 参数形式：`polyline`（折线点列）或 `segments`（曲线段子元素） |
| `points` | 条件 | 点列 | `0 0 0  100 0 0  100 0 100` | **`polyline`**：折线简便写法（≥2 点）；等价于若干首尾相接的 `line` |

子元素（**`form="segments"`**）：按文档顺序的 `<s3dx:line>` / `<s3dx:arc>`（样条 / 螺旋【待定】）。

**`form`**：与 `points` / 子元素互斥。缺省推断：存在 `line`/`arc` 子元素 → `segments`；否则有 `points` → `polyline`。同时出现时优先子元素并警告；优化应移除与 `form` 不符的一侧。

段连续性：每一段起点须等于上一段终点（实现容差建议 ≤ 1e-6 × 特征尺寸，或发出警告并强制对接）。

```xml
<!-- 轨迹本身含圆弧段（曲线路径几何） -->
<s3dx:path form="segments">
  <s3dx:line from="0 0 0" to="100 0 0"/>
  <s3dx:arc form="ends" center="100 0 50" normal="0 -1 0" radius="50"
            from="100 0 0" to="150 0 50"/>
  <s3dx:line from="150 0 50" to="150 0 100"/>
</s3dx:path>

<!-- 折线轨迹；若用于扫掠体/圆管，折角处的面衔接由外角/内角自动补 -->
<s3dx:path form="polyline" points="0 0 0  100 0 0  100 0 100"/>
```

`sweep` 的轨迹为子元素 `<s3dx:path>`。`pipe` 用 `form` 选择轨迹写法：`form="child"` 为子元素 `<s3dx:path>`，`form="inline"` 为父元素属性 `path="x1 y1 z1 …"`（二者择一）。

#### 3.2.5 构造体元（拉伸体 / 旋转体 / 放样体 / 扫掠体）

对应 STEP / IFC / SolidWorks / PDMS 等共通的扫掠族构造；行业异形件优先用它们组合，而不是定义专用图元。

对照关系（非规范性，详见附录 13.4）：

| svg3dx | STEP (ISO 10303-42) | IFC | SolidWorks | PDMS/E3D | Blender / 3ds Max |
|---|---|---|---|---|---|
| `extrude` | `extruded_area_solid` | `IfcExtrudedAreaSolid` | Extrude | EXTR（直线） | Extrude / Extrude 修改器 |
| `revolve` | `revolved_area_solid` | `IfcRevolvedAreaSolid` | Revolve | REVO | Spin / Lathe |
| `loft` | （截面蒙皮，常映射 B-Rep） | `IfcSectionedSolid*` 近似 | Loft | 多截面组合 | Loft / 曲线放样 |
| `sweep` | `surface_curve_swept_area_solid` | `IfcFixedReferenceSweptAreaSolid` 等 | Sweep | EXTR 沿路径 | Curve Bevel / Sweep 修改器 |
| `pipe` | `swept_disk_solid` | `IfcSweptDiskSolid` | Sweep（圆截面） | CYLI 段 / 弯头 CTOR | Bevel Depth 圆管 |

**职责拆分**：

| 角色 | 元素 | 内容 |
|---|---|---|
| 位姿 | `extrude` / `sweep` 的 `origin` / `normal` / `xDir`；`loft` / `revolve` 各 `section` 自带（`revolve` 还可用 section 的 `s3dx:transform` 做相对偏移）；旋转体整体位姿用父元素 `s3dx:transform` | 截面落在哪、朝哪 |
| 二维轮廓 | `<s3dx:section>` 内的二维体元（可多个） | 截面局部 2D |
| 三维轨迹 | `<s3dx:path>`（`points` 或 `line`/`arc` 子段） | 中心线**路径几何**（线段 / 圆弧等组成轨迹本身） |
| 扫掠体转角 | `sweep` / `pipe` 的外角 / 内角（`outerCorner` / `innerCorner` 及对应半径） | 轨迹折角处**外侧面 / 内侧面如何衔接**；求值时按属性自动生成 |

截面局部坐标 → 父局部 / 世界坐标（`extrude` / `loft` / `sweep` / `revolve`）：

- 局部 \(u\) 轴：将 `xDir` 投影到垂直于 `normal` 的平面并归一化（记为 \(\hat{X}\)）。
- 局部 \(v\) 轴：\(\hat{Y} = \hat{N} \times \hat{X}\)（右手系；\(\hat{N}\) 为归一化 `normal`）。
- 点映射：\(P = \mathrm{origin} + u\,\hat{X} + v\,\hat{Y}\)。
- 缺省：`origin="0 0 0"`、`normal="0 0 1"`、`xDir="1 0 0"`。
- 若 section 带 `s3dx:transform`：在上述点映射之后、相对**父构造体局部**再乘该变换（用于相对旋转体的偏移等）。
- `revolve` 在未写 transform / pose 时另有缺省取向矩阵（见 `s3dx:revolve`），把 XY 映到体局部 XOZ。

`revolve` 约束：截面平面必须与旋转体局部 **+Z 平行**（变换后的截面法向 \(\hat{N}'\) 满足 \(\lvert \hat{N}' \cdot \hat{Z}\rvert \approx 0\)）；否则该 section **无效**，不生成几何。单位变换 + 缺省 XY = 垂直于体 Z → 无效。

##### `<s3dx:section>`（截面，非独立图元）

仅作为 `extrude` / `revolve` / `loft` / `sweep` 的子元素。为与造型体元树形结构一致，各构造体元通过恰好一个（`loft` 为多个）`<s3dx:section>` 挂接轮廓，而不是把二维子节点直接写在父体下。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `origin` | 否 | 点 | 见说明 | 截面原点；`loft` / `revolve` 各截面可自带；`extrude` / `sweep` 缺省继承父元素位姿 |
| `normal` | 否 | 向量 | 见说明 | 截面平面法向；`revolve` 下变换后须 ⊥ 体 Z |
| `xDir` | 否 | 向量 | 见说明 | 截面局部 +X 参考方向 |
| `s3dx:transform` | 否 | 12 数矩阵 | 单位 | 相对父构造体的附加变换（`revolve` 上常用于截面相对旋转体的偏移） |

草案 0.2 允许的子元素（至少一个；**仅二维体元**，布尔 / 逻辑 / 循环暂不支持）：

| 子元素 | 说明 |
|---|---|
| `<path d="…">` | SVG path；0.1 实现至少支持 `M`/`L`/`H`/`V`/`Z`（及相对形式）；`A`/`C`/`Q` 等【待定，推荐实现】 |
| `<circle cx cy r>` | 圆 |
| `<ellipse cx cy rx ry>` | 椭圆 |
| `<polygon points="x1 y1 …">` | 封闭折线（二维点列） |
| `<polyline points="…">` | 折线（可开放） |
| `<rect x y width height>` | 轴对齐矩形 |

多个二维体元时：**各自独立参与**父构造（对 `revolve` 即同时旋转），不做并集 / 布尔；求值按文档顺序处理每一个。

轨迹用 `<s3dx:path>`（见 3.2.3）：折线 `points` 或 `line`/`arc` 子段。`sweep` / `pipe` 的折角面衔接另见外角 / 内角，与路径段定义分层。

##### `s3dx:extrude`（拉伸体）

对齐 STEP `extruded_area_solid` / IFC `IfcExtrudedAreaSolid` / OCC `MakePrism` / AutoCAD `EXTRUDE`。父元素携带截面位姿与拉伸量；轮廓必须用子元素 `<s3dx:section>`。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `origin` | 否 | 点 | `0 0 0` | 截面原点 |
| `normal` | 否 | 向量 | `0 0 1` | 截面法向；亦为缺省拉伸方向 |
| `xDir` | 否 | 向量 | `1 0 0` | 截面局部 +X |
| `dir` | 否 | 向量 | `normal` | 拉伸方向（可斜挤） |
| `length` | 是 | 数字 | `100` | 拉伸长度 |

子元素：恰好一个 `<s3dx:section>`（封闭轮廓生成实体）。

```xml
<s3dx:extrude origin="0 0 0" normal="0 0 1" length="100">
  <s3dx:section>
    <path d="M 0 0 L 100 0 L 100 100 L 0 100 Z"/>
  </s3dx:section>
</s3dx:extrude>
```

##### `s3dx:revolve`（旋转体）

对齐 STEP `revolved_area_solid` / OCC `MakeRevol` / AutoCAD `REVOLVE` / Blender Spin。

- **旋转轴**：旋转体局部 **+Z**，过体原点；整体位姿只由父元素 `s3dx:transform`（及宿主变换链）给出。
- **截面**：截面二维仍在 section 局部 **XY**；用 `origin` / `normal` / `xDir` 与 `s3dx:transform` 相对旋转体定位；求值得到体局部轮廓后再绕体 +Z 旋转。
- **有效性**：变换后的截面平面须与体 +Z **平行**；否则 section 无效，不生成几何。单位变换会把缺省 XY 截面留在与体 Z **垂直**的平面上，因而无效。
- **缺省取向**（未写 pose、也未写 `s3dx:transform` 时）：注入  
  `s3dx:transform="matrix(1 0 0 0 0 1 0 -1 0 0 0 0)"`  
  即将 section 局部 \((u,v,0) \mapsto (u,0,v)\)（体局部 XOZ；\(u\)=径向，\(v\)=轴向）。相对偏移时保留该 3×3，只改平移项。
- **转向**：`angle` 正值为绕 +Z **逆时针**（右手系）。

轮廓复杂度放在 `section` 内部。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `angle` | 否 | 角度 | `360` | 旋转角（正=逆时针） |
| `solid` | 否 | 布尔 | `true` | 是否尝试封成实体。旋转角小于 360° 时，对**闭合 path**（`d` 含 `Z`）与**闭合圆**（`<circle>`）用三角面片补起止端面（盖板）；其它二维体元或开放轮廓即使 `solid="true"` 也不封盖，只保留旋转侧面 |

子元素：恰好一个 `<s3dx:section>`（母线轮廓；其内可有多个二维体元，各自同时旋转）。整周旋转时侧面已经闭合，无需盖板。

```xml
<!-- 缺省取向：XY→XOZ；绕体 +Z 逆时针。偏移时改平移，勿改回单位旋转 -->
<s3dx:revolve solid="true" angle="270">
  <s3dx:section s3dx:transform="matrix(1 0 0 0 0 1 0 -1 0 0 0 0)">
    <path d="M 40 0 L 100 0 L 100 100 L 40 60 Z"/>
  </s3dx:section>
</s3dx:revolve>
```

##### `s3dx:loft`（放样体）

对齐 OCC `ThruSections` / SolidWorks Loft / 数学上的 blended surface：若干截面蒙皮（**无扫掠体路径**；截面已就位）。每位姿挂在各自 `<s3dx:section>` 上。

放样体**不需要**扫掠体意义上的「转角类型」：相邻截面之间没有中心线拐角，几何由截面位姿与截面间的**过渡 / 趋近律**决定。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `solid` | 否 | 布尔 | `true` | 是否封成实体 |
| `blend` | 否 | 枚举 | `linear` | 截面间变形的**趋近律**（见下） |

子元素：至少两个 `<s3dx:section>`，按文档顺序为截面序列。

**趋近律 `blend`（截面形状过渡）**

相邻两截面之间，位姿 / 中心沿参数 \(t \in [0,1]\) **匀速**推进；截面**轮廓形状**的插值权重为 \(s = f(t)\)，\(f(0)=0\)、\(f(1)=1\)。`blend` 只改形状何时变，不改截面中心走位：

| 值 | \(f(t)\) | 形态 |
|---|---|---|
| `linear` | \(t\) | 形状匀速变 |
| `sine` | \(\sin(\pi t / 2)\) | 前半仍像起始截面，后半加速变到终止 |
| `cosine` | \(\tfrac12 - \tfrac12\cos(\pi t)\) | 两端慢、中间快 |
| `tan` | \(\tan(\pi t / 4)\) | 前更慢、后更快 |
| `cotan` | \(1 - \tan(\pi (1-t) / 4)\) | 前更快、后更慢（`tan` 的镜像） |

约束与实现：

- 0.1 **须**支持上表五种；未知值回退 `linear` + 警告。
- 多截面时，趋近律作用于**每一对相邻截面**之间。
- 引导线 / 中心线约束的放样体（SolidWorks guide / centerline loft）不在 0.1 核心。

```xml
<s3dx:loft solid="true" blend="linear">
  <s3dx:section origin="0 0 0" normal="0 0 1">
    <path d="M -50 -50 L 50 -50 L 50 50 L -50 50 Z"/>
  </s3dx:section>
  <s3dx:section origin="0 0 100" normal="0 0 1">
    <circle cx="0" cy="0" r="40"/>
  </s3dx:section>
</s3dx:loft>
```

##### `s3dx:sweep`（扫掠体）

对齐 STEP `surface_curve_swept_area_solid`、IFC `IfcFixedReferenceSweptAreaSolid` / `IfcSurfaceCurveSweptAreaSolid`、SolidWorks Sweep、3ds Max Sweep、OCC `MakePipeShell`：一个截面沿路径运动生成实体。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `orient` | 否 | 枚举 | `frenet` | 截面姿态：`frenet`（沿路径平行搬运）\| `fixed`（IFC FixedReference：`refDir` 投影为截面局部 +X）\| `parallel`（`refDir` 投影为截面局部 +Y / “上”） |
| `refDir` | 条件 | 向量 | — | `orient=fixed` / `parallel` 的参考方向。宜取与路径切向夹角足够大的方向（弯道平面内的角平分线易与切向平行而奇异）；与切向平行时按上一帧平行搬运，并保持帧手性连续 |
| `solid` | 否 | 布尔 | `true` | 封闭截面是否生成实体 |
| `outerCorner` | 否 | 枚举 | `round` | **外角**（弯道凸侧）衔接类型（见下） |
| `innerCorner` | 否 | 枚举 | `round` | **内角**（弯道凹侧）衔接类型（见下） |
| `outerCornerRadius` | 条件 | 数字 | `50` | 外角为 `round` 时的圆角半径；缺省时由实现按邻边长度取合理默认并警告 |
| `innerCornerRadius` | 条件 | 数字 | `50` | 内角为 `round` 时的圆角半径；缺省同上 |
| `miterLimit` | 否 | 数字 | `4` | 斜接极限（见下）；须 `≥ 1`；任一侧为 `miter` 时生效 |

子元素：恰好一个 `<s3dx:section>`，以及**必需**的轨迹子元素 `<s3dx:path>`。截面二维轮廓在路径各帧的局部 \((u,v)\) 中解释（姿态由 `orient` 决定）。

**两层分工**

| 层 | 谁表达 | 含义 |
|---|---|---|
| **轨迹** | `<s3dx:path>` 的 `points` / `line` / `arc` | 中心线本身：折线走哪、曲线段怎么弯 |
| **转角衔接** | 外角 / 内角（及 `round` 时的半径） | 扫掠体在轨迹**折角顶点**处，**外侧面与内侧面**如何圆角 / 斜切 / 斜接；由属性在**求值时自动生成** |

`path` 里的 `arc` 是「这段轨迹就是圆弧」；外角/内角为 `round` 是「折线拐弯处，把扫掠体对应侧面衔接成圆角」。前者属于路径定义，后者属于扫掠体构造。

**外角与内角（对齐常见 CAD / SVG `stroke-linejoin` / Blender Bevel 的 outer·inner）**

折角处扫掠体同时有**外角**（凸侧，弯道外侧）与**内角**（凹侧，弯道内侧）。两侧常常需要不同状态（例如外侧斜接、内侧斜切），故分开表达：

| 属性 | 作用侧 |
|---|---|
| `outerCorner` (+ `outerCornerRadius`) | 外角（凸侧） |
| `innerCorner` (+ `innerCornerRadius`) | 内角（凹侧） |

解析（每侧独立；缺省为 `round`）：

```
outer = outerCorner ?? "round"
inner = innerCorner ?? "round"
outerR = outerCornerRadius
innerR = innerCornerRadius
```

对轨迹上切向不连续的内顶点，由实现按解析后的外角 / 内角生成衔接；转角类型写在外角 / 内角属性上，`path` 子段只描述轨迹几何。枚举对齐 SVG/CSS `stroke-linejoin` 的三种主流转角（标识符亦同）：

| 值 | 中文 | 生成结果 | 说明 |
|---|---|---|---|
| `round` | 圆角 | 圆弧衔接 | **默认**；与邻边相切的圆角，半径取该侧 `*CornerRadius` |
| `bevel` | 斜切 | 斜切补面 | 保持折点；该侧用斜切面衔接，折点处截面半宽保持 |
| `miter` | 斜接 | 尖角斜接 | 保持折点；该侧按壁面交线斜接（折点处截面可能变宽）；比值超过 `miterLimit` 时按斜切衔接 |

**斜接极限 `miterLimit`（默认 4）**

对齐 SVG/CSS [`stroke-miterlimit`](https://www.w3.org/TR/SVG11/painting.html#StrokeMiterlimitProperty)（默认亦为 **4**）。定义：斜接尖端相对路径中心的伸出长度，与该剖面顶点相对中心的半宽之比。平面折角时与路径转角 \(\theta\) 的关系为：

\[
\frac{\text{miterExtent}}{\text{halfWidth}} \approx \frac{1}{\sin(\theta/2)}
\]

当该比值 \(\le\) `miterLimit` 时保持斜接；否则该顶点按斜切衔接。默认 `4` 对应约 \(\theta \gtrsim 29°\) 仍保持斜接（更尖的弯转为斜切）。取值范围 `miterLimit ≥ 1`；小于 `1` 时按 `1`。参考：Canvas / PDF / PostScript 默认常为 **10**（约 \(\theta \gtrsim 11.5°\) 仍保持斜接）；本格式与 SVG 一致，取 **4**。

路径整形与剖面衔接：

- 当解析后 **外角 = 内角 = `round`**：在中心线上做圆角（两侧同型时的常见写法）；中心线半径优先 `outerR`，否则 `innerR` / 实现默认。
- 当两侧类型**不同**，或任一侧为 `bevel` / `miter`：保持轨迹折点；对截面环上落在外 / 内侧的顶点分别按该侧类型衔接。单侧为 `round` 时，实现宜在该侧生成圆角补面；若不支持单侧圆角，可按 `bevel` 衔接并警告。
- 仅对偏转角达到实现阈值的折点生成转角衔接。
- 当半径超过邻边可用长度时，实现缩小到可放得下的值，并警告。
- 轨迹段本身已是光滑曲线（例如 path 子段 `arc` 内部采样点）时切向连续，保持光滑；转角衔接仅作用于切向不连续的折角顶点。
- `orient` 控制截面朝向，与转角衔接正交、彼此独立。

```xml
<!-- 两侧同型 round -->
<s3dx:sweep orient="frenet" solid="true"
            outerCorner="round" innerCorner="round"
            outerCornerRadius="50" innerCornerRadius="50">
  <s3dx:section>
    <path d="M -20 -10 L 20 -10 L 20 10 L -20 10 Z"/>
  </s3dx:section>
  <s3dx:path form="polyline" points="0 0 0  100 0 0  100 0 100"/>
</s3dx:sweep>

<!-- 外角斜接、内角斜切（两侧不同状态） -->
<s3dx:sweep orient="frenet" solid="true" outerCorner="miter" innerCorner="bevel">
  <s3dx:section>
    <path d="M -20 -10 L 20 -10 L 20 10 L -20 10 Z"/>
  </s3dx:section>
  <s3dx:path form="polyline" points="0 0 0  100 0 0  100 0 100"/>
</s3dx:sweep>
```

约束：

- 折线路径至少两段（≥3 点）；转角按外角 / 内角处理；实现宜生成无自交几何，若无法保证无自交则发出警告。
- 当 `orient` 超出当前内核能力时：按 `frenet` 求值并警告。
- 0.1 核心覆盖单截面扫掠；多截面沿路径变化（SolidWorks 引导线 / IFC SectionedSolid）可用 `loft` 近似，或留待后续扩展。

##### `s3dx:pipe`（圆盘扫掠 / 圆管）

对齐 STEP `swept_disk_solid` / IFC `IfcSweptDiskSolid`：圆形（可空心）截面沿三维路径扫掠。管道、线缆、弯管段的通用表达；比一般 `sweep` 更贴近交换标准。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `form` | 否 | 枚举 | 见推断 | 轨迹形式：`inline`（父上 `path` 点列）或 `child`（子元素 `<s3dx:path>`） |
| `radius` | 是 | 数字 | `20` | 外半径（≡ STEP `radius`） |
| `innerRadius` | 否 | 数字 | — | 内半径；缺省为实心；推荐示例 `16`（须 `0 < innerRadius < radius`） |
| `path` | 条件 | 点列 | — | **`inline`**：中心线折线点列 |
| `outerCorner` / `innerCorner` | 否 | 枚举 | `round` | 外角 / 内角面衔接，同 `sweep` |
| `outerCornerRadius` / `innerCornerRadius` | 条件 | 数字 | `50` | 同 `sweep` |
| `miterLimit` | 否 | 数字 | `4` | 同 `sweep` |

子元素：**`form="child"`** 时须有 `<s3dx:path>`（折线或 `line`/`arc` 段）。轨迹 `form`：`inline` 与 `child` 互斥（须具其一）；缺省推断：有 `<s3dx:path>` 子元素 → `child`；否则有 `path` 属性 → `inline`。优化应移除与 `form` 不符的一侧。

```xml
<s3dx:pipe form="child" radius="20" innerRadius="16"
           outerCorner="round" innerCorner="round"
           outerCornerRadius="50" innerCornerRadius="50">
  <s3dx:path form="polyline" points="0 0 0  100 0 0  100 0 100"/>
</s3dx:pipe>
```

语义上等价于 `sweep` + 圆形 `<s3dx:section>`（及空心时的内侧圆），但实现应优先按 swept-disk 算法求值（截面始终垂直于路径切向）。轨迹与外角 / 内角转角衔接的分工与 `sweep` 相同。

#### 3.2.6 外部三角资产（`s3dx:gltf`）

##### `s3dx:gltf`（引用 glTF 2.0 资产）

svg3dx 文档以**参数化组装配方**自描述：构造算子、参数、条件、布尔与位姿。三角网格经 `s3dx:gltf` 引用外部 glTF/GLB 资产（保持 glTF 原格式）——与 SVG `<image href>` / CSS `url()` 同类的外部资源模型。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `href` | 是 | IRI | — | 指向 glTF 2.0 资源（`.glb` 或 `.gltf`）。相对引用相对**文档基 URL**解析。不得为仅片段 `#id`（那是 `s3dx:use` 语义）。本草案不得使用 `data:` URI |

约束与解析：

- **写作推荐**：相对路径，与文档处于同一交付树（同目录或如 `assets/…` 的子目录）。
- **绝对 / 远端** `https://…` IRI 语法上允许；宿主是否拉取（CORS、离线、沙箱）由宿主决定。核心合规要求：相对同树引用须能按文档基解析并加载。
- **必选媒体**：`.glb`。实现**宜**同时支持 `.gltf` 及其相对该 `.gltf` URL 引用的 buffer/贴图（遵循 glTF 自身规则）。
- 加载失败（缺失、CORS、损坏）→ 跳过该 `s3dx:gltf` 实例 + 警告。
- 本草案**不**将 glTF 字节嵌入 XML。

```xml
<s3dx:gltf href="assets/bunny.glb"/>
```

**轴向转换（强制）。** glTF 2.0 为 Y-up；svg3dx 为 Z-up（§1.4）。实现必须将引用资产按 glTF Y-up 解释，并在 `s3dx:gltf` 实例根上**恰好一次**施加下列基变换 \(C\)，且**先于**元素自身的 `s3dx:transform`（不得把 \(C\) 写入作者的 `s3dx:transform`）：

\[
(x,y,z)_{\mathrm{glTF}} \mapsto (x,\ -z,\ y)_{\mathrm{svg3dx}}
\]

列主序 4×4（与常见 GPU / Three.js `Matrix4` 布局一致）：

```
1  0  0  0
0  0 -1  0
0  1  0  0
0  0  0  1
```

世界合成：

\[
M_{\mathrm{world}} = M_{\mathrm{parents}} \cdot M_{\mathrm{element}} \cdot C \cdot M_{\mathrm{gltfLocal}}
\]

作者变换一律在 **\(C\) 之后的 svg3dx 空间**中解释（`s3dx:transform` 为单位阵时，资产立于 XY、高度沿 +Z）。

**外观。** 着色以 glTF 资产自带材质为主。若存在元素 `fill` / `material`（§8），宿主可将二者乘入 base color；无法合成时须保留 glTF 材质，并可警告。

**与条件组装。** 当同一逻辑产品对应多套非等比面片变体（如不同 LOD / 规格网格）时，宜将 `gltf` 与 `s3dx:if` / `s3dx:if-not` 组合：

```xml
<s3dx:if test="var(--LOD) = 0">
  <s3dx:gltf href="assets/bunny-lod0.glb"/>
</s3dx:if>
<s3dx:if test="var(--LOD) = 1">
  <s3dx:gltf href="assets/bunny.glb"/>
</s3dx:if>
```

#### 3.2.7 核心层总览速查

| 图元 | 必选 | 可选 / 子元素 |
|---|---|---|
| `point` | — | id（被 ref 时必选）, at |
| `box` | length, width, height | lengthVec, widthVec |
| `cylinder` | diameter, bottomCenterPt, topCenterPt | — |
| `sphere` | radius, center | — |
| `cone` | bottomDiameter, topDiameter, bottomCenterPt, topCenterPt | — |
| `torus` | diameter1, diameter2, torusCenterPt, normal | angle |
| `wedge` | length, width, height | lengthVec, widthVec, topLength |
| `pyramid` | length, width, height | lengthVec, widthVec, topLength, topWidth |
| `prism` | points, height | normal |
| `sector-cylinder` | diameter, bottomCenterPt, topCenterPt | angle |
| `line` | to | from |
| `arc` | center, normal | form=`angles`\|`ends`；angles：radius, xDir, startAngle, angle；ends：from, to（可选 radius） |
| `path` | form 决定一侧 | form=`polyline`（points）\|`segments`（子：`line` / `arc`） |
| `extrude` | length | origin, normal, xDir, dir；恰好 1 × `<s3dx:section>` |
| `revolve` | — | angle, solid；恰好 1 × `<s3dx:section>`（平面须 ∥ 体 +Z；位姿/偏移在 section；绕体 +Z 逆时针） |
| `loft` | — | solid, blend；≥2 × `<s3dx:section>`（各位姿自带；无扫掠体转角） |
| `sweep` | — | orient, refDir, solid, outerCorner, innerCorner, outerCornerRadius, innerCornerRadius, miterLimit；1 × `<s3dx:section>` + 1 × `<s3dx:path>` |
| `pipe` | radius + 轨迹 | form=`inline`\|`child`；innerRadius, outerCorner, innerCorner, outerCornerRadius, innerCornerRadius, miterLimit；path / `<s3dx:path>` |
| `gltf` | href | （drawable：fill、material、opacity、s3dx:transform） |

#### 3.2.8 参考来源（非规范性）

- STEP ISO 10303-42：`composite_curve`、`trimmed_curve`、`circle`、`extruded/revolved/surface_curve_swept_area_solid`、`swept_disk_solid`、CSG 基本体。
- IFC：`IfcCompositeCurve`、`IfcIndexedPolyCurve`、`IfcTrimmedCurve`、`IfcExtrudedAreaSolid`、`IfcRevolvedAreaSolid`、`IfcSweptDiskSolid`、`IfcFixedReferenceSweptAreaSolid`、`IfcCsgPrimitive3D`、`IfcTriangulatedFaceSet`。
- SolidWorks：Extrude / Revolve / Sweep / Loft。
- PDMS / AVEVA E3D：BOX、CYLI、CONE、PYRA、CTOR、EXTR、REVO 等设备图元。
- AutoCAD / OCC：实体图元与 `MakePrism` / `MakeRevol` / `MakePipeShell` / `ThruSections`；曲线 `Edge` / `Wire`。
- Blender / 3ds Max：Extrude、Spin、Curve Bevel / Sweep 修改器；三角资产经 glTF/GLB。
- 三角资产：glTF 2.0（由 `s3dx:gltf` 引用），对齐 SVG 外部资源引用。

### 3.3 glTF 补充说明

- 求值产出带已解析 `href`（以及样式 / 变换）的 `gltf` 图元指令。加载与解码资产属**宿主 / 渲染阶段**；核心求值器不对 glTF 做网格解码。
- 布尔操作数可以是 `gltf`（若内核支持对已加载三角做网格布尔）；不支持时跳过 + 警告。
- 非等比面片产品族的推荐写法：`s3dx:if` + 多个 `s3dx:gltf` href（见 §3.2.5）。
- **包格式 `.svg3dxz`**：ZIP（store / deflate）。包根必须含入口文件 **`main.svg3dx`**（XML 配方）；旁路资源（如 `.glb` / `.gltf`）与入口同包存放。相对 `href` 相对包根（即相对 `main.svg3dx`）解析。实现库应提供**字节级**打开 / 写出包的能力（`&[u8]` ↔ `{ main.svg3dx 文本, 旁路路径→字节 }`）；宿主负责获取与保存这些字节。glTF 网格解码仍属渲染宿主。单文件 `.svg3dx` 仍合法。

### 3.4 三维变换（`s3dx:transform`）

- 三维变换写在命名空间属性 **`s3dx:transform`** 上，**不**使用 SVG 标准属性 `transform`。这样二维 6 数 `transform` 与三维 12 数矩阵互不抢占同一属性名。
- 值支持两种**持久化形态**，由属性值的写法区分；求值后均得到同一 12 数仿射矩阵（3×3 线性 + 平移）：

  1. **矩阵形态**：

     `matrix(a b c  d e f  g h i  tx ty tz)`

     前 9 个为 3×3 线性变换（列向量：`(a,b,c)` / `(d,e,f)` / `(g,h,i)` 为 X/Y/Z 轴方向），后 3 个为平移。

  2. **TRS 形态**（平移 / 旋转 / 缩放）：

     `translate(tx ty tz) rotate(rx ry rz) scale(sx sy sz)`

     - 各函数可省略；缺省为 `translate(0 0 0)`、`rotate(0 0 0)`、`scale(1 1 1)`。允许只写子集（如仅 `translate(...)`）。
     - 函数按**名称**识别，不依赖书写顺序；文档与示例建议顺序为 `translate` → `rotate` → `scale`。
     - **旋转**：`rotate(rx ry rz)` 的角度单位为**度**。列向量下 `R = Rz · Ry · Rx`：先绕固定 X 轴转 `rx`，再绕固定 Y 轴转 `ry`，最后绕固定 Z 轴转 `rz`，即 `p' = Rz Ry Rx p`。这与 Three.js 欧拉顺序 `XYZ` 相同。
     - **合成（列向量）**：`M = T · R · S`（先缩放，再按上式旋转，再平移），与常见 3D 对象局部矩阵及变换手柄语义一致。
     - 不得与 `matrix(...)` **混写**于同一属性值；若混写，实现应警告并按**首个可识别形态**尝试解析，失败则视为单位变换。

- **数的分隔**：规范写法为**空格分隔**（可含换行），与本格式点列 / 向量（如 `lengthVec="1 0 0"`）及 SVG 数字列表习惯一致，也便于 `var(--loop-value)` 这类向量直接嵌入分量。实现可将逗号视为与空格等价的可选分隔符（对齐 SVG `comma-wsp`），但文档与示例应写空格形式。
- 示例：
  - `s3dx:transform="matrix(1 0 0 0 1 0 0 0 1 100 200 300)"`
  - `s3dx:transform="translate(100 200 300) rotate(0 45 0) scale(1 1 1)"`
  - `s3dx:transform="rotate(90 90 0)"` 等于 `matrix(0 0 -1 1 0 0 0 -1 0 0 0 0)`；局部 `+X (1 0 0)` 落到 `(0 0 -1)`。
  - `s3dx:transform="translate(var(--x) 0 calc(var(--h) / 2))"`
- 值中允许 `var(--*)` / `calc(...)`（由 svg3dx 求值器解析）；可落在矩阵各分量或 TRS 各函数分量上。
- 两种形态均为合法的持久化写法，求值结果等价。同一仿射变换用另一种形态表示时，不保证唯一或无损（剪切分量、欧拉角不唯一、表达式结构、浮点精度等）。
- 适用范围：三维相关的 SVG 宿主元素（如 `<g>`）以及 `s3dx:*` 元素（含 `<s3dx:use>`、`<s3dx:model>`、循环/布尔容器上的图元等）。
- 标准 SVG 属性 `transform`（无前缀）始终按 **SVG / CSS 二维**语义解释（通常为 6 数 `matrix` 等），**不**承载本格式的三维变换。
- 标准 SVG/CSS 的 `matrix()` 为 6 参数、`matrix3d()` 为 16 参数；本格式 `s3dx:transform` 上的 12 数 `matrix(...)` 与 TRS 函数列表均为 **svg3dx 扩展**，由本格式求值，不要求浏览器原生支持。
- 累积顺序：组内 `s3dx:transform` → 实例化 `s3dx:transform` → 父级 `s3dx:transform`。

## 4. 组合与布尔

### 4.1 `<g>` 的角色

- `<g>` 承担分组、命名（`id`）、参数作用域（`class` / `style`）与 `s3dx:transform`。不承载条件判断，不承载布尔运算。
- 子元素按文档顺序正常累积（等同并集），不改变几何累积语义。

### 4.2 布尔元素

- `s3dx:bool-union`：内部子元素全部并集。
- `s3dx:bool-subtract`：第一个子元素为被减数，后续依次减去。
- `s3dx:bool-intersect`：内部子元素全部求交。
- 内部子元素按文档顺序求值，作用域封闭在元素内部，不与父级已累积结果交互。
- 允许嵌套：内层先求值，结果作为外层一个操作数。
- 空元素：整个元素跳过，不产生几何，不报错。
- 单子元素：该子元素原样输出，不执行布尔运算。
- 操作数可以是 `<s3dx:use>`，布尔作用于其引用的几何体集合，而非元素本身。
- `<s3dx:point>` 不得作为布尔实体操作数；若出现则跳过该操作数并警告。

## 5. 条件逻辑

### 5.1 元素

条件是独立的控制流元素，与布尔、循环同属结构表达：

- `<s3dx:if test="条件">`：条件为真时子树参与求值，为假时整个子树跳过。
- `<s3dx:if-not test="条件">`：条件为假时子树参与，为真时跳过。

### 5.2 规则

- 属性 `test` 必选；值支持表达式（见 2.6）。
- 可出现在 `<g>`、`<defs>`、`<s3dx:model>`、`<s3dx:loop-*>`、`<s3dx:bool-*>`、以及嵌套的 `s3dx:if` / `s3dx:if-not` 内。
- 允许的子元素与 `<g>` 在三维求值中相同：图元、`<s3dx:use>`、嵌套的 `if` / `if-not` / `loop-*` / `bool-*`、以及内层 `<g>`。
- 作为三维组装容器，可选携带 `s3dx:transform`（求值时作用于子树，与 `<g>` / `loop-*` / `bool-*` 相同）；不承担命名分组职责（可复用的命名组仍用带 `id` 的 `<g>`）。
- 条件求值失败（未定义参数、语法错误、类型不匹配）：视为假 + 警告。
- 不支持 `else`；互斥分支用一对 `s3dx:if` + `s3dx:if-not`（同一 `test`）表达。
- 不在标准 SVG 元素上挂 `if` / `ifnot` 属性；旧写法不属于本草案合规文档。

## 6. 循环展开

### 6.1 分工

- `<g>` 负责命名分组与参数作用域；`<s3dx:if>` / `<s3dx:if-not>` 负责条件；`<s3dx:loop-*>` 负责重复展开。
- 循环元素必须位于 `<g>`、`<defs>`、`<s3dx:model>`、条件元素或布尔元素内。
- 允许直接写图元、`<s3dx:use>`、嵌套 `loop-*` / `bool-*` / `if` / `if-not` 作为子元素。

### 6.2 `s3dx:loop-points`

- 属性 `points`：3 的倍数个数字，每三个构成一个三维点，按点序列逐次迭代。
- 每次迭代注入（合法 `<dashed-ident>`）：
  - `--loop-index`：从 0 起的整数
  - `--loop-value`：当前三维点（三个数字，空格分隔）
  - `--loop-value-x` / `--loop-value-y` / `--loop-value-z`：分量标量

### 6.3 `s3dx:loop-range`

- 属性 `start`、`end`、`step`（可选，默认 1），支持字面量 / `var(--*)` / `calc(...)`，求值为数字。
- 按数值序列迭代，含 `start`，不含 `end`。
- 每次迭代注入：
  - `--loop-index`：从 0 起的整数
  - `--loop-value`：当前数值（标量）

### 6.4 通用规则

- 迭代变量名固定为上述 dashed-ident，不支持自定义迭代变量名。
- 嵌套循环：内层同名变量遮蔽外层，最近一层优先。
- 展开时机：参数求值之后、条件求值之前。
- 作为三维组装容器，可选携带 `s3dx:transform`；求值时作用于每一次迭代的子树。
- 未知 `s3dx:loop-*` 元素：按未知元素跳过整个子树，不报错。
- 可扩展性：`loop-*` 是开放命名空间，后续版本可增加新模式，实现遇到不认识的 `loop-*` 应跳过而非报错。
- 展开后的多个副本，在布尔累积中按文档顺序独立参与。

## 7. 模型与显示

### 7.1 `<s3dx:model>`

- 属性：`id`（必选）、`mode`（必选）、`s3dx:transform`（可选，12 数三维矩阵）、`active`（可选，布尔）。
- `mode` 取值：`solid`（着色实体）、`wireframe`（线框）、`hidden-line`（隐藏线）。【待定】是否需要 `points` 等。
- 子元素：一个或多个 `<s3dx:use>`，按文档顺序指定显示内容。
- 不设 `visible` 属性；显示范围完全由子 `<s3dx:use>` 决定。
- 语义：定义一种显示配置，不定义相机或投影。
- 同一 `<g>` 可被多个模型引用，几何只求值一次，渲染按模型配置分别进行。

### 7.2 多模型切换

- 文件可定义多个 `<s3dx:model>`。
- 默认生效模型：`active="true"` 标记者；若无标记，取文档中第一个 `<s3dx:model>`。
- 外部参数可覆盖（如传入 `model=wireframe-view`，按 `id` 匹配切换）。

### 7.3 与标准 `<view>` 的关系

- 标准 SVG `<view>` 与 `<s3dx:model>` 语义独立，不得互相替代。标准 `<view>` 用于画布视口覆盖，`<s3dx:model>` 用于三维渲染模式。

## 8. 材质与着色

材质属**渲染阶段**语义（与 `<s3dx:model mode>` 同层），不参与几何求值。三维最终色为图元色与材质色的**分量乘算**（sRGB）；与 `gltf` 资产合成时，可选再乘 glTF 顶点色 / base color（§3.2.5）。

### 8.1 `<s3dx:materials>` / `<s3dx:material>`

```xml
<s3dx:materials>
  <s3dx:material id="tank-paint"
                 color="0.2 0.45 0.85 1"
                 metalness="0"
                 roughness="0.55"/>
  <s3dx:material id="frosted-glass"
                 color="0.90 0.95 1.0 0.25"
                 metalness="0"
                 roughness="0.05"/>
</s3dx:materials>
```

- `<s3dx:materials>`：根 `<svg>` 的直接子元素；**仅**允许子元素 `<s3dx:material>`；不参与几何求值、布尔、循环。
- 文档可含多个 `<s3dx:materials>`，按文档顺序合并；重复 `id`：警告，后者覆盖前者。
- `<s3dx:material>`：`id` 必选（文档内唯一，合并后亦然）。属性：
  - `color`：RGBA，建议分量 ∈ [0,1]（sRGB）；写 3 个数时 A 视为 `1`。不设独立 `opacity`。
  - `metalness`：默认 `0`。
  - `roughness`：默认 `0.5`。
- 本草案不含贴图（baseColorTexture 等留待后续）。

### 8.2 图元色 `fill`

- 三维着色使用 SVG **`fill`**（表现属性或 CSS）。取值可以是空格分隔的 RGBA 数列（与材质 `color` 同形；3 个数时 A=1），也可以是 SVG 颜色（`#RGB`、`#RRGGBB`、`#RRGGBBAA`、`rgb()`、`rgba()`）。无法解析时回退缺省色并警告。
- 同元素：CSS `fill`（类规则或内联 `style`）高于表现属性 `fill`。
- 未声明 `fill` 时，三维缺省色为 `0.53 0.67 0.80 1`。
- 若另有标准 SVG `opacity`，与 `fill` 的 A **再乘**。

### 8.3 材质引用

材质引用与 SVG 涂色属性（`fill` / `stroke`）使用同一套形式：裸名称只表示内置关键词，文档中的定义只通过 `url(#id)` 引用。

- 表现属性只有两种取值：
  - 内置关键词：`material="steel"`、`material="glass"`。
  - 文档材质：`material="url(#tank-paint)"`。
- `#id` 不是材质引用。`material="#glass"` 无效；`#id` 只用于 `href` 一类片段引用，不用于涂色值。
- CSS 自定义属性同形：`--material: steel;` / `--material: url(#tank-paint);`。
- 适用范围：三维相关宿主（如 `<g>`）与 `s3dx:*` 图元/容器（含布尔、条件、循环容器）。
- 同元素：CSS `--material` 高于 `material` 属性；都未声明 → 内置 **`default`**。
- 解析：
  1. `url(#id)` → 文档材质库。找不到该 id → 回退 `default` 并警告。
  2. 裸名称 → 只查内置关键词。命中则用该预设；未命中 → 回退 `default` 并警告。裸名称不查找文档材质 `id`，因此 `material="tank-paint"` 不会选中 `id="tank-paint"` 的文档材质。
- 文档材质 `id` 与内置关键词同名时：裸名称仍指内置；要文档定义必须写 `url(#id)`。例如文档中有 `id="glass"` 时，`material="glass"` 是内置玻璃，`material="url(#glass)"` 是该文档材质。

### 8.4 合成

```
outRGB = fill.rgb * material.color.rgb
outA   = fill.a   * material.color.a   [* opacity 若有]
```

对 `s3dx:gltf`，外观以资产自带 PBR 材质为主；若宿主应用元素 `fill` / `material`，则对 base color（及存在的顶点色）再 `out *= fill × material`。半透明深度合成由宿主决定。

布尔运算结果使用**布尔容器**自身解析到的 `fill` / `material`；子操作数各自外观不保留到结果上。

曲线：主要使用合成后的 RGB；实现可忽略 metalness / roughness。

### 8.5 内置预设（参考外观）

全部为 metallic-roughness。`default` 为中性乘子，不改变图元 `fill`。  
「关键词」为文件中保存的值；「中文名」为官方显示名（中文 UI / 文档）：

| 关键词 | 中文名 | color (RGBA) | metalness | roughness |
|---|---|---|---|---|
| `default` | 默认 | `1 1 1 1` | 0 | 0.6 |
| `steel` | 钢 | `0.56 0.57 0.58 1` | 1 | 0.35 |
| `stainless` | 不锈钢 | `0.70 0.70 0.72 1` | 1 | 0.25 |
| `aluminum` | 铝 | `0.91 0.92 0.92 1` | 1 | 0.30 |
| `copper` | 铜 | `0.95 0.64 0.54 1` | 1 | 0.35 |
| `brass` | 黄铜 | `0.88 0.78 0.45 1` | 1 | 0.30 |
| `plastic` | 塑料 | `0.85 0.85 0.85 1` | 0 | 0.45 |
| `rubber` | 橡胶 | `0.15 0.15 0.15 1` | 0 | 0.85 |
| `concrete` | 混凝土 | `0.55 0.55 0.52 1` | 0 | 0.90 |
| `glass` | 玻璃 | `0.90 0.95 1.0 0.25` | 0 | 0.05 |
| `wood` | 木材 | `0.55 0.35 0.18 1` | 0 | 0.75 |

## 9. 元数据（遵循 SVG）

应用与厂商描述信息使用标准 SVG [`<metadata>`](https://www.w3.org/TR/SVG11/metadata.html) 承载，写法与二维 SVG 一致。实现须按下列规则处理。

### 9.1 容器与载荷

- **容器**：在 SVG 命名空间书写 `<metadata>`。
- **载荷**：在 `<metadata>` 内书写其它 XML 命名空间的元素，用以表达厂商或领域属性表。属性表的字段名、类型、必选性与版本由该命名空间 URI 所对应的规范定义；本核心规范负责容器、关联与保留语义。
- **实现义务**：解析后须在 DOM 中保留每个 `<metadata>` 及其全部外国命名空间子树；官方往返与 optimize 须保留这些节点。几何求值、布尔与循环展开仅处理本规范定义的几何语义（见第 12 节）；宿主与领域工具可直接读取保留的元数据子树。
- **与材质的分工**：`<s3dx:materials>` / `material` 用于三维**渲染**着色；`<metadata>` 用于对象**描述**信息。两者可同时出现在同一文档中，各司其职。

### 9.2 关联方式

作者按 SVG 下列方式之一（或组合）建立元数据与对象的关联：

| 方式 | 用法 |
|---|---|
| 子元素（主路径） | 将 `<metadata>` 写为宿主（如 `<g>`）的子节点；关联关系为 DOM 父子。建议每个宿主一个 `<metadata>`，并放在子节点靠前位置（与 SVG 建议一致）。 |
| 文档级 | 将 `<metadata>` 写在根 `<svg>` 下，描述整份文档（例如声明本文件采用的厂商剖面）。 |
| 非就地 / 库式 | 将 `<metadata>` 放在文档其它位置；载荷内用 RDF `about="#元素id"`（或该外挂命名空间规定的同等指向）引用带 `id` 的图形元素。 |

### 9.3 厂商属性表与注册表

- **引入属性表**：在根 `<svg>` 上声明 `xmlns:前缀="命名空间URI"`。可在文档级 `<metadata>` 中书写该命名空间约定的剖面声明元素（例如属性表文档路径、产品系列）。
- **属性表存放**：厂商属性表以**可机读 XML 定义**放在 [`namespaces/`](../namespaces/) 下：目录名为厂商标识（如 `acme/`），文件名建议 `厂商.主题.版本.xml`（如 `acme.equipment.1.0.xml`）。定义文件声明该命名空间下的元素与属性（如 `acme:nozzle`、`tag`、`nominalSize`），供实现校验与宿主解析。
- **注册表（索引）**：[`namespaces/registry.xml`](../namespaces/registry.xml) 按 `namespace` URI 索引 `vendor`、`status`、`spec`（相对 `namespaces/` 的定义文件路径）、`prefix`、`title` 等，供发现与对接点名。
- **核心实现**：几何求值须完整保留上述外挂节点；对外国命名空间元素按不透明子树处理即可。若某宿主需解释某一 URI 的字段语义，须按注册表所指向的属性表定义校验与读取元素/属性。

### 9.4 示例

壳体圆柱 + 侧面管嘴、就地 `<metadata>` 与厂商命名空间的完整示例：[draft-0.1-metadata-oem-nozzle.svg3dx](../samples/draft-0.1-metadata-oem-nozzle.svg3dx)。

## 10. 动画（SMIL 形子集）

本格式提供对齐 SVG SMIL 常用写法的**薄子集**，用于机构演示、参数扫描与产品展示。元素落在 `s3dx` 命名空间；**不要求**浏览器对 `s3dx:*` 运行原生 SMIL。标准无前缀 SVG `<animate>` / `<animateTransform>` **不**承载本格式的三维动画语义。

本子集能力：

- **参数时间轴**：`<s3dx:animate>` 驱动 CSS 自定义属性（间接带动尺寸与条件等）。
- **变换动画**：`<s3dx:animateTransform>` 驱动节点三维位姿（合成到 `s3dx:transform`）。

本子集**不**包含：`animateMotion`、事件型 `begin`、`values` / `keyTimes` 多段关键帧、以及对图元几何属性（如 `length`、`diameter`）的直接动画。几何尺寸须通过 `var(--*)` 由参数动画间接驱动。

### 10.1 共用时间属性

下列无前缀属性适用于 `<s3dx:animate>` 与 `<s3dx:animateTransform>`：

| 属性 | 必选 | 默认 | 说明 |
|---|---|---|---|
| `from` | 是 | — | 动画起始值 |
| `to` | 是 | — | 动画终止值 |
| `dur` | 是 | — | 单次时长：`Ns` 或 `Nms`（`N` 为正数）；其它写法警告并忽略该动画 |
| `repeat` | 否 | `1` | 非负整数：播放次数；`0` 表示无限循环；其它写法警告并按 `1` |
| `fill` | 否 | `remove` | **结束后行为**（与图元着色 `fill` 同名异义）：`freeze` 保持终止值；`remove` 取消采样覆盖、回退到声明值 |
| `begin` | 否 | `0s` | 相对文档动画时钟零点的偏移，写法同 `dur`；**不**支持事件同步 |
| `calcMode` | 否 | `linear` | 插值**趋近律**，取值与 loft `blend` 相同：`linear` / `sine` / `cosine` / `tan` / `cotan`（见 §3.2）；未知值警告并按 `linear` |

插值：在有效区间内先得归一化时间 \(t \in [0,1]\)，再以 \(s = f_{\mathrm{calcMode}}(t)\) 对 `from`→`to` 做标量或分量插值（\(f\) 同 loft `blend`）。时钟源与播放控制由宿主决定。

### 10.2 `<s3dx:animate>`（参数时间轴）

- **唯一目标**：CSS 自定义属性（`<dashed-ident>`）。
- **属性**：
  - `attributeName`（必选）：须为带前导 `--` 的名字（如 `--H`、`--yaw`）；省略 `--` 视为错误，警告并忽略。
  - `from` / `to`：标量数字（按 §2.4 解析）；其它时间属性见 10.1。
- **挂载（强制）**：必须是**参数作用域宿主**的**直接子元素**；**父节点即注入点**。本子集**不设** `href` / 远端目标。
  - 挂在根 `<svg>` 下：覆盖文档根作用域（与 `:root` 声明对应）。
  - 挂在声明了该自定义属性的 `<g>`（类规则或内联 `style`）下：覆盖仅对该 `<g>` 子树求值可见（§2.3）。
  - 父级不是作用域宿主、或挂在图元上却指望改文档全局参数：警告并忽略该动画。
- **白名单**：`attributeName` 必须在父级作用域已有**直接字面量**声明——根 `<svg>` 上对应 `:root` 中的直接量（对齐 §2.5）；`<g>` 上对应该节点类规则或内联已声明的 `--名字`。未声明：警告并忽略。
- **优先级**：动画采样覆盖低于**显式**外部传参、高于 DOM 声明（见 §2.3、§2.5）。若参数栏仅展示 `:root` 默认值且未钉住，不得阻挡本动画。
- **宿主效果**：按时钟采样写入参数覆盖后，须**触发完整几何求值**（参数扫描 / 尺寸联动）。
- **参数栏建议**：对正在由本元素驱动的属性，显示当前采样值并标注由动画驱动；用户编辑即视为钉住外部覆盖（可撤销）。

### 10.3 `<s3dx:animateTransform>`（变换动画）

- 作为**被变换节点**的直接子元素；该节点须可承载 `s3dx:transform`（三维相关的 `<g>`，或 `s3dx:*` 组装/图元容器）。
- **属性**：
  - `attributeName`：固定为 `transform`（SMIL 习惯写法）；语义指向 **`s3dx:transform`**，不是 SVG 二维 `transform`。缺省时按 `transform` 处理；其它值警告并忽略该动画。
  - `type`（必选）：`translate` | `rotate` | `scale`。
  - `from` / `to`：三数（空格分隔），与 §3.4 TRS 对应分量一致（`rotate` 单位为度）。
  - 其它时间属性见 10.1。
- **合成**：在时刻 \(t\)，宿主由 `type`/`from`/`to` 得到动画矩阵 \(M_\mathrm{anim}(t)\)，与该节点**已求值**的作者 `s3dx:transform` 基矩阵 \(M_\mathrm{base}\) 合成为 \(M = M_\mathrm{anim}\cdot M_\mathrm{base}\)（先作者变换，再动画；列向量约定与 §3.4 一致）。**不**改写 DOM 中的 `s3dx:transform` 字符串。
- **宿主效果**：只更新场景实例矩阵；**不得**仅为变换动画强制重跑几何内核。

### 10.4 与静态求值、未实现时钟的宿主

- `<s3dx:animate>` / `<s3dx:animateTransform>` **不参与**几何操作图、布尔、循环展开；解析后须保留在 DOM（官方往返与 optimize 原样保留）。
- 未实现动画时钟的宿主：忽略动画元素，按静态文档求值；**不**自动应用 `from`。若需静态预览姿态，作者须把静止值写进参数声明或 `s3dx:transform`。

```xml
<svg svg3d="true" xmlns="http://www.w3.org/2000/svg"
     xmlns:s3dx="urn:s3dx:draft:0.2">
  <style>:root { --H: 100; }</style>
  <s3dx:animate attributeName="--H" from="80" to="160"
                dur="2s" repeat="0"/>
  <!-- … -->
</svg>
```

## 11. `<s3dx:use>`

- 属性：`href`（必选，引用定义目标的 `id`）、`s3dx:transform`（可选，12 数三维矩阵）。
- 不设 `x`/`y`；三维平移用 `s3dx:transform` 的 `tx/ty/tz`。
- 仅用于三维上下文；标准 `<use>` 仅用于二维内容，两者不得混用。
- **引用范围（强制）**：`href` 仅允许引用定义集（`<defs>`）中的**第一层节点**（`<defs>` 的直接子元素，且带 `id`）。不得引用更深层嵌套的节点；也不得引用该 `<s3dx:use>` **自身的父节点**。违反上述任一约束时，该引用无效，**忽略**该 `<s3dx:use>` 节点并警告。
- `<s3dx:use>` 引用纯二维 `<g>`（只含二维元素）时：跳过 + 警告。
- 变换累积：被引用组自身 `s3dx:transform` → `<s3dx:use>` 的 `s3dx:transform` → 父级 `s3dx:transform`。

## 12. 求值模型

### 12.1 阶段顺序

1. 解析文档树
2. 建立参数作用域
3. 解析外部参数
4. 应用动画采样覆盖（若宿主实现第 10 节时钟；否则跳过）
5. 展开 `loop-*`（求值 `loop-range` 参数）
6. 求值 `s3dx:if` / `s3dx:if-not` 的 `test`（展开后每个副本独立判断）
7. 求值表达式（图元属性、`s3dx:transform` 等）
8. 生成几何操作图
9. 内核求值，得到几何体集合
10. 按 `<s3dx:model>` 的 `mode`、材质 / `fill` 与子 `<s3dx:use>` 过滤/渲染；再合成 `s3dx:animateTransform` 的场景矩阵（若宿主实现时钟）

关键：几何求值是给定当前参数映射与各节点作者 `s3dx:transform` 的**瞬时快照**；多模型共享同一次几何结果。求值阶段处理参数、控制流与几何图元；`<s3dx:model>` 与材质库在渲染阶段生效；SVG `<metadata>` 与外国命名空间载荷保留在 DOM 中供宿主读取（第 9 节）。参数类动画通过覆盖触发完整求值；变换类动画只改场景矩阵（第 10 节）。

### 12.2 错误处理

- 求值错误范围：表达式语法错误、未定义参数引用、类型不匹配、`loop-range` 参数求值后非数字。
- 处理方式：跳过出错元素及其子树，记录警告。警告形式由宿主决定，规范不绑定。
- 文档级致命错误（XML 不合法、根元素缺失）：按 XML/SVG 既有规则处理，不属于本格式“跳过”范畴。
- “跳过+警告”是推荐行为，实现可选择更严格的报错模式，但不属于合规要求。

### 12.3 确定性与精度

- 同一文件在不同内核上求值，拓扑等价性由内核保证，本格式不规定数值精度。
- `<defs>` 中未被任何 `<s3dx:model>` 可达的实例化链引用的定义，不求值。

## 13. 附录

### 13.1 待定项汇总

1. 核心图元（见 3.2）之外仍待定：
   - `path` 是否增加样条 / 螺旋子段（`spline` / `helix`）。
   - `arc` 优弧歧义（`major`）与三点弧（起/弧上点/终，对齐 IFC `IfcArcIndex`）是否纳入。
   - `section` 内 `<path d>` 对 `A`/`C`/`Q` 的合规要求级别。
   - `sweep` 多截面沿路径（引导线 / IFC SectionedSolid）是否进入核心。
   - `torus` 扇环扫掠起始方位是否增加 `refDir`。
   - `revolve` 开放轮廓是生成壳还是自动封盖。
   - `loft` 是否支持尖点截面（顶点代替 `section`）。
   - Fillet / Chamfer / Shell 等“修饰特征”是否以可选算子进入（SolidWorks 有，STEP/IFC 交换中较少作为参数配方）。
2. `mode`（显示）取值集是否够（是否需 `points`、`shaded-edges`、曲线专用 `wire` 等）。
3. 文件扩展名：文档用 `.svg3dx`；分发包用 `.svg3dxz`（ZIP，入口 `main.svg3dx`，见 §3.3）。
4. 正式版命名空间 URI 的最终形式。
5. 是否还需对任意向量参数提供分量拆分（循环向量为 `--loop-value-x` / `-y` / `-z`）【待定】。
6. 贴图与更完整的 PBR 通道【待定】（材质基础见第 8 节）。
7. 动画是否扩展为更完整的 SMIL 对齐（`values` / `keyTimes`、事件 `begin`、`animateMotion` 等）【待定】。

### 13.2 示例

| 文件 | 内容 |
|---|---|
| [draft-0.2-point-ref.svg3dx](../samples/draft-0.2-point-ref.svg3dx) | `s3dx:point` + `ref(#id)` 共享端点 |
| [draft-0.2-animate-param.svg3dx](../samples/draft-0.2-animate-param.svg3dx) | `s3dx:animate` 驱动 `--H` |
| [draft-0.2-animate-transform.svg3dx](../samples/draft-0.2-animate-transform.svg3dx) | `s3dx:animateTransform` 旋转机构臂 |
| [draft-0.1-example.svg3dx](../samples/draft-0.1-example.svg3dx) | （0.1 稳定样例）参数、布尔、条件、`loop-*`、多模型、二维标注 |
| [draft-0.1-line.svg3dx](../samples/draft-0.1-line.svg3dx) | `s3dx:line` |
| [draft-0.1-arc.svg3dx](../samples/draft-0.1-arc.svg3dx) | `s3dx:arc`（角参数 / 起终点） |
| [draft-0.1-path.svg3dx](../samples/draft-0.1-path.svg3dx) | `s3dx:path`（`points` 与 `line`/`arc` 子段） |
| [draft-0.1-curves.svg3dx](../samples/draft-0.1-curves.svg3dx) | 曲线 + 沿曲线 `pipe` |
| [draft-0.1-extrude.svg3dx](../samples/draft-0.1-extrude.svg3dx) / [revolve](../samples/draft-0.1-revolve.svg3dx) / [loft](../samples/draft-0.1-loft.svg3dx) / [sweep](../samples/draft-0.1-sweep.svg3dx) / [pipe](../samples/draft-0.1-pipe.svg3dx) | `section` + 位姿 / 复合轨迹 |
| [draft-0.1-materials.svg3dx](../samples/draft-0.1-materials.svg3dx) | 内置预设：上排 box、下排 sphere |
| [draft-0.1-materials-custom.svg3dx](../samples/draft-0.1-materials-custom.svg3dx) | `<s3dx:materials>` 自定义材质 + box |
| [draft-0.1-color.svg3dx](../samples/draft-0.1-color.svg3dx) | 图元 `fill` 颜色（属性 / CSS） |
| [draft-0.1-metadata-oem-nozzle.svg3dx](../samples/draft-0.1-metadata-oem-nozzle.svg3dx) | SVG `<metadata>` + 厂商 NS：壳体圆柱与侧面管嘴 |
| [draft-0.1-gltf.svg3dx](../samples/draft-0.1-gltf.svg3dx) | `s3dx:gltf` + Stanford Bunny `.glb` |
| [draft-0.1-gltf-if.svg3dx](../samples/draft-0.1-gltf-if.svg3dx) | `if` + Bunny LOD 变体（`--LOD`） |
| [draft-0.1-gltf.svg3dxz](../samples/draft-0.1-gltf.svg3dxz) | `.svg3dxz` 包：`main.svg3dx` + `assets/bunny.glb` |
| [draft-0.1-gltf-if.svg3dxz](../samples/draft-0.1-gltf-if.svg3dxz) | `.svg3dxz` 包：`main.svg3dx` + Bunny LOD `.glb` |
| 其余 `draft-0.1-*.svg3dx` | 基本体、条件与循环 |

### 13.3 领域扩展（非核心，不要求实现）

下列名称偏行业短名或厂商图元，**不纳入核心合规集**；可用核心构造等价表达。

| 扩展名 | 建议用核心表达 | 说明 |
|---|---|---|
| `rectocircle`（天圆地方） | `loft`：矩形 + 圆 `section` | |
| `ecccone` / PDMS `SNOU` | `loft` 两圆（可偏心）或 `cone` | |
| `saddle`（马鞍三通） | `cylinder` + 布尔 | |
| `ellipsehead` / PDMS `DISH` | `revolve` 母线 | |
| `squarering` / PDMS `RTOR` | `sweep` 矩形截面 + 圆弧/折线路径，或 `torus` 近似 | |
| `obliquecylinder` / PDMS `SLCY` | `cylinder` + 布尔裁剪，或 `gltf` | |
| `recsection` | `extrude` / `sweep` | |

扩展元素若出现：核心实现应跳过并警告；不得依赖扩展才能打开通用文件。

### 13.4 跨系统构造对照（非规范性）

调研范围：STEP ISO 10303-42、IFC 4.x、SolidWorks、AVEVA PDMS/E3D、Smart 3D（同类设备图元思路）、Blender、3ds Max。

| 能力 | 是否进 svg3dx 核心 | 备注 |
|---|---|---|
| 长方体 / 圆柱 / 圆锥 / 球 / 环 / 楔 | 是 | CSG 基本体；各系统均有 |
| 棱锥 / 棱台 | 是（`pyramid`） | IFC Pyramid、PDMS PYRA |
| 定位点 | 是（`point`） | 构造 / 编辑锚点；以 `ref(#id)` 共享 |
| 三维直线 / 圆弧 | 是（`line` / `arc`） | STEP trimmed circle、IFC TrimmedCurve / ArcIndex、OCC Edge |
| 复合曲线 / 轨迹 | 是（`path`） | STEP composite_curve、IFC CompositeCurve / IndexedPolyCurve、OCC Wire |
| 拉伸体 Extrude | 是 | STEP/IFC/SW/PDMS/Blender/Max |
| 旋转体 Revolve | 是 | 同上；Blender Spin |
| 放样体 Loft | 是 | SW/OCC/Blender 插件；IFC 用截面实体近似 |
| 扫掠体 Sweep（截面+路径） | 是 | STEP surface_curve_swept、IFC FixedReferenceSwept、SW、Max Sweep |
| 圆盘扫掠 Swept disk | 是（`pipe`） | STEP/IFC 一等公民；管道中心线+半径 |
| 布尔并/差/交 | 是 | STEP CSG、IFC BooleanResult、SW Combine |
| 三角/索引网格 | 是（`gltf` 引用 glTF/GLB） | IFC Tessellated、glTF、Blender/Max 网格 |
| 半空间 Half-space | 否 | IFC 有，通用配方少用 |
| Boundary / Class-A 双导曲线 | 否 | SW 高级曲面，交换成本高 |
| Fillet / Chamfer / Shell | 否（待定） | 修饰特征；可用布尔或 `gltf` 近似 |
| 变径拉伸体 Tapered extrude | 否（待定） | IFC 有子类型；可用 `loft` 近似 |
| 设备短名 DISH/SNOU/RTOR/SLCY | 否 | 见 13.3，映射到构造算子 |
| 定位点 / 命名构造点 | 是（`point` + `ref(#id)`） | 编辑与共享锚点；非造型实体 |
| 参数 / 变换动画（SMIL 形子集） | 是（`animate` / `animateTransform`） | 见第 10 节；宿主时钟驱动 |

## 14. 迁移

### 14.1 从草案 0.1 到草案 0.2

1. **命名空间 URI**：将 `xmlns:s3dx`（或等价绑定）从 `urn:s3dx:draft:0.1` 改为 `urn:s3dx:draft:0.2`。
2. **可选采用的 0.2 能力**：
   - 图元 `<s3dx:point>`（定位点，属性 `at`）
   - 点 / 点列属性中的活引用 `ref(#id)`（见 2.9）
   - 动画子集 `<s3dx:animate>` / `<s3dx:animateTransform>`（见第 10 节）
3. **无上述写法的文件**：仅改 URI 即可成为合规 0.2 文档；几何求值结果与 0.1 一致。
4. **实现义务**：求值器须兼读 `urn:s3dx:draft:0.1` 与 `urn:s3dx:draft:0.2`。若 0.1 URI 文档中出现 `point` / `ref(#id)`，实现须求值并警告宜改用 0.2 URI。
5. **官方 optimize**：不得将 `ref(#id)` 内联为数字字面量；须原样保留动画元素。
6. **`<s3dx:exp>`**：0.2 不使用该元素。表达式直接写在图元属性上（字面量、`var(--*)`、`calc(...)`）。因为 0.1 是草案，未正式发行，所以读取 0.1 文件时应忽略 `<s3dx:exp>` 节点。
