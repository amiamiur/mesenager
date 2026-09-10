<script setup lang="ts">

defineProps<{
  status:string;
}>();

</script>

<template>
  <header class="header">
    <div>
      <h1></h1>
      <p>{{status}}</p>
    </div>
    <span class="badge">
        local
      </span>
  </header>
</template>

<style scoped>

.badge{
  padding: 6px 12px;
  border: 1px solid #343842;
  border-radius: 6px;
  color: #afb5c0;
  background: #20232a;
  font-size: 12px;
}
.header{
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid #292c34;
  background: #17191f;
  flex-shrink: 0;
}

.header h1{
  margin: 0;
  font-size: 18px;
}

.header p{
  margin: 4px 0 0;
  font-size: 12px;
  color: #8f96a3;
}
</style>