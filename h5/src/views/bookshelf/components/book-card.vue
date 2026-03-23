<script setup lang="ts">
import type { Book } from '../book'
import type { BookshelfLayout } from '../hooks/use-bookshelf'

defineProps<{
    book: Book
    layout: BookshelfLayout
    editMode: boolean
    selected: boolean
}>()
</script>

<template>
    <div
        class="book-card"
        :class="[
            `book-card--${layout}`,
            { 'book-card--selected': selected },
        ]"
    >
        <div v-if="editMode" class="book-card__check">
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
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
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
            <div v-else class="book-card__placeholder">
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
            <h3 class="book-card__name">{{ book.name }}</h3>
            <p class="book-card__author">{{ book.author }}</p>
            <template v-if="layout === 'list'">
                <p
                    v-if="book.lastReadChapterTitle"
                    class="book-card__chapter"
                >
                    读到：{{ book.lastReadChapterTitle }}
                </p>
                <p
                    v-if="book.readProgress != null"
                    class="book-card__detail"
                >
                    进度 {{ book.readProgress }}%
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
                border-radius: 6px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid var(--border-default);

        .book-card__cover {
            flex-shrink: 0;
            width: 56px;

            img,
            .book-card__placeholder {
                width: 56px;
                height: 75px;
                border-radius: 4px;
                box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
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

        .book-card__name {
            font-size: 15px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .book-card__author {
            font-size: 12px;
            margin-top: 2px;
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

    &__chapter {
        margin: 4px 0 0;
        font-size: 12px;
        color: var(--text-secondary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &__detail {
        margin: 2px 0 0;
        font-size: 12px;
        color: var(--text-placeholder);
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
