import puppeteer, { type Browser, type Page } from 'puppeteer'

const USER_AGENT =
    'Mozilla/5.0 (Linux; Android 10; V1824A Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.186 Mobile Safari/537.36'

const MAX_PAGES = 3

class BrowserPool {
    private browser: Browser | null = null
    private activePages = 0
    private queue: Array<(page: Page) => void> = []

    private async getBrowser(): Promise<Browser> {
        if (!this.browser || !this.browser.connected) {
            this.browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--single-process',
                ],
            })
        }
        return this.browser
    }

    /** 获取一个页面实例，超过并发限制时排队等待 */
    async acquirePage(): Promise<Page> {
        if (this.activePages >= MAX_PAGES) {
            await new Promise<void>(resolve => this.queue.push(() => resolve()))
        }

        this.activePages++
        const browser = await this.getBrowser()
        const page = await browser.newPage()
        await page.setUserAgent(USER_AGENT)
        await page.setViewport({ width: 375, height: 812 })

        return page
    }

    /** 归还页面实例 */
    async releasePage(page: Page) {
        try {
            await page.close()
        } catch {
            // 页面可能已经关闭
        }
        this.activePages--

        if (this.queue.length > 0) {
            const next = this.queue.shift()!
            next(null as any)
        }
    }

    /** 使用页面执行操作，自动获取和释放 */
    async withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
        const page = await this.acquirePage()
        try {
            return await fn(page)
        } finally {
            await this.releasePage(page)
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close()
            this.browser = null
        }
    }
}

export const browserPool = new BrowserPool()
