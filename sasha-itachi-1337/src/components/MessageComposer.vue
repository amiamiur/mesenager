<script setup lang="ts">
import {ref} from "vue";

const emit = defineEmits<{
  send: [body: string]
}>()

const draft = ref("");
const showEmoji = ref(false);

const emojis = ["◕‿◕", "(◕^^◕)", "{｡^◕‿◕^｡}", "◠ᴥ◠", "^︵^", "^_^", "~.~", "⌤", "☠", "☭", "♥", "☣"];

function submitMessage() {
  const body = draft.value.trim();
  if (!body) return;
  emit("send", body);
  draft.value = "";
  showEmoji.value = false;
}

function addEmoji(emoji: string) {
  draft.value += emoji;
}
</script>

<template>
  <div class="composer-wrap">
    <div
        v-if="showEmoji"
        class="overlay"
        @click="showEmoji = false"
    ></div>

    <div
        v-if="showEmoji"
        class="emoji-panel"
    >
      <button
          v-for="emoji in emojis"
          :key="emoji"
          type="button"
          class="emoji-btn"
          @click="addEmoji(emoji)"
      >
        {{ emoji }}
      </button>
    </div>

    <form
        class="composer"
        @submit.prevent="submitMessage"
    >
      <input
          v-model="draft"
          type="text"
          placeholder="Напишите сообщение"
          autocomplete="off"
      />

      <button
          type="button"
          class="emoji-toggle"
          :class="{active: showEmoji}"
          @click="showEmoji = !showEmoji"
      >
        ❦
      </button>
      <button type="submit">Отправить</button>
    </form>
  </div>
</template>

<style scoped>
.composer-wrap {
  position: relative;
  flex-shrink: 0;
}

.composer{
  display: flex;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #252830;
  background: #17191f;
  box-sizing: border-box;
}

.composer input {
  flex: 1;
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid #343842;
  border-radius: 6px;
  outline: none;
  color: #f2f3f5;
  background: #20232a;
  font: inherit;
}

.composer input:focus{
  border-color: #4f7fea;
}

.composer button{
  padding: 0 18px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: white;
  background: #386be0;
  font: inherit;
  font-weight: 600;
}

.composer button:hover {
  background: #4779e8;
}
</style>