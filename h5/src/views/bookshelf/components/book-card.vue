<script setup lang="ts">
import { ref } from 'vue'
import type { Book } from '../book'
import type { BookshelfLayout } from '../hooks/use-bookshelf'

defineProps<{
    book: Book
    layout: BookshelfLayout
    editMode: boolean
    selected: boolean
}>()

const emit = defineEmits<{
    longpress: []
}>()

const LONG_PRESS_DURATION = 500
const MOVE_THRESHOLD = 10

let timer: ReturnType<typeof setTimeout> | null = null
let startX = 0
let startY = 0
const isLongPress = ref(false)

function onTouchStart(e: TouchEvent) {
    const touch = e.touches[0]!
    startX = touch.clientX
    startY = touch.clientY
    isLongPress.value = false

    timer = setTimeout(() => {
        isLongPress.value = true
        emit('longpress')
    }, LONG_PRESS_DURATION)
}

function onTouchMove(e: TouchEvent) {
    if (!timer) return
    const touch = e.touches[0]!
    if (
        Math.abs(touch.clientX - startX) > MOVE_THRESHOLD ||
        Math.abs(touch.clientY - startY) > MOVE_THRESHOLD
    ) {
        clearTimeout(timer)
        timer = null
    }
}

function onTouchEnd() {
    if (timer) {
        clearTimeout(timer)
        timer = null
    }
}

function onClickCapture(e: Event) {
    if (isLongPress.value) {
        e.stopImmediatePropagation()
        e.preventDefault()
        isLongPress.value = false
    }
}
</script>

<template>
    <div
        class="book-card"
        :class="[`book-card--${layout}`, { 'book-card--selected': selected }]"
        @touchstart.passive="onTouchStart"
        @touchmove.passive="onTouchMove"
        @touchend="onTouchEnd"
        @click.capture="onClickCapture"
        @contextmenu.prevent
    >
        <div
            v-if="editMode"
            class="book-card__check"
        >
            <span
                class="check-circle"
                :class="{ 'check-circle--active': selected }"
            >
                <svg
                    v-if="selected"
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="currentColor"
                >
                    <path
                        d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                    />
                </svg>
            </span>
        </div>

        <div class="book-card__cover">
            <img
                v-if="book.cover"
                :src="book.cover"
                :alt="book.name"
                loading="lazy"
            />
            <div
                v-else
                class="book-card__placeholder"
            >
                {{ book.name }}
            </div>
            <div
                v-if="layout === 'grid' && book.readProgress != null"
                class="book-card__progress"
            >
                <div
                    class="progress-bar"
                    :style="{ width: `${book.readProgress}%` }"
                ></div>
            </div>
        </div>

        <div class="book-card__info">
            <template v-if="layout === 'grid'">
                <h3 class="book-card__name">{{ book.name }}</h3>
                <p class="book-card__author">{{ book.author }}</p>
            </template>
            <template v-else>
                <div class="book-card__header">
                    <h3 class="book-card__name">{{ book.name }}</h3>
                    <span class="book-card__badge">{{
                        book.totalChapters ?? 0
                    }}</span>
                </div>
                <p class="book-card__row">
                    <svg
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        fill="currentColor"
                    >
                        <path
                            d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                        />
                    </svg>
                    <span>{{ book.author }}</span>
                </p>
                <p
                    v-if="book.lastReadChapterTitle"
                    class="book-card__row"
                >
                    <svg
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        fill="currentColor"
                    >
                        <path
                            d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
                        />
                    </svg>
                    <span>{{ book.lastReadChapterTitle }}</span>
                </p>
                <p
                    v-if="book.latestChapter"
                    class="book-card__row"
                >
                    <svg
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        fill="currentColor"
                    >
                        <path
                            d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"
                        />
                    </svg>
                    <span>{{ book.latestChapter }}</span>
                </p>
            </template>
        </div>
    </div>
</template>

<style scoped lang="scss">
.book-card {
    position: relative;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: opacity 0.2s;

    &:active {
        opacity: 0.7;
    }

    &--grid {
        display: flex;
        flex-direction: column;

        .book-card__cover {
            position: relative;

            img,
            .book-card__placeholder {
                width: 100%;
                aspect-ratio: 3 / 4;
                border-radius: 4px;
                border: 1px solid var(--border-default);
            }

            img {
                object-fit: cover;
                display: block;
            }
        }

        .book-card__info {
            padding-top: 8px;
            text-align: center;
        }

        .book-card__name {
            font-size: 13px;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        }

        .book-card__author {
            font-size: 11px;
        }

        .book-card__check {
            position: absolute;
            top: 4px;
            right: 4px;
            z-index: 2;
        }
    }

    &--list {
        display: flex;
        align-items: flex-start;
        padding: 12px 0;
        border-bottom: 1px solid var(--border-default);

        --w: 65px;

        .book-card__cover {
            flex-shrink: 0;
            width: var(--w);

            img,
            .book-card__placeholder {
                width: var(--w);
                height: 80px;
                border-radius: 4px;
                border: 1px solid var(--border-default);
            }

            img {
                object-fit: cover;
                display: block;
            }
        }

        .book-card__info {
            flex: 1;
            min-width: 0;
            margin-left: 12px;
        }

        .book-card__header {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .book-card__name {
            flex: 1;
            min-width: 0;
            font-size: 15px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .book-card__badge {
            flex-shrink: 0;
            font-size: 11px;
            line-height: 1;
            padding: 2px 8px;
            border-radius: 10px;
            border: 1px solid var(--border-default);
            color: var(--text-secondary);
        }

        .book-card__row {
            display: flex;
            align-items: center;
            gap: 4px;
            margin: 4px 0 0;
            font-size: 12px;
            color: var(--text-secondary);

            svg {
                flex-shrink: 0;
                opacity: 0.6;
            }

            span {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        }

        .book-card__check {
            flex-shrink: 0;
            margin-right: 12px;
        }
    }

    &__placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #f0f0f0;
        color: var(--text-secondary);
        font-size: 12px;
        writing-mode: vertical-rl;
        letter-spacing: 2px;
        padding: 8px;
        overflow: hidden;
    }

    &__name {
        margin: 0;
        font-weight: 500;
        color: var(--text-primary);
    }

    &__author {
        margin: 0;
        color: var(--text-secondary);
    }

    &__progress {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 3px;
        background-color: rgba(0, 0, 0, 0.1);
        border-radius: 0 0 6px 6px;
        overflow: hidden;

        .progress-bar {
            height: 100%;
            background-color: var(--color-primary);
            border-radius: inherit;
            transition: width 0.3s;
        }
    }
}

.check-circle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2px solid var(--text-placeholder);
    background-color: var(--color-bg);
    transition: all 0.15s;

    &--active {
        border-color: var(--color-primary);
        background-color: var(--color-primary);
        color: #fff;
    }
}
</style>
