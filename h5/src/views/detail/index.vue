<script setup lang="ts">
import { useDetail } from './hooks/use-detail'
import DetailNavbar from './components/detail-navbar.vue'
import DetailHeader from './components/detail-header.vue'
import ChapterList from './components/chapter-list.vue'
import DetailFooter from './components/detail-footer.vue'
import AppButton from '@/components/app-button/index.vue'

const {
    detail,
    chapters,
    loading,
    error,
    inBookshelf,
    fetchData,
    toggleBookshelf,
    startReading,
    goToChapter,
    goBack,
} = useDetail()
</script>

<template>
    <div class="detail">
        <DetailNavbar @back="goBack" />

        <template v-if="loading">
            <div class="detail__skeleton">
                <div class="skeleton-info">
                    <div class="skeleton-cover skeleton-block" />
                    <div class="skeleton-meta">
                        <div class="skeleton-block skeleton-block--title" />
                        <div class="skeleton-block skeleton-block--text" />
                        <div
                            class="skeleton-block skeleton-block--text skeleton-block--short"
                        />
                    </div>
                </div>
                <div class="skeleton-intro">
                    <div class="skeleton-block skeleton-block--line" />
                    <div class="skeleton-block skeleton-block--line" />
                    <div
                        class="skeleton-block skeleton-block--line skeleton-block--short"
                    />
                </div>
                <div class="skeleton-chapters">
                    <div class="skeleton-block skeleton-block--chapter-title" />
                    <div
                        v-for="i in 6"
                        :key="i"
                        class="skeleton-block skeleton-block--chapter"
                    />
                </div>
            </div>
        </template>

        <template v-else-if="error">
            <div class="detail__error">
                <svg
                    viewBox="0 0 24 24"
                    width="48"
                    height="48"
                    fill="currentColor"
                >
                    <path
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                    />
                </svg>
                <p>加载失败</p>
                <AppButton
                    type="plain"
                    shape="round"
                    @click="fetchData"
                >
                    重新加载
                </AppButton>
            </div>
        </template>

        <template v-else-if="detail">
            <main class="detail__content">
                <DetailHeader :detail="detail" />
                <ChapterList
                    :chapters="chapters"
                    @select="goToChapter"
                />
            </main>
            <DetailFooter
                :in-bookshelf="inBookshelf"
                :has-chapters="chapters.length > 0"
                @toggle-bookshelf="toggleBookshelf"
                @start-reading="startReading"
            />
        </template>
    </div>
</template>

<style scoped lang="scss">
.detail {
    height: 100vh;
    background-color: var(--color-bg);
    padding-bottom: var(--safe-area-inset-bottom);

    &__content {
        display: flex;
        flex-direction: column;
    }

    &__error {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-top: 120px;
        color: var(--text-placeholder);

        p {
            margin: 12px 0 20px;
            font-size: 14px;
        }
    }

    &__skeleton {
        padding: 16px;

        .skeleton-info {
            display: flex;
            gap: 14px;
        }

        .skeleton-cover {
            width: 96px;
            height: 128px;
            border-radius: 6px;
            flex-shrink: 0;
        }

        .skeleton-meta {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding-top: 2px;
        }

        .skeleton-intro {
            margin-top: 16px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .skeleton-chapters {
            margin-top: 24px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .skeleton-block {
            background: linear-gradient(
                90deg,
                #f0f0f0 25%,
                #e0e0e0 50%,
                #f0f0f0 75%
            );
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 4px;

            &--title {
                height: 22px;
                width: 70%;
            }

            &--text {
                height: 14px;
                width: 50%;
            }

            &--short {
                width: 35%;
            }

            &--line {
                height: 14px;
                width: 100%;
            }

            &--chapter-title {
                height: 18px;
                width: 80px;
                margin-bottom: 4px;
            }

            &--chapter {
                height: 44px;
                width: 100%;
            }
        }
    }
}

@keyframes shimmer {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}
</style>
