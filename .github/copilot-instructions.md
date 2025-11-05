# freesia - AI Coding Agent Instructions

## Project Overview

这是一个基于 Next.js 14 的个人博客项目，使用 App Router，核心应用是「落页」—— 一个在线文档编辑工具。后端服务部署在 `https://blog.talaxy.cn/api/`，通过 Next.js rewrites 代理 API 请求。

## AI Agent Guidelines

**专注于代码实现**：

-   优先实现功能代码或修复缺陷
-   **不要**主动生成文档、README、注释或说明文件（除非用户明确要求）
-   **不要**主动编写单元测试或测试文件（除非用户明确要求）
-   直接执行用户的需求，避免过度设计或添加用户未要求的内容

## Architecture & Key Patterns

### 1. API 层设计（Rocket Pattern）

项目使用自定义的 API 定义模式，将 API 调用拆分为**定义**和**执行**两个阶段：

```typescript
// app/api/luoye.ts - API 定义层，返回 API 对象而非直接请求
const LuoyeAPI = {
    doc: (id: string) => Rocket.get<Doc>(`${API_PREFIX}/luoye/doc/${id}`),
};

// app/api/fetch/client.ts - 客户端执行
await clientFetch(API.luoye.doc('123'));

// app/api/fetch/server.ts - 服务端执行（带缓存）
await serverFetch(API.luoye.doc('123'));
```

-   **重要**：新增 API 时在 `app/api/luoye.ts` 或 `app/api/user.ts` 中定义，使用 `Rocket.get/post/put/delete`
-   Server Components 使用 `serverFetch`（默认开启 React cache），Client Components 使用 `clientFetch`
-   `serverFetch` 的第二个参数 `ignoreError: true` 可在请求失败时返回 `null` 而非抛出异常

### 2. 路径处理（basePath）

项目配置了 `basePath: '/freesia'`，所有路径需要通过 `Path` 工具类处理：

```typescript
// app/utils/Path.ts
Path.of('/luoye/doc/123'); // → '/freesia/luoye/doc/123'
Path.static('/logo.png'); // → '/freesia/logo.png'
```

-   **始终使用** `Path.of()` 或 `Path.static()` 构建内部链接
-   图标、静态资源路径也需要用 `Path.static()` 包装
-   tsconfig 配置了 `@/*` 别名指向 `app/*`

### 3. 客户端状态持久化（useHydrationState）

项目有独特的客户端状态同步机制，用于在 SSR 和 CSR 之间保持状态一致：

```typescript
// 在 Context Provider 中使用
const [doc, setDoc] = useHydrationState<Doc | null>(_doc, `doc-${docId}`);
```

-   **用途**：防止页面导航时展示旧数据（见 CHANGELOG v1.0.1）
-   **场景**：在 Context Provider 中管理从服务端传入的初始数据
-   **原理**：使用 Map 跨渲染周期缓存客户端状态

### 4. Next.js App Router 模式

项目充分利用 Next.js 14 的 App Router 特性：

```
app/
  (apps)/luoye/          # 路由组，不影响 URL
    layout.tsx           # Server Component，负责数据预取
    (home)/              # 嵌套路由组
      context.tsx        # Client Context Provider
      layout.tsx         # 包装 Context
```

-   **Server Component 职责**：数据预取、SEO metadata、初始状态准备
-   **Client Component 职责**：交互逻辑、状态管理（需标记 `'use client'`）
-   **Context 传递模式**：Server Layout → 预取数据 → Context Provider → Client Components
-   **并行数据请求**：使用 `Promise.all()` 或 React `cache()` 优化性能（如 `app/(apps)/luoye/doc/[docId]/cache.tsx`）

### 5. 样式组织

-   **CSS Modules**：用 `.module.css` 后缀，按组件或页面模块化
-   **全局样式**：`app/(apps)/luoye/styles/index.css` 定义 CSS 变量
-   **styled-components**：仅用于动态主题切换（如 `EditingModeGlobalStyle.tsx`）
-   **Tailwind**：辅助工具类，主要样式仍用 CSS Modules

### 6. Monaco Editor 集成

编辑器配置高度定制化（`app/(apps)/luoye/components/Editor/configs/monaco.ts`）：

-   禁用了所有自动补全和建议功能（`quickSuggestions`, `parameterHints` 等）
-   自定义 token 主题（`MONACO_TOKEN_CONFIG`）和配色（`MONACO_COLOR_CONFIG`）
-   配色需与 CSS 变量同步（见注释）

## Development Workflow

```bash
npm run dev      # 开发服务器（localhost:3000）
npm run build    # 生产构建
npm start        # 构建后启动服务器
npm run lint     # ESLint 检查
```

## Release Process

按照 README.md 中的流程：

1. 更新 `package.json` 版本号
2. 更新 `CHANGELOG.md` 和 `README.md`
3. 以 `Release vX.Y.Z` 提交至 main
4. 打标签 `vX.Y.Z`
5. 推送并发布 GitHub Release

## Common Gotchas

-   **API 请求**：不要直接用 `fetch`，使用 `clientFetch` 或 `serverFetch`
-   **路径引用**：记得加 basePath，使用 `Path.of()`
-   **'use client' 标记**：交互组件、hooks、Context 都需要
-   **服务端日志**：`Logger` 工具类用于统一日志格式（middleware.ts 和 server.ts）
-   **权限检查**：使用 `checkAuth` 工具函数（`app/(apps)/luoye/configs/index.ts`）
