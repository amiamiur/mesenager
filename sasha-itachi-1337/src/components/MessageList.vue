<script setup lang="ts">
import MessageBubble from "./MessageBubble.vue";
import type {Message} from "../types/message.ts";

defineProps<{
  messages: Message[];
  currentUserId: number | null;
}>();

const emit = defineEmits<{
  update: [id: number, body: string]
  delete: [id: number]
  'open-profile': [userId: number]
}>();
</script>

<template>
  <div class="messages">
    <div
        v-if="messages.length === 0"
        class="empty"
    >
      <strong>Пока пусто</strong>
      <span>Напишите первое сообщение</span>
    </div>

    <MessageBubble
        v-for="message in messages"
        :key="message.id"
        :message="message"
        :is-own="message.author_id === currentUserId"
        :avatar-path="message.author_avatar"
        @update="(id, body) => emit('update', id, body)"
        @delete="(id) => emit('delete', id)"
        @open-profile="(id) => emit('open-profile', id)"
    />
  </div>
</template>

<style scoped>
.messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 24px;
  min-height: 0;
}

.empty{
  margin: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: center;
  color: var(--text-dim);
}
</style>