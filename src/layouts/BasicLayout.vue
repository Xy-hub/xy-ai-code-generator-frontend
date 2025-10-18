<script setup lang="ts">
import GlobalHeader from '../components/GlobalHeader.vue'
import GlobalFooter from '../components/GlobalFooter.vue'
</script>

<template>
  <a-layout style="min-height: 100vh">
    <a-layout-header style="position: sticky; top: 0; z-index: 100; padding: 0">
      <GlobalHeader />
    </a-layout-header>

    <a-layout-content style="padding: 24px 32px; background: #fff">
      <div style="margin: 16px auto; padding: 16px; min-height: calc(100vh - 64px - 64px - 64px)">
        <router-view />
      </div>
    </a-layout-content>

    <a-layout-footer style="padding: 0">
      <GlobalFooter />
    </a-layout-footer>
  </a-layout>
</template>

<style scoped>
/* Ensure responsive content area spacing */
@media (max-width: 768px) {
  :deep(.ant-layout-content) {
    padding: 12px !important;
  }
}
</style>
