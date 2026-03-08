# Error Code

## 约定

- `1xxx`：参数与请求错误
- `2xxx`：书源业务错误
- `5xxx`：系统内部错误

## 错误码列表

| errorCode | 名称 | HTTP 状态码 | 说明 |
| --- | --- | --- | --- |
| `1001` | `INVALID_PARAMS` | `400` | 请求参数不合法或缺失 |
| `2001` | `SOURCE_NOT_FOUND` | `404` | 指定书源不存在 |
| `2002` | `SOURCE_UNAVAILABLE` | `502` | 书源服务不可用或返回异常 |
| `2003` | `SOURCE_TIMEOUT` | `504` | 书源请求超时 |
| `5000` | `INTERNAL_EXCEPTION` | `500` | 未知系统异常 |

## 响应示例

```json
{
    "errorCode": 2003,
    "message": "书源 \"huanxiang\" 请求超时",
    "traceId": "8b5f5fe8-818f-4de0-9f36-6f0138a8bf43",
    "data": null
}
```
