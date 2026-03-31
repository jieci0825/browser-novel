import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { bookApi } from '@/api'
import type { BookSearchItem } from '@/api/types/book.type'
import { sortByRelevance } from '@/utils/search-relevance'

interface SearchStateCache {
    keyword: string
    results: BookSearchItem[]
    searchDone: boolean
    scrollY: number
}

let stateCache: SearchStateCache | null = null

export function useSearch() {
    const router = useRouter()

    const restoring = !!stateCache
    const keyword = ref(stateCache?.keyword ?? '')
    const results = ref<BookSearchItem[]>(stateCache?.results ?? [])
    const searching = ref(false)
    const searchDone = ref(stateCache?.searchDone ?? false)
    const cachedScrollY = stateCache?.scrollY ?? 0
    let abortCtrl: AbortController | null = null

    stateCache = null

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
        router.push({
            name: 'detail',
            params: { sourceId: book.sourceId, bookId: book.bookId },
        })
    }

    function goBack() {
        router.back()
    }

    onBeforeRouteLeave((to) => {
        if (to.name === 'detail') {
            stateCache = {
                keyword: keyword.value,
                results: results.value,
                searchDone: searchDone.value,
                scrollY: window.scrollY,
            }
        } else {
            stateCache = null
        }
    })

    onMounted(() => {
        if (restoring) {
            nextTick(() => window.scrollTo(0, cachedScrollY))
        }
    })

    onBeforeUnmount(() => {
        abortCtrl?.abort()
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
