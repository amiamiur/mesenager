<script setup lang="ts">
import type {User} from "../types/user.ts";

defineProps<{
  status:string;
  users: User[];
  currentUserId: number | null;
}>();

const emit = defineEmits<{
  'select-user': [user: User]
}>();
</script>

<template>
  <header class="header">
    <div class = "left">
      <h1>Чатикс <3</h1>
      <p>{{status}}</p>
    </div>

    <div class="users">
      <button
        v-for="user in users"
        :key="user.id"
        type="button"
        class="user-btn"
        :class="{active: user.id === currentUserId}"
        :title="user.status"
        @click="emit('select-user', user)"
      >
      {{user.display_name}}
      </button>
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
  flex-shrink: 0;
}
.header{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 24px;
  border-bottom: 1px solid #292c34;
  background: #17191f;
  flex-shrink: 0;
}

.left h1{
  margin:0;
  font-size: 18px;
}

.left p{
  margin: 4px 0 0;
  font-size: 12px;
  color: #8f96a3;
}

.users{
  display:flex;
  gap: 6px;
  flex-wrap: wrap;
}

.user-btn{
  padding: 6px 12px;
  border: 1px solid #343842;
  border-radius: 999px;
  background: #20232a;
  color: #afb5c0;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
}

.user-btn:hover{
  background: #2a2e36;
  color: #f2f3f5;
}

.user-btn.active{
  background: #386be0;
  border-color: #4f7fea;
  color: white;
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