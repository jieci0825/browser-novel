import axios, {
    type AxiosInstance,
    type AxiosRequestConfig,
    type AxiosResponse,
    type InternalAxiosRequestConfig,
} from 'axios'

export interface ApiResponse<T = unknown> {
    errorCode: number
    message: string
    traceId: string
    data: T | null
}

const instance: AxiosInstance = axios.create({
    baseURL: '/api',
    timeout: 15_000,
})

instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        return config
    },
    (error) => Promise.reject(error)
)

instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
        const { data } = response

        if (data.errorCode !== 0) {
            return Promise.reject(new Error(data.message || '请求失败'))
        }

        return response
    },
    (error) => {
        const message =
            error.response?.data?.message || error.message || '网络异常'
        return Promise.reject(new Error(message))
    }
)

function request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
    return instance
        .request<ApiResponse<T>>(config)
        .then((res) => res.data.data as T)
}

request.instance = instance

export default request
