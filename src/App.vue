<script setup>
import { RouterView } from 'vue-router'
import MainNavbarVue from "./components/MainNavbar.vue";
</script>

<template>
  <div class="mainView">
    <MainNavbarVue />
    <div class="mainInner">
      <RouterView />
    </div>
  </div>

</template>
