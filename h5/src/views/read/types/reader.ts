export interface ChapterBlock {
    chapterId: string
    title: string
    content: string
}

export interface ReaderExpose {
    /** 保存当前进度信息，供 index.vue 在切章/离开时调用 */
    getProgressSnapshot: () => { chapterId: string; position: number }
}
