# svg3dx 格式规范（草案 0.1）

> 项目概览与授权说明见仓库根目录 [README.zh-CN.md](../README.zh-CN.md) / [README.md](../README.md)。作者：danny许。

## 0. 文档状态

- 本规范为初版草案，命名空间 URI `urn:s3dx:draft:0.1` 为临时值，正式发布时将更换。
- 项目/格式名：`svg3dx`。命名空间前缀：`s3dx`。Logo 标识为 `s3dx`，全称标题为 `svg 3dx`。
- 本草案文件不保证在正式版中可解析。实现应按 URI 识别三维命名空间，不依赖前缀字面量（推荐前缀 `s3dx`）。
- 文件扩展名：沿用 `.svg`，通过根属性 `svg3d="true"` 区分三维内容。正式版可考虑 `.svg3dx`【待定】。

## 1. 文档模型

### 1.1 根元素与开关

- 根元素为 SVG `<svg>`，可包含本格式定义的扩展属性 `svg3d`（无命名空间前缀，挂在 SVG 根上）。
- `svg3d="true"` 启用三维语义；缺省或 `svg3d="false"` 时，所有 `s3dx:*` 元素及其子树按 SVG 未知命名空间元素处理：保留在 DOM 中，不参与求值，不渲染，不影响二维内容。
- `svg3d` 是总开关，优先级高于命名空间：`false` 时即使命名空间正确也忽略。
- 属性名保持 `svg3d`，不随项目名改为 `svg3dx`。语义是“本 SVG 是否包含三维内容”，与项目名解耦。标准 SVG 用户代理会忽略未知属性，不影响二维渲染。

### 1.2 命名空间

- 三维元素使用命名空间 `urn:s3dx:draft:0.1`，推荐前缀 `s3dx`。
- 三维**元素**进命名空间：核心图元见 3.2（`box`、`cylinder`、`sphere`、`cone`、`torus`、`wedge`、`pyramid`、`prism`、`sector-cylinder`、`line`、`arc`、`path`、`extrude`、`revolve`、`loft`、`sweep`、`pipe`、`mesh`、`triangles`，以及兼容别名 `polylinestretch`→`extrude`、`cutcylinder`→`sector-cylinder`）；子元 `<s3dx:section>`（以及作为轨迹容器时的 `<s3dx:path>`）；以及 `<s3dx:if>`、`<s3dx:if-not>`、`<s3dx:loop-points>`、`<s3dx:loop-range>`、`<s3dx:bool-union>`、`<s3dx:bool-subtract>`、`<s3dx:bool-intersect>`、`<s3dx:use>`、`<s3dx:model>`、`<s3dx:exp>`。
- **无前缀属性**（null 命名空间）：图元几何属性（lowerCamelCase，见 3.2）、以及 `href`、`mode`、`test`、`points`、`start`、`end`、`step`、`active`、`svg3d` 等。
- **带命名空间的属性**：三维变换使用 `s3dx:transform`（见 3.4），**不**占用 SVG 标准的 `transform` 表现属性，以免与二维 6 数 `matrix` 冲突。
- 标准 SVG 解析器对未知命名空间元素的处理：包含在 DOM 中，不渲染，不进一步处理。本格式依赖此行为实现二维兼容。

### 1.3 二维兼容

- 纯二维内容仅使用 SVG 标准命名空间元素，实例化使用标准 `<use>`，不依赖 `<s3dx:use>`。
- 同一 `<g>` 可同时被标准 `<use>` 和 `<s3dx:use>` 引用：前者在二维渲染中生效，后者在三维求值中生效，互不干扰。
- 本格式不定义三维视口范围。三维几何的投影、观察变换、可见范围由宿主环境决定。

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
2. 自身 `<s3dx:exp>` 的父图元属性
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

**白名单（强制）**：外部**仅允许**覆盖在 `<style>` 的 `:root` 规则中**直接字面量**声明的自定义属性。

- 允许：`:root { --H: 100; --Label: tank; }`，外部可传 `H` / `Label`。
- 不允许覆盖：
  - 仅出现在类规则中的参数（如 `.tanks { --R: 50; }`）
  - `:root` 中含 `var(` / `calc(` 的派生声明（如 `--D: calc(var(--H) - 20)`）
  - 根元素或其他元素内联 `style` 上的自定义属性（公开可调参数应写在 `:root`）
- 实现遇到白名单外的外部键：必须**不应用**该键，并产生警告；不得静默当作任意 DOM 参数覆盖。
- 目的：把宿主可调入口收敛为文档显式公开的直接量，避免外部传参改写内部派生量或局部参数导致模型行为失控。

### 2.6 表达式与 `calc()`

分层约定（尽量贴近 CSS，比较/逻辑由本格式补齐）：

| 层次 | 写法 | 用途 |
|---|---|---|
| 引用 | `var(--名字)` | 取自定义属性 / 循环注入变量 |
| 标量算术 | `calc(...)` | `+ - * /` 与括号，语法对齐 CSS Values `calc()` |
| 比较 / 逻辑 | 本格式表达式 | `=` `<` `>` `<=` `>=` `<>`，以及 `and` `or` `not`（用于 `s3dx:if` / `s3dx:if-not` 的 `test` 等） |

- 数值属性与 `<s3dx:exp>` 中：字面量、`var(--*)`、或 `calc(...)`。
- 条件 `test` 中：比较两侧可为字面量、`var(--*)` 或 `calc(...)`，例如 `test="var(--R) = 50"`、`test="calc(var(--R) / 2) &lt; 20"`。
- `=` 表示相等比较，不存在赋值。
- XML 属性中含 `<`、`&` 须转义为 `&lt;`、`&amp;`。
- `calc()` 内建议按 CSS 习惯在 `+` / `-` 两侧留空格（如 `calc(var(--D) - 10)`）。
- 求值失败（语法错误、未定义参数、类型不匹配）→ 跳过出错元素子树 + 警告。

### 2.7 与 CSS / SVG 的对齐说明

- **`var()` / `calc()` 本身是 CSS 标准**，在支持 CSS 的 SVG 用户代理中，用于 **CSS 属性**（`<style>`、元素 `style="..."`）时按 CSS 级联与计算。
- 本格式另外规定：在 **svg3dx 求值的属性值**中（如 `<s3dx:exp>`、`test`、`s3dx:transform` 等）也可书写 `var(--*)` / `calc(...)`，由 **svg3dx 求值器**按与 CSS 相同的表面语法解析。这不要求浏览器对**非 CSS 的 XML 属性**做变量替换。
- 因此：二维样式走 CSS；三维参数/表达式走 svg3dx 求值器——语法对齐，宿主分工不同。
- 自定义属性名须为合法 CSS `<dashed-ident>`（如 `--D`、`--loop-value`）；**不得**使用 `--loop.value` 这类含 `.` 的名字。
- 一个 `var(--*)` 的值可以是多个空格分隔的 token（CSS 允许多 token 替换）；本格式用此表达向量嵌入（见 2.8）。

### 2.8 向量在属性值中的展开

- 向量类型变量（如 `var(--loop-value)` 在 `loop-points` 中为三维点）嵌入属性值时，按空格展开为三个数字（对齐 CSS `var()` 多 token 替换）。
- 例：`s3dx:transform="matrix(1 0 0 0 1 0 0 0 1 var(--loop-value))"` 在 `--loop-value: 100 200 300` 时等价于 `matrix(1 0 0 0 1 0 0 0 1 100 200 300)`。
- 三维矩阵 **规范写法用空格分隔**（见 3.4），以便向量直接嵌入。
- 如需单独访问分量，使用独立自定义属性：`var(--loop-value-x)`、`var(--loop-value-y)`、`var(--loop-value-z)`（由循环展开时注入，见第 6 节）。
- 对分量做运算时用 `calc`，例如 `calc(var(--loop-value-x) * 50)`。
- `points` 属性中的向量序列按同样规则展开。

## 3. 三维图元

### 3.1 通用规则

- 三维图元是 `s3dx:` 命名空间下的元素。图元之间一般不互相嵌套（分组用 `<g>`）；允许的子元素仅限：
  - `<s3dx:exp>`（参数覆盖）
  - `<s3dx:section>`（拉伸 / 旋转 / 放样 / 扫掠的截面，见 3.2.4）
  - `<s3dx:path>`（扫掠 / 圆管的轨迹容器；亦可作独立复合曲线，见 3.2.3）
  - **例外**：`<s3dx:path>` 可直接包含 `<s3dx:line>` / `<s3dx:arc>` 作为曲线段（对齐 STEP `composite_curve` / OCC `Wire`）
- 图元属性表以本节与附录维护；属性表增补不改变文档格式语法。未在表中列出的属性，实现应忽略并警告。
- 局部坐标 → 父级变换 → 世界坐标的累积规则：图元属性定义的局部几何，先应用图元自身 `s3dx:transform`，再应用父级 `<g>` / `<s3dx:use>` 上的 `s3dx:transform`。
- **分层原则**：核心层只收各厂商都能映射的通用体元、曲线与网格；行业专用形体（风管配件、封头等）不进核心，见附录 10.3（可用 `loft` / `revolve` / 布尔组合表达）。

### 3.2 图元属性表（草案 0.1 · 修订）

属性名与 [`samples/draft-0.1-example.svg3dx`](../samples/draft-0.1-example.svg3dx) 对齐；几何语义对齐 AutoCAD 实体图元、Open CASCADE 构造算子（`MakePrism` / `MakeRevol` / `ThruSections`）、以及 glTF / OpenGL 风格的索引网格。

**属性命名**：图元属性名采用 SVG 常见的 **lowerCamelCase**（全小写开头，如 `length`、`lengthVec`、`bottomCenterPt`）。元素名保持小写；多词时用连字符（如 `sector-cylinder`、`if-not`、`loop-points`、`bool-union`）。XML 属性名大小写敏感；实现不得把 `Length` 当作 `length` 的别名。

#### 3.2.1 类型与通用约定

| 类型记号 | 含义 | 属性值写法 |
|---|---|---|
| 数字 | 标量长度/尺寸 | `60`、`var(--D)`、`calc(var(--D) - 10)` |
| 布尔 | 真/假 | `true` / `false` |
| 点 | 三维点 | `x y z`（三数，空格分隔） |
| 向量 | 三维方向或位移 | `x y z`；实现时应归一化方向向量（零向量为错误） |
| 角度 | 度（°），逆时针为正 | `90`、`var(--A)`、`calc(var(--A) * 2)` |
| 点列 | 点序列 | `x1 y1 z1 x2 y2 z2 …`（长度须为 3 的倍数） |
| 向量列 | 向量序列 | 同点列（每向量 3 数） |
| 数列 | 标量序列 | `u0 v0 u1 v1 …`（如 UV 每顶点 2 数） |
| 索引列 | 整数序列 | `0 1 2 0 2 3`（基准见 `indexBase`） |

**通用可选属性**（适用于所有三维图元，不在下表逐行重复）：

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `s3dx:transform` | 12 数矩阵 | 单位变换 | 见 3.4；先于父级变换应用；**不是** SVG 的 `transform` |

**局部坐标系通则**：

- 图元属性在局部坐标中定义几何；再应用自身 `s3dx:transform`，再累积父级 `<g>` / `<s3dx:use>` 上的 `s3dx:transform`。
- 对带 `lengthVec` / `widthVec` 的图元：高度方向为 `normalize(lengthVec × widthVec)`（右手系）。未给出时默认 `lengthVec="1 0 0"`、`widthVec="0 1 0"`，高度沿 `+Z`。
- 对带底/顶中心的回转体：轴线为 `topCenterPt − bottomCenterPt`；长度为其模长。两端中心重合视为错误。
- 角度未给出时，闭合回转体按整圈 `360` 处理。
- 长度类属性须为正；直径/半径须为正。`topDiameter="0"` 的圆锥退化为尖顶，允许。

#### 3.2.2 基本实体

##### `s3dx:box`（长方体）

对齐 AutoCAD `BOX` 的长/宽/高语义；方向由向量给出以便任意姿态。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `length` | 是 | 数字 | — | 沿 `lengthVec` 的边长 |
| `width` | 是 | 数字 | — | 沿 `widthVec` 的边长 |
| `height` | 是 | 数字 | — | 沿 `lengthVec × widthVec` 的边长 |
| `lengthVec` | 否 | 向量 | `1 0 0` | 长度方向 |
| `widthVec` | 否 | 向量 | `0 1 0` | 宽度方向（应与 lengthVec 不共线） |

局部原点：底面一角；底面由 `lengthVec`/`widthVec` 张成，向高度方向挤出。

##### `s3dx:cylinder`（圆柱）

对齐“底面圆心 + 另一圆心 + 直径”写法（等同 AutoCAD 圆柱“另一圆心”与 OCC `MakeCylinder` 的轴段）。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `diameter` | 是 | 数字 | — | 圆柱直径 |
| `bottomCenterPt` | 是 | 点 | — | 底面圆心 |
| `topCenterPt` | 是 | 点 | — | 顶面圆心 |

端面垂直于轴线。扇形柱面见 `sector-cylinder`。

##### `s3dx:sphere`（球体）

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `radius` | 是 | 数字 | — | 半径（球体沿用半径，与示例一致） |
| `center` | 是 | 点 | — | 球心 |

##### `s3dx:cone`（圆锥 / 圆台）

对齐 OCC `MakeCone(r1,r2,h)`：两端直径可不等；`topDiameter=0` 为尖锥。偏心两端用 `loft` 表达，不单开图元。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `bottomDiameter` | 是 | 数字 | — | 底面直径 |
| `topDiameter` | 是 | 数字 | — | 顶面直径；`0` 表示尖顶 |
| `bottomCenterPt` | 是 | 点 | — | 底面圆心 |
| `topCenterPt` | 是 | 点 | — | 顶面圆心 |

两端须共轴（圆心连线为轴）。

##### `s3dx:torus`（圆环）

对齐 AutoCAD `TORUS` / OCC `MakeTorus`。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `diameter1` | 是 | 数字 | — | 主直径 = 2 ×（环心到圆管中心） |
| `diameter2` | 是 | 数字 | — | 圆管截面直径 |
| `angle` | 否 | 角度 | `360` | 环向扫掠角；`<360` 为扇环 |
| `torusCenterPt` | 是 | 点 | — | 环心 |
| `normal` | 是 | 向量 | — | 环平面法向 |

扫掠起始方位：实现可选固定启发式；正式版可增补 `refDir`【待定】。

##### `s3dx:wedge`（楔体）

对齐 AutoCAD `WEDGE`；截顶楔参考 OCC `ltx`。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `length` | 是 | 数字 | — | 底面长度（楔形倾斜沿此方向） |
| `width` | 是 | 数字 | — | 底面宽度 |
| `height` | 是 | 数字 | — | 厚端高度 |
| `lengthVec` | 否 | 向量 | `1 0 0` | 长度方向（指向薄端） |
| `widthVec` | 否 | 向量 | `0 1 0` | 宽度方向 |
| `topLength` | 否 | 数字 | `0` | 薄端顶边长度；`0` 为尖楔 |

##### `s3dx:prism`（棱柱）

底面多边形沿法向直挤出（`extrude` 的矩形/多边形快捷形式）。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `points` | 是 | 点列 | — | 底面多边形顶点，至少 3 点；顺序、不自交；首尾不必重复 |
| `height` | 是 | 数字 | — | 挤出高度 |
| `normal` | 否 | 向量 | 由底面三点按右手系推定 | 挤出方向 |

##### `s3dx:sector-cylinder`（扇形柱）

对齐 OCC `MakeCylinder(r, h, angle)`。多词元素名用连字符，避免 `cutcylinder` 被误读为布尔裁剪。兼容别名：`cutcylinder`（读入时等同本元素；写出应使用 `sector-cylinder`）。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `diameter` | 是 | 数字 | — | 直径 |
| `bottomCenterPt` | 是 | 点 | — | 底面圆心 |
| `topCenterPt` | 是 | 点 | — | 顶面圆心 |
| `angle` | 否 | 角度 | `360` | 绕轴扫掠角；`360` 等价于 `cylinder` |

##### `s3dx:pyramid`（棱锥 / 棱台）

对齐 IFC `IfcRectangularPyramid`、PDMS `PYRA`：矩形底 + 顶点（或顶面矩形）。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `length` | 是 | 数字 | — | 底面边长 |
| `width` | 是 | 数字 | — | 底面边宽 |
| `height` | 是 | 数字 | — | 底面到顶的高度 |
| `lengthVec` | 否 | 向量 | `1 0 0` | 底面长度方向 |
| `widthVec` | 否 | 向量 | `0 1 0` | 底面宽度方向 |
| `topLength` | 否 | 数字 | `0` | 顶面边长；`0` 为尖顶棱锥 |
| `topWidth` | 否 | 数字 | `topLength` | 顶面边宽；缺省与 `topLength` 相同 |

局部原点：底面中心；高度沿 `lengthVec × widthVec`。

#### 3.2.3 曲线图元（线 / 圆弧 / 复合路径）

对齐 STEP / IFC 的 `polyline` / `trimmed_curve(circle)` / `composite_curve`，以及 OCC `Edge` / `Wire`：三维线与圆弧是一等图元，可独立显示，也可作为 `<s3dx:path>` 的**轨迹子段**（描述中心线本身长什么样）。

注意：扫掠 / 圆管在折角处**面如何衔接**（圆角弯、倒角、尖角等）由父体的 `corner` 控制并自动生成，**不是**靠在路径里手写一段 `arc` 来代替转角类型。`path` 里的 `line`/`arc` 只表达轨迹几何。

对照关系（非规范性）：

| svg3dx | STEP | IFC | OCC |
|---|---|---|---|
| `line` | `polyline`（两点）/ `line`+trim | `IfcPolyline`（两点） | `Geom_Line` → `Edge` |
| `arc` | `trimmed_curve` + `circle` | `IfcTrimmedCurve` + `IfcCircle`；或 `IfcArcIndex` | `Geom_Circle` → `Edge` |
| `path` | `composite_curve` | `IfcCompositeCurve` / `IfcIndexedPolyCurve` | `TopoDS_Wire` |

##### `s3dx:line`（三维直线段）

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `from` | 条件 | 点 | — | 起点；作为 `path` 子段且紧接上一段时，可省略（默认接上一段终点） |
| `to` | 是 | 点 | — | 终点；不得与起点重合 |

```xml
<s3dx:line from="0 0 0" to="200 0 0"/>
```

##### `s3dx:arc`（三维圆弧段）

圆弧位于以 `center` 为原点、`normal` 为法向的平面上；角参数自 `xDir`（投影到该平面）起，绕 `normal` 按右手系计量。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `center` | 是 | 点 | — | 圆心 |
| `normal` | 是 | 向量 | — | 圆弧平面法向 |
| `radius` | 条件 | 数字 | — | 半径；若同时给出 `from`/`to`，可省略并由弦长校核 |
| `xDir` | 否 | 向量 | 见说明 | 角参数 0° 参考方向；缺省取平面内与世界轴尽量对齐的稳定方向 |
| `startAngle` | 否 | 角度 | `0` | 起点角 |
| `angle` | 条件 | 角度 | — | 扫掠角（可负，表示反向）；与 `from`/`to` 二选一体系，见下 |
| `from` | 条件 | 点 | — | 弧起点（须在圆上，容差内）；作为 `path` 子段时可省略以接上一段终点 |
| `to` | 条件 | 点 | — | 弧终点（须在圆上） |

写法（择一，实现应支持至少一种；推荐文档写全）：

1. **圆心 + 半径 + 角**：`center` `normal` `radius` `startAngle` `angle`（可选 `xDir`）
2. **圆心 + 起终点**：`center` `normal` `from` `to`（可选 `radius`）；劣弧 / 优弧歧义时以 `angle` 符号或附加 `major="true"`【待定】消解，0.1 默认取 ≤180° 劣弧

```xml
<!-- 角参数写法 -->
<s3dx:arc center="0 0 0" normal="0 0 1" radius="50"
          xDir="1 0 0" startAngle="0" angle="90"/>

<!-- 起终点写法（90° 弯管常用） -->
<s3dx:arc center="200 0 75" normal="0 -1 0" radius="75"
          from="200 0 0" to="275 0 75"/>
```

约束：`radius > 0`；`|angle|` 为 0 视为退化（跳过 + 警告）；整圆可用 `angle="360"`（显示为闭曲线；作路径段时起终点重合）。

##### `s3dx:path`（复合三维曲线 / 轨迹）

对齐 `composite_curve` / `Wire`：有序曲线段首尾相接。可：

- 作为**独立图元**（中心线、标注辅助线、管道路由预览等）
- 作为 `sweep` / `pipe` 的**轨迹子元素**

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `points` | 条件 | 点列 | — | 折线简便写法（≥2 点）；等价于若干首尾相接的 `line` |

子元素（与 `points` **二选一**；同时出现时优先子元素并警告）：按文档顺序的 `<s3dx:line>` / `<s3dx:arc>`（样条 / 螺旋【待定】）。

段连续性：每一段起点须等于上一段终点（实现容差建议 ≤ 1e-6 × 特征尺寸，或发出警告并强制对接）。

```xml
<!-- 轨迹本身含圆弧段（曲线路径，不是 sweep 的 corner） -->
<s3dx:path>
  <s3dx:line from="0 0 0" to="200 0 0"/>
  <s3dx:arc  center="200 0 75" normal="0 -1 0" radius="75"
             from="200 0 0" to="275 0 75"/>
  <s3dx:line from="275 0 75" to="275 0 200"/>
</s3dx:path>

<!-- 折线轨迹；若用于 sweep/pipe，折角处的面衔接由 corner 自动补 -->
<s3dx:path points="0 0 0  200 0 0  200 0 150  50 0 150"/>
```

在 `sweep` / `pipe` 上亦可用父元素属性 `path="x1 y1 z1 …"` 作为折线简便写法，与子元素 `<s3dx:path>` 二选一。

#### 3.2.4 构造体元（拉伸 / 旋转 / 放样 / 扫掠）

对应 STEP / IFC / SolidWorks / PDMS 等共通的扫掠族构造；行业异形件优先用它们组合，而不是新增专用图元。

对照关系（非规范性，详见附录 10.4）：

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
| 位姿 | 父体（`extrude` / `revolve` / `sweep`）或每个 `section`（`loft`）上的 `origin` / `normal` / `xDir` | 截面落在哪、朝哪 |
| 二维轮廓 | `<s3dx:section>` 内的 SVG 几何子元素（`path` / `circle` / `polygon` / `rect` / `ellipse`） | 局部 2D；可含直线与圆弧 |
| 三维轨迹 | `<s3dx:path>`（`points` 或 `line`/`arc` 子段） | 中心线**路径几何**（线段 / 圆弧等组成轨迹本身） |
| 扫掠转角 | `sweep` / `pipe` 的 `corner`（+ `cornerRadius`） | 轨迹折角处**各面如何衔接**；求值时自动生成，不写入 path |

截面局部坐标 → 世界坐标：

- 局部 \(u\) 轴：将 `xDir` 投影到垂直于 `normal` 的平面并归一化（记为 \(\hat{X}\)）。
- 局部 \(v\) 轴：\(\hat{Y} = \hat{N} \times \hat{X}\)（右手系；\(\hat{N}\) 为归一化 `normal`）。
- 点映射：\(P = \mathrm{origin} + u\,\hat{X} + v\,\hat{Y}\)。
- 缺省：`origin="0 0 0"`、`normal="0 0 1"`、`xDir="1 0 0"`。

##### `<s3dx:section>`（截面，非独立图元）

仅作为 `extrude` / `revolve` / `loft` / `sweep` 的子元素。截面形状由**子级 SVG 几何**给出（无 `s3dx` 前缀，落在 SVG 命名空间），坐标为截面局部 2D。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `origin` | 否 | 点 | 见说明 | 截面原点；`loft` 各截面通常自带；`extrude` / `revolve` / `sweep` 缺省继承父元素位姿 |
| `normal` | 否 | 向量 | 见说明 | 截面平面法向 |
| `xDir` | 否 | 向量 | 见说明 | 截面局部 +X 参考方向 |

草案 0.1 允许的子元素（至少一个）：

| 子元素 | 说明 |
|---|---|
| `<path d="…">` | SVG path；0.1 实现至少支持 `M`/`L`/`H`/`V`/`Z`（及相对形式）；`A`/`C`/`Q` 等【待定，推荐实现】 |
| `<circle cx cy r>` | 圆 |
| `<ellipse cx cy rx ry>` | 椭圆 |
| `<polygon points="x1 y1 …">` | 封闭折线（二维点列） |
| `<rect x y width height>` | 轴对齐矩形 |

多个子形状时：实现可将外轮廓取并集，或仅取第一个并警告；须在文档中说明。

轨迹用 `<s3dx:path>`（见 3.2.3）：折线 `points` 或 `line`/`arc` 子段。`sweep` / `pipe` 的折角面衔接另见 `corner`，与路径段定义分层。

##### `s3dx:extrude`（拉伸体）

对齐 STEP `extruded_area_solid` / IFC `IfcExtrudedAreaSolid` / OCC `MakePrism` / AutoCAD `EXTRUDE`。父元素携带截面位姿与拉伸量；轮廓必须用子元素 `<s3dx:section>`。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `origin` | 否 | 点 | `0 0 0` | 截面原点 |
| `normal` | 否 | 向量 | `0 0 1` | 截面法向；亦为缺省拉伸方向 |
| `xDir` | 否 | 向量 | `1 0 0` | 截面局部 +X |
| `dir` | 否 | 向量 | `normal` | 拉伸方向（可斜挤） |
| `length` | 是 | 数字 | — | 拉伸长度 |

子元素：恰好一个 `<s3dx:section>`（封闭轮廓生成实体）。

```xml
<s3dx:extrude origin="0 0 0" normal="0 0 1" length="60">
  <s3dx:section>
    <path d="M 0 0 L 100 0 L 100 50 L 0 50 Z"/>
  </s3dx:section>
</s3dx:extrude>
```

**兼容别名**：`s3dx:polylinestretch` 视为 `extrude` 的旧名；新文件应写 `extrude`。若仍使用 `polylinestretch`，轮廓同样须为子元素 `<s3dx:section>`（不再支持 `stretchFace` 属性）。

##### `s3dx:revolve`（旋转体）

对齐 STEP `revolved_area_solid` / OCC `MakeRevol` / AutoCAD `REVOLVE` / Blender Spin。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `origin` | 否 | 点 | `0 0 0` | 截面原点 |
| `normal` | 否 | 向量 | `0 0 1` | 截面法向 |
| `xDir` | 否 | 向量 | `1 0 0` | 截面局部 +X |
| `axisOrigin` | 是 | 点 | — | 旋转轴上一点 |
| `axisDir` | 是 | 向量 | — | 旋转轴方向 |
| `angle` | 否 | 角度 | `360` | 旋转角 |

子元素：恰好一个 `<s3dx:section>`（母线轮廓；封闭轮廓生成实体，开放轮廓生成薄壳，由内核决定，实现应文档化）。

```xml
<!-- 截面在缺省 XY 面（normal +Z）；u=半径，v=沿轴高度；绕 Y 旋转 -->
<s3dx:revolve axisOrigin="0 0 0" axisDir="0 1 0" angle="360">
  <s3dx:section>
    <path d="M 40 0 L 80 0 L 80 60 L 40 40 Z"/>
  </s3dx:section>
</s3dx:revolve>
```

若轴为 `+Z`、截面放在 `XZ` 面，右手系下 `normal` 应为 `0 -1 0`（使局部 \(v\) 指向 `+Z`）；写 `0 1 0` 会使高度反向。

##### `s3dx:loft`（放样体）

对齐 OCC `ThruSections` / SolidWorks Loft / 数学上的 blended surface：若干截面蒙皮（**无扫掠路径**；截面已就位）。每位姿挂在各自 `<s3dx:section>` 上。

放样**不需要**扫掠意义上的「转角类型」：相邻截面之间没有中心线拐角，几何由截面位姿与截面间的**过渡 / 趋近律**决定。

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
- 引导线 / 中心线约束的放样（SolidWorks guide / centerline loft）不在 0.1 核心。

```xml
<s3dx:loft solid="true" blend="linear">
  <s3dx:section origin="0 0 0" normal="0 0 1">
    <path d="M -50 -40 L 50 -40 L 50 40 L -50 40 Z"/>
  </s3dx:section>
  <s3dx:section origin="0 0 80" normal="0 0 1">
    <circle cx="0" cy="0" r="30"/>
  </s3dx:section>
</s3dx:loft>
```

##### `s3dx:sweep`（扫掠体）

对齐 STEP `surface_curve_swept_area_solid`、IFC `IfcFixedReferenceSweptAreaSolid` / `IfcSurfaceCurveSweptAreaSolid`、SolidWorks Sweep、3ds Max Sweep、OCC `MakePipeShell`：一个截面沿路径运动生成实体。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `orient` | 否 | 枚举 | `frenet` | 截面姿态：`frenet`（沿路径平行搬运）\| `fixed`（IFC FixedReference：`refDir` 投影为截面局部 +X）\| `parallel`（`refDir` 投影为截面局部 +Y / “上”） |
| `refDir` | 条件 | 向量 | — | `orient=fixed` / `parallel` 的参考方向。**勿取弯道所在平面内的角平分线方向**（会与切向平行而奇异）；与切向平行时回退为上一帧平行搬运，并保持帧手性连续 |
| `solid` | 否 | 布尔 | `true` | 封闭截面是否生成实体 |
| `path` | 否 | 点列 | — | 折线路径简便写法；与子元素 `<s3dx:path>` 二选一（须具其一） |
| `corner` | 否 | 枚举 | `arc` | 折线顶点处的**转角生成**（见下） |
| `cornerRadius` | 条件 | 数字 | — | `arc` / `chamfer` 的半径或倒角边长；缺省时由实现按邻边长度取合理默认并警告 |

子元素：恰好一个 `<s3dx:section>`；路径用 `path` 属性或子元素 `<s3dx:path>`。截面二维轮廓在路径各帧的局部 \((u,v)\) 中解释（姿态由 `orient` 决定）。

**两层分工（勿混淆）**

| 层 | 谁表达 | 含义 |
|---|---|---|
| **轨迹** | `<s3dx:path>` 的 `points` / `line` / `arc` | 中心线本身：折线走哪、曲线段怎么弯 |
| **转角衔接** | `corner` + `cornerRadius` | 扫掠体在轨迹**折角顶点**处，侧面如何圆角 / 倒角 / 尖接；**求值时自动补**，不写进 path |

`path` 里的 `arc` 是「这段轨迹就是圆弧」；`corner="arc"` 是「折线拐弯处，把扫掠面衔接成圆弧弯」。前者属于路径定义，后者属于扫掠构造。

**转角 `corner`（默认圆弧弯）**

对轨迹上切向不连续的内顶点，由实现按 `corner` 自动生成衔接（作者不必、也不应用 path 子段去“模拟”转角类型）：

| 值 | 生成结果 | 说明 |
|---|---|---|
| `arc` | 圆弧弯（圆角 / elbow） | **默认**；在顶点处生成与邻边相切的圆弧衔接，半径 = `cornerRadius` |
| `chamfer` | 倒角弯 | 在顶点处切一刀衔接，倒角边长 = `cornerRadius` |
| `sharp` | 尖角 | 保持折点；截面双帧对接（尺寸不撑宽） |
| `miter` | 尖角斜接 | 保持折点；入/出切向平均为一帧（拐角处截面可能变宽） |

约束与行为：

- 几乎共线的顶点（偏转角过小）跳过。
- `cornerRadius` 过大以至超过邻边可用长度时：缩小到可放得下，并警告。
- 轨迹段本身已是光滑曲线（例如 path 子段 `arc` 内部采样点）处切向连续，不触发 `corner`；`corner` 只作用于折角顶点。
- `orient` 只管截面朝向，与转角衔接正交。

```xml
<!-- 轨迹用折线；转角由 corner 自动补（默认 arc） -->
<s3dx:sweep orient="frenet" solid="true" corner="arc" cornerRadius="50">
  <s3dx:section>
    <path d="M -10 -5 L 10 -5 L 10 5 L -10 5 Z"/>
  </s3dx:section>
  <s3dx:path points="0 0 0  200 0 0  200 0 200"/>
</s3dx:sweep>
```

约束：

- 折线路径至少两段（≥3 点）；转角按 `corner` 处理，实现应尽量避免自交，无法保证时给出警告。
- `orient` 与内核能力不匹配时：回退到 `frenet` + 警告。
- 多截面沿路径变化（SolidWorks 引导线 / IFC SectionedSolid）不在 0.1 核心；可用 `loft` 近似或后续扩展。

##### `s3dx:pipe`（圆盘扫掠 / 圆管）

对齐 STEP `swept_disk_solid` / IFC `IfcSweptDiskSolid`：圆形（可空心）截面沿三维路径扫掠。管道、线缆、弯管段的通用表达；比一般 `sweep` 更贴近交换标准。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `radius` | 是 | 数字 | — | 外半径（≡ STEP `radius`） |
| `innerRadius` | 否 | 数字 | — | 内半径；缺省为实心；若给出须满足 `0 < innerRadius < radius` |
| `path` / 子 `<s3dx:path>` | 是 | — | — | 中心线**轨迹**（折线或 `line`/`arc` 段） |
| `corner` | 否 | 枚举 | `arc` | 折角面衔接，同 `sweep`（与轨迹段分层） |
| `cornerRadius` | 条件 | 数字 | — | 同 `sweep` |

```xml
<s3dx:pipe radius="50" innerRadius="45" corner="arc" cornerRadius="100">
  <s3dx:path points="0 0 0  300 0 0  300 0 300"/>
</s3dx:pipe>
```

语义上等价于 `sweep` + 圆形 `<s3dx:section>`（及空心时的内侧圆），但实现应优先按 swept-disk 算法求值（截面始终垂直于路径切向）。轨迹与 `corner` 转角衔接的分工与 `sweep` 相同。

#### 3.2.5 网格（OpenGL / glTF 风格）

##### `s3dx:mesh`（通用索引网格）

对齐 OpenGL 绘制调用 / glTF `mesh.primitive`：分离的顶点属性数组 + 可选索引。便于直接对接 GPU、导出器与多数查看器。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `mode` | 否 | 枚举 | `triangles` | `triangles` \| `triangle-strip` \| `triangle-fan` \| `lines` \| `line-strip` \| `points`（对应 GL 拓扑；实体求值器可只支持 `triangles`） |
| `position` | 是 | 点列 | — | 顶点位置，每顶点 3 数（≡ glTF `POSITION` / GL attribute） |
| `normal` | 否 | 向量列 | — | 每顶点法线，3 数；长度须与顶点数一致 |
| `texcoord` | 否 | 数列 | — | 每顶点 UV，**2** 数一组；长度 = 顶点数 × 2 |
| `color` | 否 | 数列 | — | 每顶点 RGB 或 RGBA（3 或 4 数一组，由 `colorSize` 指定） |
| `colorSize` | 否 | 数字 | `3` | `3` = RGB，`4` = RGBA；分量建议 ∈ [0,1] |
| `index` | 否 | 索引列 | — | 元素索引；缺省则按 `mode` 非索引绘制（依次取顶点） |
| `indexBase` | 否 | 数字 | `0` | 索引基准：`0` = OpenGL/glTF；`1` = 传统 CAD 习惯 |

约束：

- `position` 顶点数 \(N \ge 1\)；若有 `normal`/`texcoord`/`color`，其顶点计数必须等于 \(N\)。
- 有 `index` 时，索引须落在 \([indexBase,\ indexBase+N)\)；非法索引 → 跳过该图元元素 + 警告。
- `mode=triangles` 且有索引时，索引个数须为 3 的倍数。

```xml
<s3dx:mesh mode="triangles" indexBase="0"
           position="0 0 0  1 0 0  0 1 0  0 0 1"
           normal="0 0 1  0 0 1  0 0 1  1 0 0"
           index="0 1 2  0 2 3"/>
```

##### `s3dx:triangles`（三角网格简写）

保留为 `mesh` 的便捷子集（与现有示例兼容）。

| 属性 | 必选 | 类型 | 默认 | 说明 |
|---|---|---|---|---|
| `point` | 是 | 点列 | — | 同 `mesh/@position` |
| `normal` | 是 | 向量列 | — | 同 `mesh/@normal`（本简写中为必选） |
| `index` | 是 | 索引列 | — | 三角面索引；**固定 1-based**（历史兼容） |

语义等价于：

`mesh mode="triangles" indexBase="1" position={point} normal={normal} index={index}`。

新内容优先写 `mesh`；`triangles` 仍须被实现支持。

#### 3.2.6 核心层总览速查

| 图元 | 必选 | 可选 / 子元素 |
|---|---|---|
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
| `arc` | center, normal | radius, xDir, startAngle, angle, from, to |
| `path` | points **或** ≥1 曲线段 | 子：`line` / `arc` |
| `extrude` | length | origin, normal, xDir, dir；恰好 1 × `<s3dx:section>`；旧名 `polylinestretch` |
| `revolve` | axisOrigin, axisDir | origin, normal, xDir, angle；恰好 1 × `<s3dx:section>` |
| `loft` | — | solid, blend；≥2 × `<s3dx:section>`（各位姿自带；无扫掠转角） |
| `sweep` | — | orient, refDir, solid, corner, cornerRadius；1 × `<s3dx:section>` + path / `<s3dx:path>` |
| `pipe` | radius + path | innerRadius, corner, cornerRadius；`<s3dx:path>`（转角同 sweep） |
| `mesh` | position | mode, normal, texcoord, color, colorSize, index, indexBase |
| `triangles` | point, normal, index | （≡ mesh 简写，1-based） |

#### 3.2.7 参考来源（非规范性）

- STEP ISO 10303-42：`composite_curve`、`trimmed_curve`、`circle`、`extruded/revolved/surface_curve_swept_area_solid`、`swept_disk_solid`、CSG 基本体。
- IFC：`IfcCompositeCurve`、`IfcIndexedPolyCurve`、`IfcTrimmedCurve`、`IfcExtrudedAreaSolid`、`IfcRevolvedAreaSolid`、`IfcSweptDiskSolid`、`IfcFixedReferenceSweptAreaSolid`、`IfcCsgPrimitive3D`、`IfcTriangulatedFaceSet`。
- SolidWorks：Extrude / Revolve / Sweep / Loft。
- PDMS / AVEVA E3D：BOX、CYLI、CONE、PYRA、CTOR、EXTR、REVO 等设备图元。
- AutoCAD / OCC：实体图元与 `MakePrism` / `MakeRevol` / `MakePipeShell` / `ThruSections`；曲线 `Edge` / `Wire`。
- Blender / 3ds Max：Extrude、Spin、Curve Bevel / Sweep 修改器、网格。
- 网格：OpenGL 拓扑；glTF 2.0 `POSITION` / `NORMAL` / `TEXCOORD_0` / `COLOR_0` / `indices`。

### 3.3 网格补充说明

- 实体求值路径：`mesh` / `triangles` 作为已离散几何直接进入显示或可选地转为外壳；不要求再经 CAD 内核参数化求值。
- 布尔运算操作数可以是 `mesh`（若内核支持网格布尔）；不支持时跳过 + 警告。
- 非法索引或属性长度不一致 → 跳过该图元 + 警告。

### 3.4 三维变换（`s3dx:transform`）

- 三维变换写在命名空间属性 **`s3dx:transform`** 上，**不**使用 SVG 标准属性 `transform`。这样二维 6 数 `transform` 与三维 12 数矩阵互不抢占同一属性名。
- 值语法为 12 数矩阵：

  `matrix(a b c  d e f  g h i  tx ty tz)`

  前 9 个为 3×3 线性变换，后 3 个为平移。
- **数的分隔**：规范写法为**空格分隔**（可含换行），与本格式点列 / 向量（如 `lengthVec="1 0 0"`）及 SVG 数字列表习惯一致，也便于 `var(--loop-value)` 这类向量直接嵌入平移分量。实现可将逗号视为与空格等价的可选分隔符（对齐 SVG `comma-wsp`），但文档与示例应写空格形式。
- 单位矩阵平移示例：`s3dx:transform="matrix(1 0 0 0 1 0 0 0 1 100 200 300)"`。
- 值中允许 `var(--*)` / `calc(...)`（由 svg3dx 求值器解析）。
- 适用范围：三维相关的 SVG 宿主元素（如 `<g>`）以及 `s3dx:*` 元素（含 `<s3dx:use>`、`<s3dx:model>`、循环/布尔容器上的图元等）。
- 标准 SVG 属性 `transform`（无前缀）始终按 **SVG / CSS 二维**语义解释（通常为 6 数 `matrix` 等），**不**承载本格式的 12 数三维矩阵。
- 标准 SVG/CSS 的 `matrix()` 为 6 参数、`matrix3d()` 为 16 参数；本格式 `s3dx:transform` 上的 12 数 `matrix(...)` 为 **svg3dx 扩展**，由本格式求值，不要求浏览器原生支持。
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

## 5. 条件逻辑

### 5.1 元素

条件是独立的控制流元素，与布尔、循环同属结构表达：

- `<s3dx:if test="条件">`：条件为真时子树参与求值，为假时整个子树跳过。
- `<s3dx:if-not test="条件">`：条件为假时子树参与，为真时跳过。

### 5.2 规则

- 属性 `test` 必选；值支持表达式（见 2.6）。
- 可出现在 `<g>`、`<defs>`、`<s3dx:model>`、`<s3dx:loop-*>`、`<s3dx:bool-*>`、以及嵌套的 `s3dx:if` / `s3dx:if-not` 内。
- 允许的子元素与 `<g>` 在三维求值中相同：图元、`<s3dx:use>`、嵌套的 `if` / `if-not` / `loop-*` / `bool-*`、以及内层 `<g>`。
- 可选携带 `s3dx:transform`（与其他 `s3dx:*` 容器一致）；不承担命名分组职责（可复用的命名组仍用带 `id` 的 `<g>`）。
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

## 8. `<s3dx:use>`

- 属性：`href`（必选，引用 `<g id="...">`）、`s3dx:transform`（可选，12 数三维矩阵）。
- 不设 `x`/`y`；三维平移用 `s3dx:transform` 的 `tx/ty/tz`。
- 仅用于三维上下文；标准 `<use>` 仅用于二维内容，两者不得混用。
- `<s3dx:use>` 引用纯二维 `<g>`（只含二维元素）时：跳过 + 警告。
- 变换累积：被引用组自身 `s3dx:transform` → `<s3dx:use>` 的 `s3dx:transform` → 父级 `s3dx:transform`。

## 9. 求值模型

### 9.1 阶段顺序

1. 解析文档树
2. 建立参数作用域
3. 解析外部参数
4. 展开 `loop-*`（求值 `loop-range` 参数）
5. 求值 `s3dx:if` / `s3dx:if-not` 的 `test`（展开后每个副本独立判断）
6. 求值 `<s3dx:exp>` 与表达式
7. 生成几何操作图
8. 内核求值，得到几何体集合
9. 按 `<s3dx:model>` 的 `mode` 和子 `<s3dx:use>` 过滤/渲染

关键：`<s3dx:model>` 不参与几何求值，只在渲染阶段起作用；几何只求值一次，多模型共享。

### 9.2 错误处理

- 求值错误范围：表达式语法错误、未定义参数引用、类型不匹配、`loop-range` 参数求值后非数字。
- 处理方式：跳过出错元素及其子树，记录警告。警告形式由宿主决定，规范不绑定。
- 文档级致命错误（XML 不合法、根元素缺失）：按 XML/SVG 既有规则处理，不属于本格式“跳过”范畴。
- “跳过+警告”是推荐行为，实现可选择更严格的报错模式，但不属于合规要求。

### 9.3 确定性与精度

- 同一文件在不同内核上求值，拓扑等价性由内核保证，本格式不规定数值精度。
- `<defs>` 中未被任何 `<s3dx:model>` 可达的实例化链引用的定义，不求值。

## 10. 附录

### 10.1 待定项汇总

1. 核心属性表已按「基本体 + 曲线（line/arc/path）+ 拉伸/旋转/放样/扫掠/圆管 + mesh」修订（见 3.2）；仍待定：
   - `path` 是否增加样条 / 螺旋子段（`spline` / `helix`）。
   - `arc` 优弧歧义（`major`）与三点弧（起/弧上点/终，对齐 IFC `IfcArcIndex`）是否纳入。
   - `section` 内 `<path d>` 对 `A`/`C`/`Q` 的合规要求级别。
   - `sweep` 多截面沿路径（引导线 / IFC SectionedSolid）是否进入核心。
   - `torus` 扇环扫掠起始方位是否增加 `refDir`。
   - `revolve` 开放轮廓是生成壳还是自动封盖。
   - `loft` 是否支持尖点截面（顶点代替 `section`）。
   - `mesh` 是否允许外部二进制缓冲（类似 glTF buffer）。
   - Fillet / Chamfer / Shell 等“修饰特征”是否以可选算子进入（SolidWorks 有，STEP/IFC 交换中较少作为参数配方）。
2. `mode`（显示）取值集是否够（是否需 `points`、`shaded-edges`、曲线专用 `wire` 等）。
3. 文件扩展名是否用 `.svg3dx`。
4. 正式版命名空间 URI 的最终形式。
5. ~~向量分量访问~~ → 已定为 `--loop-value-x` / `-y` / `-z`；是否还需对任意向量参数提供分量拆分【待定】。
6. ~~条件挂在 `<g>` 上~~ → 已改为独立元素 `s3dx:if` / `s3dx:if-not`（属性 `test`）。

### 10.2 示例

| 文件 | 内容 |
|---|---|
| [draft-0.1-example.svg3dx](../samples/draft-0.1-example.svg3dx) | 参数、布尔、条件、`loop-*`、多模型、二维标注 |
| [draft-0.1-line.svg3dx](../samples/draft-0.1-line.svg3dx) | `s3dx:line` |
| [draft-0.1-arc.svg3dx](../samples/draft-0.1-arc.svg3dx) | `s3dx:arc`（角参数 / 起终点） |
| [draft-0.1-path.svg3dx](../samples/draft-0.1-path.svg3dx) | `s3dx:path`（`points` 与 `line`/`arc` 子段） |
| [draft-0.1-curves.svg3dx](../samples/draft-0.1-curves.svg3dx) | 曲线 + 沿曲线 `pipe` |
| [draft-0.1-extrude.svg3dx](../samples/draft-0.1-extrude.svg3dx) / [revolve](../samples/draft-0.1-revolve.svg3dx) / [loft](../samples/draft-0.1-loft.svg3dx) / [sweep](../samples/draft-0.1-sweep.svg3dx) / [pipe](../samples/draft-0.1-pipe.svg3dx) | `section` + 位姿 / 复合轨迹 |
| 其余 `draft-0.1-*.svg3dx` | 基本体、网格、条件与循环 |

### 10.3 领域扩展（非核心，不要求实现）

下列名称偏行业短名或厂商图元，**不纳入核心合规集**；可用核心构造等价表达。

| 扩展名 | 建议用核心表达 | 说明 |
|---|---|---|
| `rectocircle`（天圆地方） | `loft`：矩形 + 圆 `section` | |
| `ecccone` / PDMS `SNOU` | `loft` 两圆（可偏心）或 `cone` | |
| `saddle`（马鞍三通） | `cylinder` + 布尔 | |
| `ellipsehead` / PDMS `DISH` | `revolve` 母线 | |
| `squarering` / PDMS `RTOR` | `sweep` 矩形截面 + 圆弧/折线路径，或 `torus` 近似 | |
| `obliquecylinder` / PDMS `SLCY` | `cylinder` + 布尔裁剪，或 `mesh` | |
| `recsection` | `extrude` / `sweep` | |

扩展元素若出现：核心实现应跳过并警告；不得依赖扩展才能打开通用文件。

### 10.4 跨系统构造对照（非规范性）

调研范围：STEP ISO 10303-42、IFC 4.x、SolidWorks、AVEVA PDMS/E3D、Smart 3D（同类设备图元思路）、Blender、3ds Max。

| 能力 | 是否进 svg3dx 核心 | 备注 |
|---|---|---|
| 长方体 / 圆柱 / 圆锥 / 球 / 环 / 楔 | 是 | CSG 基本体；各系统均有 |
| 棱锥 / 棱台 | 是（`pyramid`） | IFC Pyramid、PDMS PYRA |
| 三维直线 / 圆弧 | 是（`line` / `arc`） | STEP trimmed circle、IFC TrimmedCurve / ArcIndex、OCC Edge |
| 复合曲线 / 轨迹 | 是（`path`） | STEP composite_curve、IFC CompositeCurve / IndexedPolyCurve、OCC Wire |
| 拉伸 Extrude | 是 | STEP/IFC/SW/PDMS/Blender/Max |
| 旋转 Revolve | 是 | 同上；Blender Spin |
| 放样 Loft | 是 | SW/OCC/Blender 插件；IFC 用截面实体近似 |
| 扫掠 Sweep（截面+路径） | 是 | STEP surface_curve_swept、IFC FixedReferenceSwept、SW、Max Sweep |
| 圆盘扫掠 Swept disk | 是（`pipe`） | STEP/IFC 一等公民；管道中心线+半径 |
| 布尔并/差/交 | 是 | STEP CSG、IFC BooleanResult、SW Combine |
| 三角/索引网格 | 是（`mesh`） | IFC Tessellated、glTF、Blender/Max 网格 |
| 半空间 Half-space | 否 | IFC 有，通用配方少用 |
| Boundary / Class-A 双导曲线 | 否 | SW 高级曲面，交换成本高 |
| Fillet / Chamfer / Shell | 否（待定） | 修饰特征；可用布尔或网格近似 |
| 变径拉伸 Tapered extrude | 否（待定） | IFC 有子类型；可用 `loft` 近似 |
| 设备短名 DISH/SNOU/RTOR/SLCY | 否 | 见 10.3，映射到构造算子 |
