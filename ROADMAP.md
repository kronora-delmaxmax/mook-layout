# 做杂志 · 产品待办清单

## iOS 原生封装（Capacitor）

### Live Photo 双向打通（原生独占卖点）
- [ ] **输入**：PHPickerViewController 原生插件，`.livePhotos` 过滤器读取 Live Photo 动态部分（无需相册权限，工程量约 1-2 天）
- [ ] **输出**：导出 Live Photo——用相册框架写入配对资产（`PHAssetCreationRequest` 同时写入封面帧照片资源 + 配对视频资源，两者带相同 Content Identifier）。封面帧取导出视频第一帧，工程量约 1-2 天
- [ ] 导出按钮按平台自动切换：网页端出 MP4，iOS App 出 Live Photo
- [ ] **社媒直发深链**：`instagram-stories://` 直跳 IG Story 编辑器并带入导出图（对标 Unfold/Canva 的平台专属分享按钮）；可评估接入小红书原生分享 SDK。背景：系统分享面板有没有某个 App 取决于对方是否注册分享扩展——小红书有、Instagram 没有，所以网页端只能走「存储图像→IG 发帖」两步，直发必须原生
- 背景：网页端无法创建 Live Photo（Apple 配对元数据 + 相册写入权限不开放给浏览器），当前网页用户可用 intoLive 等 App 手动转换

### 社媒分享升级（原生 SDK，对标 Unfold/Canva）
- [ ] Instagram Share to Stories SDK：直跳 IG Story 编辑页（图自动贴入），比系统分享面板少两步
- [ ] 小红书分享 SDK：原生可申请接入，分享面板出现小红书图标直跳发布页（国内优先级高于 IG）
- [ ] Canva 式账号直连发布（Meta 开发者审核，工程量大，等有用户量再评估，优先级最低）
- 背景：竞品（Canva/Unfold/CapCut/醒图）的专属社媒按钮全部是原生 App + 官方 SDK；IG 与小红书的分享接口均不对网页开放，网页端系统分享面板（现方案）已是最优解

### 上架与合规
- [ ] localStorage 迁移到 Capacitor Preferences（草稿、Pro 标记、试用计数）
- [ ] IAP 真接入（StoreKit 替换现在的 `PRO.grant()` 模拟解锁，买断制 ¥38）
- [ ] 隐私政策页（AI 识别为端侧本地推理，数据不出设备——卖点）
- [ ] 国区：ICP 备案（2-4 周，最长前置项，尽早启动）
- [ ] 日区：特商法表记（付费时需要）；可利用 MSCA 新政（2025.12.18 生效）接第三方支付降抽成

## 内容能力
- [ ] 中日韩三语化（先日文）：Noto Serif JP/KR 按需加载（各约 6MB）、文案抽取、AI prompt 三语化
- [ ] 视频理解云端 API（Pro 增值）：识别视频内容自动配文，替代现在的静帧识别
- [ ] 动图杂志三层级路线：Ken Burns 视频导出（已做）→ 真动图输入 → 交互式

## 真机验证清单
- [ ] AI 识别 / 抠图在 iPhone（Pages 部署）上的表现（沙箱 Chromium 150 上 ORT 会话创建卡死为环境问题，需真机对照）
- [ ] 微信内置浏览器（X5 内核）兼容性
- [ ] 键盘弹出时的版面遮挡
- [ ] 「分享到 Instagram」在 iOS 系统分享面板的实际体验
