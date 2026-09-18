# 宠物时光 API

基础路径：`/api`。请求和响应使用 JSON；上传接口使用 `multipart/form-data`。管理接口通过已有 HttpOnly Session Cookie 认证。

## 通用响应

```json
{ "data": {} }
```

错误响应：

```json
{ "error": "错误说明", "code": "OPTIONAL_CODE" }
```

常用状态码：`200` 成功、`201` 创建成功、`204` 删除成功、`400` 参数错误、`401` 未登录、`403` 无权限、`404` 不存在、`413` 文件过大、`429` 请求过频。

日期使用 `YYYY-MM-DD`，时间使用 ISO 8601。`/api/pets/*` 只能访问当前用户的宠物；资源不属于当前用户时统一返回 `404`。

## 认证

### `POST /auth/register`

```json
{
  "email": "user@example.com",
  "password": "至少 12 位的密码",
  "birthday": "1990-01-01"
}
```

`email`、`password` 必填，`birthday` 可选。密码至少 12 位，只保存哈希。成功创建 Session，返回 `201`：

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

```json
{ "email": "user@example.com", "password": "至少 12 位的密码" }
```

成功返回 `200` 并写入 Session Cookie：

```json
{ "data": { "user": { "id": "user_123", "email": "user@example.com" } } }
```

### `GET /auth/me`

已登录：`{ "data": { "user": User } }`；未登录：`{ "data": { "user": null } }`。

### `PATCH /auth/profile`

```json
{ "birthday": "1990-01-01" }
```

使用 `null` 清除生日。

### `POST /auth/logout`

撤销当前 Session 并清除 Cookie，成功返回 `204`。

## 宠物资料

### Pet 字段

```text
id, userId, name, species, breed, bio, birthday, avatarUrl,
arrivalDate, gender, weight, coat, likes, tags, quote, quoteAuthor,
slug, isPublished, viewCount, createdAt, updatedAt
```

字段规则：

| 字段          | 类型        | 规则                        |
| ------------- | ----------- | --------------------------- |
| `name`        | string      | 必填，1–80 字符             |
| `species`     | string      | `dog`、`cat`、`other`       |
| `breed`       | string/null | 最多 80 字符                |
| `bio`         | string/null | 最多 2000 字符              |
| `birthday`    | string/null | `YYYY-MM-DD`                |
| `arrivalDate` | string/null | `YYYY-MM-DD`                |
| `gender`      | string/null | `male`、`female`、`unknown` |
| `weight`      | string/null | 正数，最多两位小数          |
| `coat`        | string/null | 最多 40 字符                |
| `likes`       | string/null | 最多 120 字符               |
| `tags`        | string[]    | 最多 6 个，每个最多 12 字符 |
| `quote`       | string/null | 最多 200 字符               |
| `quoteAuthor` | string/null | 最多 40 字符                |
| `avatarUrl`   | string/null | 上传接口返回的 URL          |

### `GET /pets`

返回当前用户的宠物列表，成功返回 `200`：

```json
{ "data": [Pet] }
```

### `POST /pets`

请求体是创建所需的 Pet 字段：

```json
{
  "name": "六一",
  "species": "dog",
  "breed": "柴犬",
  "bio": "一只喜欢奔跑的柴犬。",
  "birthday": "2023-05-18",
  "arrivalDate": "2024-08-29",
  "gender": "male",
  "weight": "8.2",
  "coat": "赤色",
  "likes": "晒太阳、鸡肉干",
  "tags": ["温柔", "粘人"],
  "avatarUrl": "/uploads/pets/2026/09/avatar.webp",
  "quote": "有你的每一天，都是值得收藏的回忆。",
  "quoteAuthor": "爱你的家人"
}
```

新建宠物默认 `isPublished: false`，后端生成唯一 `slug`。成功返回 `201` 和完整 `Pet`。

### `GET /pets/:id`

返回完整 Pet。成功返回 `200`。

### `PATCH /pets/:id`

允许提交任意可修改 Pet 字段，字段全部可选。空值可清除可选资料，`name` 不能清空。成功返回 `200` 和更新后的 Pet。

### `DELETE /pets/:id`

删除宠物、回忆及数据库关联记录，成功返回 `204`。已经上传的文件不在此接口删除。

## 图片上传

### `POST /uploads`

权限：当前登录用户。

请求类型：`multipart/form-data`。

```text
file: 图片文件（必填）
kind: avatar | memory（必填）
```

规则：单次一张；支持 JPEG、PNG、WebP、GIF；最大 5 MB；后端使用 `sharp` 校验、压缩并转换为 WebP。文件写入 `/opt/vibe-awards/data/uploads/`，Nginx 将 `/uploads/` 映射为静态目录。

成功响应 `201`：

```json
{
  "data": {
    "url": "/uploads/pets/2026/09/uuid.webp",
    "kind": "memory",
    "width": 1600,
    "height": 1200,
    "mimeType": "image/webp",
    "size": 182034
  }
}
```

前端必须先调用此接口，拿到 `url` 后再创建或更新宠物、回忆：头像写入 `avatarUrl`，回忆图片写入 `photoUrl`。上传记录需关联当前 `userId` 和 `kind`；后端在保存 `avatarUrl` 或 `photoUrl` 时，必须校验该 URL 属于当前用户且类型匹配，避免引用他人的临时上传文件。

第一版不提供独立媒体库或媒体删除接口；删除宠物或回忆时保留已上传文件。

## 成长记录

### Memory 字段

```text
id, petId, title, date, text, photoUrl, createdAt, updatedAt
```

每篇回忆最多一张图片，`photoUrl` 可以为空。

### `GET /pets/:id/memories`

按 `date DESC NULLS LAST, createdAt DESC` 返回：

```json
{ "data": [Memory] }
```

### `POST /pets/:id/memories`

```json
{
  "title": "第一次见面",
  "date": "2024-08-29",
  "text": "故事从这一天开始。",
  "photoUrl": "/uploads/pets/2026/09/memory.webp"
}
```

`title` 必填，1–80 字符；`date`、`text`、`photoUrl` 可选；`text` 最多 4000 字符。成功返回 `201` 和完整 Memory。

### `GET /pets/:id/memories/:memoryId`

返回当前用户的单条 Memory，成功返回 `200`。

### `PATCH /pets/:id/memories/:memoryId`

与创建请求使用相同字段，全部可选。可以通过新的 `photoUrl` 替换图片引用；旧文件保留。成功返回 `200`。

### `DELETE /pets/:id/memories/:memoryId`

删除数据库中的回忆记录，已上传图片文件保留，成功返回 `204`。

## 分享名片

### `PATCH /pets/:id/sharing`

```json
{ "isPublished": true }
```

第一版只使用永久分享链接，不使用访问密码。成功返回：

```json
{
  "data": {
    "id": "pet_123",
    "slug": "liuyi-abc123",
    "isPublished": true,
    "shareUrl": "https://wssb.site/p/liuyi-abc123"
  }
}
```

### `GET /public/pets/:slug`

不要求登录，只允许访问 `isPublished: true` 的宠物。分享链接永久有效；未发布或不存在返回 `404`。

返回公开 Pet 资料及回忆：

```json
{
  "data": {
    "id": "pet_123",
    "name": "六一",
    "species": "dog",
    "breed": "柴犬",
    "bio": "一只喜欢奔跑的柴犬。",
    "birthday": "2023-05-18",
    "arrivalDate": "2024-08-29",
    "gender": "male",
    "weight": "8.2",
    "coat": "赤色",
    "likes": "晒太阳、鸡肉干",
    "tags": ["温柔", "粘人"],
    "quote": "有你的每一天，都是值得收藏的回忆。",
    "quoteAuthor": "爱你的家人",
    "avatarUrl": "/uploads/pets/avatar.webp",
    "slug": "liuyi-abc123",
    "viewCount": 28,
    "memories": [
      {
        "id": "memory_123",
        "petId": "pet_123",
        "title": "第一次见面",
        "date": "2024-08-29",
        "text": "故事从这一天开始。",
        "photoUrl": "/uploads/pets/2026/09/memory.webp"
      }
    ]
  }
}
```

二维码由前端根据 `https://wssb.site/p/{slug}` 使用 `qrcode` 包生成，不需要二维码接口。
