import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db } from '../database/index'
import type { BookshelfRecord, ReadHistoryRecord, ChapterCacheRecord } from '../database/types'

// 每个测试前重置数据库，避免测试间数据污染
beforeEach(async () => {
    await db.bookshelf.clear()
    await db.readHistory.clear()
    await db.chapterCache.clear()
})

afterEach(async () => {
    await db.bookshelf.clear()
    await db.readHistory.clear()
    await db.chapterCache.clear()
})

// ─── 测试数据 ────────────────────────────────────────────────────────────────

const mockBook: BookshelfRecord = {
    sourceId: 'source-1',
    bookId: 'book-1',
    sourceName: '测试书源',
    name: '测试书籍',
    author: '测试作者',
    cover: 'https://example.com/cover.jpg',
    intro: '这是一本测试书籍',
    latestChapter: '第100章',
    status: '连载中',
    addedAt: Date.now(),
}

const mockReadHistory: ReadHistoryRecord = {
    sourceId: 'source-1',
    bookId: 'book-1',
    name: '测试书籍',
    author: '测试作者',
    cover: 'https://example.com/cover.jpg',
    lastReadChapterId: 'chapter-5',
    lastReadChapterTitle: '第5章',
    lastReadChapterIndex: 5,
    totalChapters: 100,
    readProgress: 0.05,
    scrollPosition: 320,
    lastReadAt: Date.now(),
}

const mockChapterCache: ChapterCacheRecord = {
    sourceId: 'source-1',
    bookId: 'book-1',
    chapterId: 'chapter-5',
    title: '第5章',
    content: '这是第5章的正文内容...',
    chapterIndex: 5,
    cachedAt: Date.now(),
    lastAccessedAt: Date.now(),
}

// ─── 数据库实例 ───────────────────────────────────────────────────────────────

describe('NovelDatabase 实例', () => {
    it('数据库实例应正确创建', () => {
        expect(db).toBeDefined()
        expect(db.name).toBe('browser-novel')
    })

    it('应包含三张表：bookshelf、readHistory、chapterCache', () => {
        expect(db.bookshelf).toBeDefined()
        expect(db.readHistory).toBeDefined()
        expect(db.chapterCache).toBeDefined()
    })
})

// ─── bookshelf 表 ─────────────────────────────────────────────────────────────

describe('bookshelf 表', () => {
    it('put() 写入书架记录', async () => {
        await db.bookshelf.put(mockBook)
        const result = await db.bookshelf.toArray()
        expect(result).toHaveLength(1)
        expect(result[0]!.name).toBe('测试书籍')
    })

    it('get() 通过复合主键读取记录', async () => {
        await db.bookshelf.put(mockBook)
        const record = await db.bookshelf.get({ sourceId: 'source-1', bookId: 'book-1' })
        expect(record).toBeDefined()
        expect(record!.author).toBe('测试作者')
    })

    it('put() 更新已有记录（upsert）', async () => {
        await db.bookshelf.put(mockBook)
        await db.bookshelf.put({ ...mockBook, latestChapter: '第200章' })
        const result = await db.bookshelf.toArray()
        expect(result).toHaveLength(1)
        expect(result[0]!.latestChapter).toBe('第200章')
    })

    it('delete() 删除书架记录', async () => {
        await db.bookshelf.put(mockBook)
        await db.bookshelf.delete([mockBook.sourceId, mockBook.bookId])
        const result = await db.bookshelf.toArray()
        expect(result).toHaveLength(0)
    })

    it('toArray() 初始为空', async () => {
        const result = await db.bookshelf.toArray()
        expect(result).toHaveLength(0)
    })

    it('addedAt 索引：按加入时间排序', async () => {
        const book1 = { ...mockBook, bookId: 'book-1', addedAt: 1000 }
        const book2 = { ...mockBook, bookId: 'book-2', addedAt: 3000 }
        const book3 = { ...mockBook, bookId: 'book-3', addedAt: 2000 }
        await db.bookshelf.bulkPut([book1, book2, book3])

        const result = await db.bookshelf.orderBy('addedAt').toArray()
        expect(result.map(b => b.bookId)).toEqual(['book-1', 'book-3', 'book-2'])
    })
})

// ─── readHistory 表 ───────────────────────────────────────────────────────────

describe('readHistory 表', () => {
    it('put() 写入阅读记录', async () => {
        await db.readHistory.put(mockReadHistory)
        const result = await db.readHistory.toArray()
        expect(result).toHaveLength(1)
        expect(result[0]!.lastReadChapterTitle).toBe('第5章')
    })

    it('get() 通过复合主键读取记录', async () => {
        await db.readHistory.put(mockReadHistory)
        const record = await db.readHistory.get({ sourceId: 'source-1', bookId: 'book-1' })
        expect(record).toBeDefined()
        expect(record!.readProgress).toBe(0.05)
        expect(record!.scrollPosition).toBe(320)
    })

    it('put() 更新阅读进度（upsert）', async () => {
        await db.readHistory.put(mockReadHistory)
        await db.readHistory.put({
            ...mockReadHistory,
            lastReadChapterId: 'chapter-10',
            lastReadChapterTitle: '第10章',
            lastReadChapterIndex: 10,
            readProgress: 0.1,
        })
        const result = await db.readHistory.toArray()
        expect(result).toHaveLength(1)
        expect(result[0]!.lastReadChapterIndex).toBe(10)
        expect(result[0]!.readProgress).toBe(0.1)
    })

    it('delete() 删除阅读记录', async () => {
        await db.readHistory.put(mockReadHistory)
        await db.readHistory.delete([mockReadHistory.sourceId, mockReadHistory.bookId])
        const result = await db.readHistory.toArray()
        expect(result).toHaveLength(0)
    })

    it('lastReadAt 索引：按最近阅读时间排序', async () => {
        const r1 = { ...mockReadHistory, bookId: 'book-1', lastReadAt: 1000 }
        const r2 = { ...mockReadHistory, bookId: 'book-2', lastReadAt: 3000 }
        const r3 = { ...mockReadHistory, bookId: 'book-3', lastReadAt: 2000 }
        await db.readHistory.bulkPut([r1, r2, r3])

        const result = await db.readHistory.orderBy('lastReadAt').reverse().toArray()
        expect(result.map(r => r.bookId)).toEqual(['book-2', 'book-3', 'book-1'])
    })
})

// ─── chapterCache 表 ──────────────────────────────────────────────────────────

describe('chapterCache 表', () => {
    it('put() 写入章节缓存', async () => {
        await db.chapterCache.put(mockChapterCache)
        const result = await db.chapterCache.toArray()
        expect(result).toHaveLength(1)
        expect(result[0]!.title).toBe('第5章')
    })

    it('get() 通过三字段复合主键读取缓存', async () => {
        await db.chapterCache.put(mockChapterCache)
        const record = await db.chapterCache.get({
            sourceId: 'source-1',
            bookId: 'book-1',
            chapterId: 'chapter-5',
        })
        expect(record).toBeDefined()
        expect(record!.content).toBe('这是第5章的正文内容...')
    })

    it('put() 更新缓存（upsert）', async () => {
        await db.chapterCache.put(mockChapterCache)
        const newAccessTime = Date.now() + 5000
        await db.chapterCache.put({ ...mockChapterCache, lastAccessedAt: newAccessTime })
        const result = await db.chapterCache.toArray()
        expect(result).toHaveLength(1)
        expect(result[0]!.lastAccessedAt).toBe(newAccessTime)
    })

    it('delete() 删除章节缓存', async () => {
        await db.chapterCache.put(mockChapterCache)
        await db.chapterCache.delete([
            mockChapterCache.sourceId,
            mockChapterCache.bookId,
            mockChapterCache.chapterId,
        ])
        const result = await db.chapterCache.toArray()
        expect(result).toHaveLength(0)
    })

    it('[sourceId+bookId] 索引：查询某本书的所有章节缓存', async () => {
        const chapter5 = { ...mockChapterCache, chapterId: 'chapter-5', chapterIndex: 5 }
        const chapter6 = { ...mockChapterCache, chapterId: 'chapter-6', chapterIndex: 6 }
        // 另一本书的缓存，不应被查到
        const otherBook = { ...mockChapterCache, bookId: 'book-2', chapterId: 'chapter-1' }
        await db.chapterCache.bulkPut([chapter5, chapter6, otherBook])

        const result = await db.chapterCache
            .where('[sourceId+bookId]')
            .equals(['source-1', 'book-1'])
            .toArray()
        expect(result).toHaveLength(2)
        expect(result.map(c => c.chapterId).sort()).toEqual(['chapter-5', 'chapter-6'])
    })

    it('lastAccessedAt 索引：按最近访问时间排序（LRU 基础）', async () => {
        const c1 = { ...mockChapterCache, chapterId: 'chapter-1', lastAccessedAt: 1000 }
        const c2 = { ...mockChapterCache, chapterId: 'chapter-2', lastAccessedAt: 3000 }
        const c3 = { ...mockChapterCache, chapterId: 'chapter-3', lastAccessedAt: 2000 }
        await db.chapterCache.bulkPut([c1, c2, c3])

        // 升序（最旧的在前，LRU 清理时优先删除）
        const result = await db.chapterCache.orderBy('lastAccessedAt').toArray()
        expect(result.map(c => c.chapterId)).toEqual(['chapter-1', 'chapter-3', 'chapter-2'])
    })
})
