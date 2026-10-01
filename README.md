# THREE.SHOWCASE

Three.js / WebGL 互动网站案例库 + 学习路径。一个纯静态站，深色主题，Hero 用真实 Three.js 实时渲染。

---

## 文件结构

```
threejs-showcase/
├── index.html                 # 页面（19 个案例写在 HTML 里，无 JS 也能看内容）
├── style.css                  # 全部样式，改顶部变量即可换配色
├── main.js                    # Three.js 场景 + 筛选 + 3D 倾斜 + 滚动淡入
├── lib/
│   ├── three.module.min.js    # Three.js r186（已本地化，不依赖国外 CDN）
│   └── three.core.js          # 配套核心模块（jsDelivr 压缩版）
├── serve.js                   # 本地预览用的极简静态服务器
└── _tools/                    # 开发期验证工具，可整目录删除
```

## 本地预览

**注意：必须用 HTTP 服务打开，不能双击 `index.html`。**

原因：`main.js` 是 ES Module，浏览器对 `file://` 协议下的模块加载有安全限制，直接双击会导致 3D 场景和筛选功能失效。

```bash
# 需要 Node.js
node serve.js 8931
# 然后浏览器打开 http://127.0.0.1:8931

# 或者用 Python
python -m http.server 8931
```

## 部署到 GitHub Pages

1. 在 GitHub 新建仓库（免费账户需选 **Public**）
2. 把本目录**除 `_tools/` 外**的所有文件上传（`lib/` 整个目录也要传）
3. 仓库 **Settings → Pages** → Source 选 `Deploy from a branch` → Branch 选 `main` + `/ (root)` → **Save**
4. 等 1～10 分钟，访问 `https://你的用户名.github.io/仓库名/`

> `lib/` 里的 Three.js 是本地文件，部署后**不依赖任何国外 CDN**，国内访问更快也更稳。

## 怎么改成你自己的

| 想改什么 | 改哪里 |
|---|---|
| 配色 | `style.css` 顶部 `:root` 里的变量 |
| 案例内容 | `index.html` 里 `<article class="case" data-stack="...">` 区块 |
| 技术栈筛选按钮 | `index.html` 的 `.filter-bar`，`data-filter` 值要和卡片的 `data-stack` 对得上 |
| Hero 3D 效果 | `main.js` 的 `initHero()`，几何体、颜色、旋转速度都在里面 |
| 去掉入场动画 | 删掉卡片上的 `reveal` 类即可 |

## 内容来源与核实

- **19 个案例网址全部于 2026-10-01 实测可访问**（HTTP 200）
- 案例信息整理自公开策展报道（含 Awwwards 评委的公开拆解文章）
- 唯一例外：Cartier 站点对命令行访问返回 403，属奢侈品站的反爬拦截，浏览器可正常打开
- 本站**不转载任何站点的截图与素材**，只提供链接与文字拆解，版权归各原作者所有

## 技术要点

- Three.js **r186**，ES Module + importmap 引入
- Hero 场景：线框二十面体 + 顶点光点 + 外层线框球 + 网格地平线
- 指针视差、滚动联动（相机后退下沉）、离屏自动暂停渲染
- 卡片 3D 倾斜用 CSS 变量驱动，不写内联样式
- 完整的 `prefers-reduced-motion` 降级路径
- 无 JS 时内容依然可见（`.reveal` 只在 `html.js` 下才隐藏）
