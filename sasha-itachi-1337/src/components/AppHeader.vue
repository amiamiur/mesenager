<script setup lang="ts">
import { ref, watch } from "vue";
import { readImageAsDataUrl } from "../utils/readImage";
import type {User} from "../types/user.ts";

const props = defineProps<{
  status: string;
  users: User[];
  currentUserId: number | null;
  theme: "dark" | "light";
}>();

const emit = defineEmits<{
  'select-user': [user: User]
  'set-theme': [theme: "dark" | "light"]
  'open-profile': []
}>();

const userAvatars = ref<Record<number, string>>({});
const avatarPaths = ref<Record<number, string | null>>({});

watch(
    () => props.users,
    async (users) => {
      for (const u of users) {
        if (u.avatar_path !== avatarPaths.value[u.id]) {
          avatarPaths.value[u.id] = u.avatar_path;
          userAvatars.value[u.id] = u.avatar_path
              ? await readImageAsDataUrl(u.avatar_path)
              : "";
        }
      }
    },
    { immediate: true, deep: true }
);

function handleUserClick(user: User) {
  if (user.id === props.currentUserId) {
    emit('open-profile');
  } else {
    emit('select-user', user);
  }
}
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
          :class="{ active: user.id === currentUserId }"
          :title="user.id === currentUserId
        ? `${user.display_name} (нажми, чтобы открыть профиль)`
        : user.status"
          @click="handleUserClick(user)"
      >
        <img
            v-if="userAvatars[user.id]"
            :src="userAvatars[user.id]"
            class="user-avatar"
            alt=""
        />
        <span v-else class="user-avatar placeholder">
      {{ user.display_name[0] }}
    </span>
        <span>{{ user.display_name }}</span>
      </button>
    </div>
    <div class="theme-switcher">
      <button
      type="button"
      class="theme-dot dot-dark"
      :class="{active: theme === 'dark'}"
      title="Темная тема"
      @click="emit('set-theme', 'dark')"
      />
      <button
      type="button"
      class="theme-dot dot-light"
      :class="{active: theme === 'light'}"
      title="Светлая тема"
      @click="emit('set-theme', 'light')"
      />
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
  border-bottom: 1px solid var(--border);
  background: var(--bg-surface);
  flex-shrink: 0;
}

.left h1{
  margin:0;
  font-size: 18px;
}

.left p{
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--text-muted);
}

.users{
  display:flex;
  gap: 6px;
  flex-wrap: wrap;
}

.user-btn{
  display:inline-flex;
  align-items: center;
  gap:8px;
  padding: 4px 12px 4px 4px;
  border: 1px solid var(--border-soft);
  border-radius: 999px;
  background: var(--bg-elevated);
  color: var(--text-soft);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
}

.user-btn:hover{
  background: var(--bg-hover);
  color: var(--text);
}

.user-btn.active{
  background: var(--accent);
  border-color: var(--accent-focus);
  color: white;
}

.user-avatar{
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-avatar.placeholder{
  background: var(--bg-hover);
  color: var(--text);
  font-size: 12px;
  font-weight: 600;
}

.user-btn.active .user-avatar.placeholder {
  background: rgba(255,255,255, 0.25);
  color:white;
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

.theme-switcher {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.theme-dot {
  width: 22px;
  height: 22px;
  padding: 0;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.12s, border-color 0.12s, box-shadow 0.12s;
}

.theme-dot:hover {
  transform: scale(1.1);
}

.theme-dot.dot-dark {
  background: #111318;
  border-color: #343842;
}

.theme-dot.dot-light {
  background: #f5f6f8;
  border-color: #d0d4dc;
}

.theme-dot.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-focus);
}

.badge{
  padding: 6px 12px;
  border: 1px solid var(--badge-border);
  border-radius: 6px;
  color: var(--badge-text);
  background: var(--badge-bg);
  font-size: 12px;
  flex-shrink: 0;
}
</style>