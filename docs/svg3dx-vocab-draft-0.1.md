# svg3dx 官方名词表（草案 0.1）

> Official vocabulary · draft 0.1  
> 中文规范：[svg3dx-spec-draft-0.1.md](./svg3dx-spec-draft-0.1.md) · English：[svg3dx-spec-draft-0.1.en.md](./svg3dx-spec-draft-0.1.en.md)

本表给出**文件中保存的标识符**与**官方显示名**。编辑器、文档、教材在中文环境下应使用「中文名」列；英文环境使用「English」列。XML / 属性值 / 材质关键词**始终写英文标识符**。

## 1. 图元与类型 · Elements / types

| 标识符 | 中文名 | English |
|---|---|---|
| `line` | 直线 | Line |
| `arc` | 圆弧 | Arc |
| `path` | 路径 | Path |
| `box` | 长方体 | Box |
| `cylinder` | 圆柱 | Cylinder |
| `sphere` | 球体 | Sphere |
| `cone` | 圆锥 | Cone |
| `torus` | 圆环 | Torus |
| `wedge` | 楔体 | Wedge |
| `prism` | 棱柱 | Prism |
| `sector-cylinder` | 扇形柱 | Sector Cylinder |
| `pyramid` | 棱锥 | Pyramid |
| `extrude` | 拉伸 | Extrude |
| `revolve` | 旋转 | Revolve |
| `loft` | 放样 | Loft |
| `sweep` | 扫掠 | Sweep |
| `pipe` | 圆管 | Pipe |
| `mesh` | 网格 | Mesh |
| `triangles` | 三角面 | Triangles |
| `section` | 截面 | Section |
| `bool-union` | 并集 | Union |
| `bool-subtract` | 差集 | Subtract |
| `bool-intersect` | 交集 | Intersect |
| `if` | 如果 | If |
| `if-not` | 如果非 | If not |
| `loop-points` | 点列循环 | Loop points |
| `loop-range` | 范围循环 | Loop range |
| `use` | 引用 | Use |
| `model` | 模型 | Model |
| `material` | 材质 | Material |
| `materials` | 材质集 | Materials |
| `exp` | 表达式 | Expression |
| `group` | 组 | Group |

## 2. 属性 · Attributes

| 标识符 | 中文名 | English |
|---|---|---|
| `id` | 标识 | id |
| `class` | 类名 | class |
| `type` | 类型 | type |
| `href` | 引用 | href |
| `mode` | 模式 | mode |
| `test` | 条件 | test |
| `active` | 激活 | active |
| `svg3d` | 三维开关 | svg3d |
| `fill` | 填充 | fill |
| `material` | 材质 | material |
| `opacity` | 不透明度 | opacity |
| `color` | 颜色 | color |
| `metalness` | 金属度 | metalness |
| `roughness` | 粗糙度 | roughness |
| `s3dx:transform` | 变换 | transform |
| `xdir` | X 轴方向 | xdir |
| `ydir` | Y 轴方向 | ydir |
| `zdir` | Z 轴方向 | zdir |
| `translation` | 平移 | translation |
| `length` | 长度 | length |
| `width` | 宽度 | width |
| `height` | 高度 | height |
| `lengthVec` | 长度方向 | lengthVec |
| `widthVec` | 宽度方向 | widthVec |
| `diameter` | 直径 | diameter |
| `bottomCenterPt` | 底面圆心 | bottomCenterPt |
| `topCenterPt` | 顶面圆心 | topCenterPt |
| `radius` | 半径 | radius |
| `center` | 中心 | center |
| `bottomDiameter` | 底面直径 | bottomDiameter |
| `topDiameter` | 顶面直径 | topDiameter |
| `diameter1` | 主直径 | diameter1 |
| `diameter2` | 圆管直径 | diameter2 |
| `angle` | 角度 | angle |
| `torusCenterPt` | 环心 | torusCenterPt |
| `normal` | 法向 | normal |
| `topLength` | 顶边长度 | topLength |
| `topWidth` | 顶边宽度 | topWidth |
| `points` | 点列 | points |
| `from` | 起点 | from |
| `to` | 终点 | to |
| `xDir` | X 方向 | xDir |
| `startAngle` | 起始角 | startAngle |
| `origin` | 原点 | origin |
| `dir` | 方向 | dir |
| `axisOrigin` | 轴原点 | axisOrigin |
| `axisDir` | 轴方向 | axisDir |
| `solid` | 实体 | solid |
| `blend` | 混合 | blend |
| `orient` | 姿态 | orient |
| `refDir` | 参考方向 | refDir |
| `corner` | 拐角 | corner |
| `cornerRadius` | 拐角半径 | cornerRadius |
| `path` | 路径 | path |
| `innerRadius` | 内半径 | innerRadius |
| `start` | 起点值 | start |
| `end` | 终点值 | end |
| `step` | 步长 | step |

## 3. 预制材质 · Built-in materials（§8.5）

| 关键词（保存值） | 中文名 | English |
|---|---|---|
| `default` | 默认 | Default |
| `steel` | 钢 | Steel |
| `stainless` | 不锈钢 | Stainless |
| `aluminum` | 铝 | Aluminum |
| `copper` | 铜 | Copper |
| `brass` | 黄铜 | Brass |
| `plastic` | 塑料 | Plastic |
| `rubber` | 橡胶 | Rubber |
| `concrete` | 混凝土 | Concrete |
| `glass` | 玻璃 | Glass |
| `wood` | 木材 | Wood |
