import { ref, computed, type Ref } from 'vue'
import type { Book } from '../book'
import { removeFromBookshelf, batchRemoveFromBookshelf } from '@/database/services/bookshelf-service'
import { ElMessage, ElMessageBox } from 'element-plus'

function getBookKey(book: Pick<Book, 'sourceId' | 'bookId'>) {
    return `${book.sourceId}-${book.bookId}`
}

/** 书架管理模式：选择、批量删除、单本删除 */
export function useBookshelfManage(books: Ref<Book[]>) {
    const isManaging = ref(false)
    const selectedKeys = ref(new Set<string>())

    const selectedCount = computed(() => selectedKeys.value.size)
    const isAllSelected = computed(() =>
        books.value.length > 0 && selectedKeys.value.size === books.value.length
    )

    function startManage() {
        isManaging.value = true
    }

    function cancelManage() {
        isManaging.value = false
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
        if (isAllSelected.value) {
            selectedKeys.value = new Set()
        } else {
            selectedKeys.value = new Set(books.value.map(getBookKey))
        }
    }

    function isSelected(book: Book) {
        return selectedKeys.value.has(getBookKey(book))
    }

    async function removeSelected() {
        if (selectedCount.value === 0) return

        try {
            await ElMessageBox.confirm(
                `确定要移除选中的 ${selectedCount.value} 本书吗？`,
                '移除书籍',
                { confirmButtonText: '移除', cancelButtonText: '取消', type: 'warning' }
            )
        } catch {
            return
        }

        const toRemove = books.value.filter(b => selectedKeys.value.has(getBookKey(b)))
        const keys: [string, string][] = toRemove.map(b => [b.sourceId, b.bookId])
        await batchRemoveFromBookshelf(keys)
        books.value = books.value.filter(b => !selectedKeys.value.has(getBookKey(b)))
        ElMessage.success(`已移除 ${keys.length} 本书`)
        cancelManage()
    }

    async function removeSingle(book: Book) {
        try {
            await ElMessageBox.confirm(
                `确定要将《${book.name}》从书架移除吗？`,
                '移除书籍',
                { confirmButtonText: '移除', cancelButtonText: '取消', type: 'warning' }
            )
        } catch {
            return
        }

        await removeFromBookshelf(book.sourceId, book.bookId)
        books.value = books.value.filter(b => getBookKey(b) !== getBookKey(book))
        ElMessage.success('已从书架移除')
    }

    return {
        isManaging,
        selectedKeys,
        selectedCount,
        isAllSelected,
        startManage,
        cancelManage,
        toggleSelect,
        toggleSelectAll,
        isSelected,
        removeSelected,
        removeSingle,
    }
}
