# YIN · 个人主页

深色科技风个人主页，Hero 区带「鼠标 spotlight reveal」交互：默认显示第一张肖像，鼠标移动时通过圆形渐变遮罩在局部显示第二张肖像。

## 快速开始

直接用浏览器打开 `index.html`，或在项目目录启动本地服务：

```bash
python3 -m http.server 8080
# 打开 http://localhost:8080
```

## 线上发布

- 线上地址：<https://1660536805-spec.github.io/>
- 托管：GitHub Pages（仓库 `1660536805-spec/1660536805-spec.github.io`）
- SEO：`robots.txt` + `sitemap.xml` + Open Graph / canonical 已配置；
  `c4c8d6af-4b47-4e9d-a277-b595b90eaad8.txt` 为 IndexNow 收录密钥。
- 自定义域名：当前 `leo.yin.com` 不可用（`yin.com` 已被他人注册），
  可注册 `leo-yin.com` 等可用域名后，在仓库根目录添加
  `CNAME` 文件（内容为域名）并在域名服务商配置 CNAME 指向
  `1660536805-spec.github.io`。

## 文件结构

```text
.
├── index.html        # 页面结构（导航 / Hero / 关于 / 技能 / 作品 / 联系）
├── css/style.css     # 深色红橙渐变主题 + 响应式
├── js/main.js        # spotlight reveal、平滑跟随、移动端导航、滚动动画
└── assets/
    ├── img-default.jpg   # 第一张图（默认显示）
    └── img-reveal.jpg    # 第二张图（鼠标遮罩显示）
```

## reveal 效果实现说明

- 两张图已统一裁剪为完全相同的尺寸与宽高比（1000×2222，9:20），使用同样的
  `background-size: cover; background-position: center`，reveal 时不会错位。
- 交互逻辑在 `js/main.js`：
  1. `pointermove` 记录鼠标相对人像卡的位置；
  2. `requestAnimationFrame` 循环中用指数缓动做平滑跟随；
  3. 位置与透明度写入 CSS 变量（`--spot-x` / `--spot-y` / `--spot-alpha`）；
  4. reveal 层使用 `mask-image: radial-gradient(circle at var(--spot-x) ...)`
     原生渐变遮罩，中心不透明、边缘渐隐，`mask-size: 100% 100%`；
     相比逐帧 `canvas.toDataURL()`，零 base64 开销，浏览器里更丝滑；
  5. 鼠标移出人像卡后遮罩柔和淡出。
- 仅在没有 hover 能力的触屏设备上默认只显示第一张图，点击人像可短暂窥视第二张；
  桌面窗口无论多窄都保留鼠标交互（避免内嵌浏览器/窄窗口被误判成移动端）。

## 个性化修改

把下面的内容替换成你自己的信息即可：

- `index.html`：导航品牌 `YIN`、Hero 文案、关于我的介绍、作品卡片、
  联系邮箱 `hello@yin.dev`、GitHub / 微信链接。
- 作品区（`#works`）：4 张卡片已按真实项目写好介绍与技术标签，
  卡片上的 GitHub 链接目前是占位符 `https://github.com/你的用户名/...`，
  把 `你的用户名` 与仓库名替换成真实地址即可（页面里也标了 `TODO` 注释）。
  其中「调解服务受理平台」与「TeamAI Hub」的封面使用了真实产品截图
  （`assets/works/gesture-cursor.jpg`、`assets/works/mediation-home.png`、
  `assets/works/teamai-hub-v2.jpg`、`assets/works/portfolio-site.jpg`），
  替换图片时保持同名覆盖即可。
- `assets/img-default.jpg` 与 `assets/img-reveal.jpg`：替换为你的两张照片
  （保持相同的宽高比，替换后错位风险最小；如用不同比例的照片，建议先统一裁剪）。
- `css/style.css`：`:root` 中的 `--accent-1/2/3` 可调整主题色。
