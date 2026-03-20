<template>
    <RouterView v-slot="{ Component, route }">
        <KeepAlive include="SearchPage">
            <component :is="Component" :key="route.name" />
        </KeepAlive>
    </RouterView>
</template>
