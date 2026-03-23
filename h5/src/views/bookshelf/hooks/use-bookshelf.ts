import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
    getBookshelfWithProgress,
    removeFromBookshelf,
} from '@/database/services/bookshelf-service'
import { getStorage, setStorage } from '@/utils/storeage'
import { STORAGE_KEY } from '@/constants/storage-key'
import { bookApi } from '@/api'
import type { Book } from '../book'

export type BookshelfLayout = 'grid' | 'list'

function getBookKey(book: Book) {
    return `${book.sourceId}-${book.bookId}`
}

export function useBookshelf() {
    const router = useRouter()
    const books = ref<Book[]>([])
    const loading = ref(true)
    const layout = ref<BookshelfLayout>(
        getStorage<BookshelfLayout>(STORAGE_KEY.bookshelfLayout) || 'grid'
    )
    const editMode = ref(false)
    const selectedKeys = ref(new Set<string>())

    const selectedCount = computed(() => selectedKeys.value.size)
    const allSelected = computed(
        () =>
            books.value.length > 0 &&
            selectedKeys.value.size === books.value.length
    )

    async function fetchBooks() {
        loading.value = true
        try {
            books.value = await getBookshelfWithProgress()
        } finally {
            loading.value = false
        }
    }

    function toggleLayout() {
        layout.value = layout.value === 'grid' ? 'list' : 'grid'
        setStorage(STORAGE_KEY.bookshelfLayout, layout.value)
    }

    function enterEditMode() {
        editMode.value = true
        selectedKeys.value = new Set()
    }

    function exitEditMode() {
        editMode.value = false
        selectedKeys.value = new Set()
    }

    function toggleSelect(book: Book) {
        const key = getBookKey(book)
        const next = new Set(selectedKeys.value)
        if (next.has(key)) {
            next.delete(key)
        } else {
            next.add(key)
        }
        selectedKeys.value = next
    }

    function toggleSelectAll() {
        if (allSelected.value) {
            selectedKeys.value = new Set()
        } else {
            selectedKeys.value = new Set(books.value.map(getBookKey))
        }
    }

    async function deleteSelected() {
        const toDelete = books.value.filter(b =>
            selectedKeys.value.has(getBookKey(b))
        )
        if (!toDelete.length) return

        await Promise.all(
            toDelete.map(b => removeFromBookshelf(b.sourceId, b.bookId))
        )
        selectedKeys.value = new Set()
        editMode.value = false
        await fetchBooks()
    }

    async function handleBookClick(book: Book) {
        if (editMode.value) {
            toggleSelect(book)
            return
        }

        if (book.lastReadChapterId) {
            router.push({
                name: 'read',
                params: {
                    sourceId: book.sourceId,
                    bookId: book.bookId,
                    chapterId: book.lastReadChapterId,
                },
            })
            return
        }

        try {
            const chapters = await bookApi.getChapters(
                book.sourceId,
                book.bookId
            )
            if (!chapters.length) return

            router.push({
                name: 'read',
                params: {
                    sourceId: book.sourceId,
                    bookId: book.bookId,
                    chapterId: chapters[0]!.chapterId,
                },
            })
        } catch {
            // 获取章节失败，静默处理
        }
    }

    function goToSearch() {
        router.push('/search')
    }

    onMounted(fetchBooks)

    return {
        books,
        loading,
        layout,
        editMode,
        selectedKeys,
        selectedCount,
        allSelected,
        fetchBooks,
        toggleLayout,
        enterEditMode,
        exitEditMode,
        toggleSelect,
        toggleSelectAll,
        deleteSelected,
        handleBookClick,
        goToSearch,
    }
}
