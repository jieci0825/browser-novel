<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const sourceId = route.params.sourceId as string
const bookId = route.params.bookId as string
const chapterId = route.params.chapterId as string
</script>

<template>
    <div class="container">阅读</div>
</template>

<style scoped lang="scss"></style>
