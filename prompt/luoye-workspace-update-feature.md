# 落页文档工作区修改功能

## 功能说明

文档现在支持修改所属的工作区，可以将文档从一个工作区移动到另一个工作区。

## API 接口

**接口**：`PUT /luoye/doc/:docId`

**新增参数**：

```typescript
{
    workspaces?: string[];  // 所属工作区 ID（数组格式，但目前仅支持单个工作区）
}
```

## 使用示例

### 移动文档到其他工作区

```javascript
// 将文档从当前工作区移动到 workspace-b
await axios.put(`/luoye/doc/${docId}`, {
    workspaces: ['workspace-b'],
});
```

### 同时更新文档内容和工作区

```javascript
await axios.put(`/luoye/doc/${docId}`, {
    name: '更新后的文档名称',
    content: '更新的内容',
    workspaces: ['workspace-c'],
});
```

## 校验规则

-   ✅ 必须是包含单个工作区 ID 的数组
-   ✅ 工作区必须存在
-   ✅ 用户需要对目标工作区有 Member 权限

## 自动同步

修改工作区时，系统自动：

-   从原工作区的文档列表中移除该文档
-   向新工作区的文档列表中添加该文档
-   更新相关用户的文档列表

## 注意事项

-   文档必须属于一个工作区
-   `workspaces` 参数可选，不提供则保持不变
-   完整测试用例见 `server/modules/luoye/tests/doc.js`
