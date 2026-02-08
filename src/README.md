# Vaultly 源码目录说明

采用**分层架构**，便于大型项目扩展与团队协作。

## 目录结构

```
src/
├── main.ts                 # 应用入口
├── app.module.ts           # 根模块
│
├── core/                   # 核心层：请求/响应管道、异常、统一约定
│   ├── constants/          # 全局常量（如 ResultCode）
│   ├── dto/                # 统一响应 DTO（ApiResultDto 等）
│   ├── interfaces/         # 通用类型（ApiResult、PaginatedData）
│   ├── filters/            # 全局异常过滤器
│   ├── interceptors/       # 全局拦截器（Result 包装）
│   ├── decorators/         # Swagger/业务装饰器
│   └── core.module.ts
│
├── config/                 # 配置层
│   └── swagger.config.ts   # Swagger 文档配置
│
├── modules/                # 业务模块（按领域划分）
│   ├── user/
│   ├── token/
│   ├── item/
│   ├── device/
│   ├── audit-log/
│   └── share-link/
│
└── infrastructure/         # 基础设施层：数据库、外部服务
    └── database/           # Prisma 数据访问
        ├── prisma.module.ts
        └── prisma.service.ts
```

## 分层职责

| 层级 | 职责 | 依赖方向 |
|------|------|----------|
| **core** | 与业务无关的横切能力：统一响应格式、异常处理、Swagger 装饰器 | 不依赖 modules |
| **config** | 应用配置（环境、Swagger、特性开关等） | 可被 main / core 使用 |
| **modules** | 业务逻辑、领域能力 | 可依赖 core、infrastructure |
| **infrastructure** | 技术实现：数据库、缓存、消息队列、第三方 API | 不依赖 modules |

## 引用路径（tsconfig paths）

- `@/core` → `src/core`
- `@/config` → `src/config`
- `@/modules/*` → `src/modules/*`
- `@/infrastructure/*` → `src/infrastructure/*`
- `@/generated/*` → `src/generated/*`（如 Prisma Client）

## 扩展建议

- 新增业务：在 `modules/` 下新建领域模块。
- 新增数据源/外部服务：在 `infrastructure/` 下新建子目录（如 `cache/`、`queue/`）。
- 新增全局管道（守卫、拦截器、管道）：放在 `core/` 对应子目录。
- 新增环境或文档配置：放在 `config/`。
