<script setup lang="ts">
import {ref} from "vue";
import {open} from "@tauri-apps/plugin-dialog";

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

// open - Открывает системный выбор файла
async function pickImage() {
  const file = await open({
    multiple: false, // Запрещает выбрать несколько файлов
    filters: [
      {
        name: "Images",
        extensions: ["png", "jpg", "jpeg", "webp"]
      }
    ]
  });

  if (!file) return;

  emit("send", file);
  showEmoji.value = false;
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
          class="icon-btn"
          title="Прикрепить картинку"
          @click="pickImage"
      >
        📎
      </button>

      <button
          type="button"
          class="icon-btn"
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

/* Общий стиль для кнопок-иконок */
.icon-btn {
  padding: 0 14px;
  background: #20232a;
  border: 1px solid #343842;
  font-size: 18px;
  font-weight: 400;
}

.icon-btn:hover {
  background: #2a2e36;
}

.icon-btn.active {
  border-color: #4f7fea;
}

.overlay {
  position: fixed;
  inset: 0;
  z-index: 9;
}

.emoji-panel {
  position: absolute;
  bottom: calc(100% - 1px);
  right: 20px;
  width: 360px;
  max-height: 260px;
  overflow-y: auto;
  padding: 10px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  background: #1b1e25;
  border: 1px solid #2e323b;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  z-index: 10;
}

.emoji-btn {
  padding: 10px 6px;
  min-height: 44px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: #20232a;
  color: #f2f3f5;
  font-size: 16px;
  line-height: 1.1;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
  overflow: hidden;
  white-space: nowrap;
}

.emoji-btn:hover {
  background: #2a2e36;
  border-color: #4f7fea;
}
</style>