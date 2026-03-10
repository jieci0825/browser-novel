export enum ErrorCode {
    // 1xxx: 参数与请求错误
    INVALID_PARAMS = 1001,

    // 2xxx: 书源相关错误
    SOURCE_NOT_FOUND = 2001,
    SOURCE_UNAVAILABLE = 2002,
    SOURCE_TIMEOUT = 2003,

    // 4xxx: 访问限制
    RATE_LIMITED = 4001,

    // 5xxx: 系统内部错误
    INTERNAL_EXCEPTION = 5000,
}
