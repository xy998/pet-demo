# 宠物时光 API 文档

基础路径：`/api`  
数据格式：`application/json; charset=utf-8`  
认证方式：服务端 Session + HttpOnly Cookie

前端会在每个请求中携带 Cookie。除公开名片接口外，所有接口都必须验证当前 Session。

## 通用约定

成功响应：

```json
{
  "data": {}
}
```

失败响应：

```json
{
  "error": "错误说明",
  "code": "OPTIONAL_ERROR_CODE"
}
```

常用状态码：

| 状态码 | 含义 |
| --- | --- |
| `200` | 请求成功 |
| `201` | 创建成功 |
| `204` | 删除成功，无响应体 |
| `400` | 请求字段不合法 |
| `401` | 未登录或 Session 已失效 |
| `403` | 无操作权限或密码名片尚未解锁 |
| `404` | 资源不存在，或不属于当前用户 |
| `409` | 唯一字段冲突，如邮箱已注册、slug 已存在 |
| `413` | 上传文件超过限制 |
| `429` | 请求频率过高 |

日期字段使用 `YYYY-MM-DD`，时间字段使用 ISO 8601 UTC，例如 `2026-09-18T08:00:00.000Z`。

## 数据对象

### User

```json
{
  "id": "user_123",
  "email": "user@example.com",
  "birthday": "1990-01-01",
  "createdAt": "2026-09-18T08:00:00.000Z",
  "updatedAt": "2026-09-18T08:00:00.000Z"
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 用户唯一 ID |
| `email` | string | 唯一邮箱，统一使用小写存储 |
| `birthday` | string \| null | 用户生日 |
| `createdAt` | string | 创建时间 |
| `updatedAt` | string | 更新时间 |

### Pet

```json
{
  "id": "pet_123",
  "name": "六一",
  "species": "dog",
  "breed": "柴犬",
  "bio": "一只喜欢奔跑的柴犬。",
  "birthday": "2023-05-18",
  "avatarUrl": "https://wssb.site/uploads/pets/avatar.webp",
  "slug": "liuyi-abc123",
  "visibility": "PUBLIC",
  "isPublished": true,
  "viewCount": 28,
  "createdAt": "2026-09-18T08:00:00.000Z",
  "updatedAt": "2026-09-18T08:00:00.000Z"
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 宠物唯一 ID |
| `name` | string | 1–80 字符 |
| `species` | string | `dog`、`cat`、`other` |
| `breed` | string \| null | 品种，最多 80 字符 |
| `bio` | string \| null | 简介，最多 2000 字符 |
| `birthday` | string \| null | 宠物生日 |
| `avatarUrl` | string \| null | 头像 URL |
| `slug` | string | 公开链接唯一标识 |
| `visibility` | string | `PUBLIC` 或 `PASSWORD` |
| `isPublished` | boolean | 是否允许访客访问 |
| `viewCount` | number | 公开名片查看次数 |

### Memory

```json
{
  "id": "memory_123",
  "title": "第一次见面",
  "date": "2024-08-29",
  "text": "故事从这一天开始。",
  "photos": [
    {
      "id": "media_123",
      "url": "https://wssb.site/uploads/pets/memory.webp",
      "sort": 0
    }
  ],
  "createdAt": "2026-09-18T08:00:00.000Z",
  "updatedAt": "2026-09-18T08:00:00.000Z"
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 回忆唯一 ID |
| `title` | string | 1–120 字符 |
| `date` | string \| null | 发生日期 |
| `text` | string | 最多 5000 字符 |
| `photos` | Media[] | 最多 3 张，数组顺序即展示顺序 |

### Media

```json
{
  "id": "media_123",
  "url": "https://wssb.site/uploads/pets/uuid.webp",
  "width": 1600,
  "height": 1200,
  "mimeType": "image/webp",
  "size": 182034,
  "sort": 0
}
```

## 认证接口

### `POST /auth/register`

创建普通用户，并写入登录 Session Cookie。

请求：

```json
{
  "email": "user@example.com",
  "password": "at-least-12-characters",
  "birthday": "1990-01-01"
}
```

| 字段 | 必填 | 规则 |
| --- | ---: | --- |
| `email` | 是 | 合法邮箱，唯一 |
| `password` | 是 | 至少 12 位，后端只保存哈希 |
| `birthday` | 否 | `YYYY-MM-DD` |

成功响应：`201`

```json
{
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "birthday": "1990-01-01"
    }
  }
}
```

### `POST /auth/login`

请求：

```json
{
  "email": "user@example.com",
  "password": "at-least-12-characters"
}
```

成功响应：`200`

```json
{
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com"
    }
  }
}
```

### `GET /auth/me`

成功响应：`200`

```json
{
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "birthday": "1990-01-01"
    }
  }
}
```

未登录时同样返回 `200`：

```json
{
  "data": {
    "user": null
  }
}
```

### `PATCH /auth/profile`

请求：

```json
{
  "birthday": "1990-01-01"
}
```

使用 `null` 清除生日。

### `POST /auth/logout`

撤销当前 Session 并清除 Cookie。

成功响应：`204`

## 宠物管理接口

### `GET /pets`

返回当前用户拥有的宠物。列表不返回回忆正文。

成功响应：`200`

```json
{
  "data": [
    {
      "id": "pet_123",
      "name": "六一",
      "species": "dog",
      "breed": "柴犬",
      "avatarUrl": "https://wssb.site/uploads/pets/avatar.webp",
      "slug": "liuyi-abc123",
      "visibility": "PUBLIC",
      "isPublished": true,
      "viewCount": 28,
      "createdAt": "2026-09-18T08:00:00.000Z",
      "updatedAt": "2026-09-18T08:00:00.000Z"
    }
  ]
}
```

### `POST /pets`

请求：

```json
{
  "name": "六一",
  "species": "dog",
  "breed": "柴犬",
  "bio": "一只喜欢奔跑的柴犬。",
  "birthday": "2023-05-18",
  "avatarUrl": "https://wssb.site/uploads/pets/avatar.webp"
}
```

`name` 和 `species` 必填。新建宠物默认 `isPublished: false`，后端生成唯一 `slug`。

成功响应：`201`，返回完整 `Pet` 对象。

### `GET /pets/:id`

返回当前用户拥有的完整 `Pet` 对象。资源不属于当前用户时返回 `404`。

### `PATCH /pets/:id`

允许提交 `Pet` 对象中的以下可修改字段：

```json
{
  "name": "六一",
  "species": "dog",
  "breed": "柴犬",
  "bio": "一只喜欢奔跑的柴犬。",
  "birthday": "2023-05-18",
  "avatarUrl": "https://wssb.site/uploads/pets/avatar.webp",
  "isPublished": true
}
```

字段均可选。空字符串由后端转换为 `null` 或拒绝，规则需统一：建议 `breed`、`bio`、`birthday`、`avatarUrl` 可清空，`name` 不可清空。

成功响应：`200`，返回完整更新后的 `Pet`。

### `DELETE /pets/:id`

删除宠物、其回忆和关联媒体记录。

成功响应：`204`。

## 图片上传接口

### `POST /pets/:id/media`

请求类型：`multipart/form-data`

| 字段 | 必填 | 说明 |
| --- | ---: | --- |
| `file` | 是 | JPEG、PNG 或 WebP 图片 |
| `kind` | 是 | `avatar` 或 `memory` |

成功响应：`201`

```json
{
  "data": {
    "id": "media_123",
    "url": "https://wssb.site/uploads/pets/uuid.webp",
    "width": 1600,
    "height": 1200,
    "mimeType": "image/webp",
    "size": 182034
  }
}
```

后端规则：

- 单文件最大 5 MB。
- 验证文件真实类型，不能只相信浏览器的 MIME 字段。
- 用 `sharp` 压缩和转换为 WebP，必要时生成缩略图。
- 上传目标宠物必须属于当前用户。
- 密码保护名片的图片不能直接暴露永久公开 URL。

### `DELETE /pets/:id/media/:mediaId`

删除未被头像或回忆引用的媒体资源。若仍被引用，返回 `409`。

成功响应：`204`。

## 回忆接口

### `GET /pets/:id/memories`

返回当前用户该宠物的回忆，按 `date DESC, createdAt DESC` 排序。

成功响应：`200`

```json
{
  "data": [
    {
      "id": "memory_123",
      "title": "第一次见面",
      "date": "2024-08-29",
      "text": "故事从这一天开始。",
      "photos": [
        {
          "id": "media_123",
          "url": "https://wssb.site/uploads/pets/memory.webp",
          "sort": 0
        }
      ],
      "createdAt": "2026-09-18T08:00:00.000Z",
      "updatedAt": "2026-09-18T08:00:00.000Z"
    }
  ]
}
```

### `POST /pets/:id/memories`

请求：

```json
{
  "title": "第一次见面",
  "date": "2024-08-29",
  "text": "故事从这一天开始。",
  "photoIds": ["media_123", "media_456"]
}
```

| 字段 | 必填 | 规则 |
| --- | ---: | --- |
| `title` | 是 | 1–120 字符 |
| `date` | 否 | `YYYY-MM-DD` |
| `text` | 否 | 最多 5000 字符 |
| `photoIds` | 否 | 最多 3 个，属于当前用户并已上传到该宠物 |

成功响应：`201`，返回完整 `Memory`。

### `PATCH /pets/:id/memories/:memoryId`

请求字段与创建回忆相同，均可部分提交。`photoIds` 的数组顺序就是前端展示顺序。

成功响应：`200`，返回完整更新后的 `Memory`。

### `DELETE /pets/:id/memories/:memoryId`

成功响应：`204`。

删除回忆时建议只删除关联关系；物理图片可通过独立清理任务处理，或调用媒体删除接口。

## 分享设置接口

### `PATCH /pets/:id/sharing`

公开分享：

```json
{
  "visibility": "PUBLIC",
  "isPublished": true
}
```

密码分享：

```json
{
  "visibility": "PASSWORD",
  "isPublished": true,
  "password": "至少 4 位的访问密码"
}
```

| 字段 | 必填 | 说明 |
| --- | ---: | --- |
| `visibility` | 是 | `PUBLIC` 或 `PASSWORD` |
| `isPublished` | 否 | 是否允许外部访问 |
| `password` | `PASSWORD` 时是 | 4–72 UTF-8 字节，只保存哈希 |

空字符串密码表示移除旧密码，仅能在 `PUBLIC` 模式下使用。

成功响应：`200`

```json
{
  "data": {
    "id": "pet_123",
    "slug": "liuyi-abc123",
    "visibility": "PASSWORD",
    "isPublished": true,
    "shareUrl": "https://wssb.site/p/liuyi-abc123"
  }
}
```

修改访问密码后，旧的名片解锁 Cookie 或签名凭证必须立即失效。

## 公开名片接口

### `GET /public/pets/:slug`

适用范围：已发布的公开名片，或已完成密码解锁的名片。

成功响应：`200`

```json
{
  "data": {
    "id": "pet_123",
    "name": "六一",
    "species": "dog",
    "breed": "柴犬",
    "bio": "一只喜欢奔跑的柴犬。",
    "birthday": "2023-05-18",
    "avatarUrl": "https://wssb.site/uploads/pets/avatar.webp",
    "slug": "liuyi-abc123",
    "viewCount": 28,
    "memories": []
  }
}
```

密码名片尚未解锁时返回 `403`：

```json
{
  "error": "该名片需要访问密码",
  "code": "PET_PASSWORD_REQUIRED",
  "data": {
    "name": "六一",
    "slug": "liuyi-abc123",
    "visibility": "PASSWORD"
  }
}
```

未解锁状态不能返回简介、生日、回忆正文或图片地址。

### `POST /public/pets/:slug/unlock`

请求：

```json
{
  "password": "访问密码"
}
```

成功时后端写入仅用于此名片的 HttpOnly Cookie，并返回完整公开名片对象。

成功响应：`200`

```json
{
  "data": {
    "id": "pet_123",
    "name": "六一",
    "memories": []
  }
}
```

密码错误返回 `403`。该接口必须限流，避免暴力猜测。
