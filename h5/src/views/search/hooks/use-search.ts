import { ref, onActivated, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { bookApi } from '@/api'
import type { BookSearchItem } from '@/api/types/book.type'
import { sortByRelevance } from '@/utils/search-relevance'

const SCROLL_KEY = 'search-scroll-position'
const FROM_DETAIL_KEY = 'search-from-detail'

export function useSearch() {
    const router = useRouter()
    const keyword = ref('')
    const results = ref<BookSearchItem[]>([])
    const searching = ref(false)
    const searchDone = ref(false)
    let abortCtrl: AbortController | null = null

    async function doSearch() {
        const kw = keyword.value.trim()
        if (!kw) return

        abortCtrl?.abort()
        abortCtrl = new AbortController()

        results.value = []
        searching.value = true
        searchDone.value = false

        try {
            await bookApi.searchAll(
                kw,
                (event) => {
                    if (event.type === 'result') {
                        const items = event.items.map((item) => ({
                            ...item,
                            sourceName: item.sourceName || event.sourceName,
                        }))
                        const merged = [...results.value, ...items]
                        sortByRelevance(merged, kw)
                        results.value = merged
                    }
                },
                abortCtrl.signal,
            )
        } catch (e) {
            if ((e as Error).name === 'AbortError') return
        } finally {
            searching.value = false
            searchDone.value = true
        }
    }

    function goToDetail(book: BookSearchItem) {
        sessionStorage.setItem(FROM_DETAIL_KEY, '1')
        sessionStorage.setItem(SCROLL_KEY, String(window.scrollY))
        router.push({
            name: 'detail',
            params: { sourceId: book.sourceId, bookId: book.bookId },
        })
    }

    function goBack() {
        router.back()
    }

    onActivated(() => {
        const fromDetail = sessionStorage.getItem(FROM_DETAIL_KEY)
        if (fromDetail) {
            sessionStorage.removeItem(FROM_DETAIL_KEY)
            const scrollY = Number(sessionStorage.getItem(SCROLL_KEY) || 0)
            sessionStorage.removeItem(SCROLL_KEY)
            nextTick(() => window.scrollTo(0, scrollY))
        }
    })

    return {
        keyword,
        results,
        searching,
        searchDone,
        doSearch,
        goToDetail,
        goBack,
    }
}
