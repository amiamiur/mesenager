<script setup lang="ts">
import { ref, watch } from "vue";
import {readFile, BaseDirectory} from "@tauri-apps/plugin-fs";
import type { Message } from "../types/message.ts";

const props = defineProps<{
  message: Message;
}>();

const emit = defineEmits<{
  update: [id: number, body: string]
  delete: [id: number]
}>();

const imgSrc = ref("");
const imageOpened = ref(false);
const editing = ref(false);
const editText = ref("");

watch(
    () => props.message.body,
    async (body) => {
      imgSrc.value = "";
      imageOpened.value = false;

      if (!/\.(png|jpe?g|webp)$/i.test(body)) {
        return;
      }

      try {
        const bytes = await readFile(body, {
          baseDir: BaseDirectory.AppData,
        });

        const ext = body.split(".").pop()!.toLowerCase();
        const mime = ext === "jpg" ? "jpeg" : ext;

        let binary = "";
        const chunkSize = 0x8000;

        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
          binary += String.fromCharCode(...chunk);
        }

        imgSrc.value = `data:image/${mime};base64,${btoa(binary)}`;
      } catch (e) {
        console.error("Не удалось прочитать картинку:", e);
      }
    },
    { immediate: true }
);

function openImage() {
  if (imgSrc.value) {
    imageOpened.value = true;
  }
}

function closeImage() {
  imageOpened.value = false;
}
function startEdit() {
  editText.value = props.message.body;
  editing.value = true;
}
function saveEdit() {
  const body = editText.value.trim();

  if (body && body !== props.message.body) {
    emit("update", props.message.id, body);
  }
  editing.value = false;
}
function cancelEdit(){
  editing.value = false;
}

function removeMessage(){
  if (confirm("Удалить сообщение?")){
    emit("delete", props.message.id);
  }
}

</script>

<template>
  <article class="message">
    <button
      class="delete-btn"
      type="button"
      title="Удалить сообщение"
      @click="removeMessage"
    >
      X
    </button>
    <img
        v-if="imgSrc"
        :src="imgSrc"
        class="message-image"
        alt="Вложение"
        @click="openImage"
    />

    <input
        v-else-if="editing"
        :ref="el => (el as HTMLInputElement)?.focus()"
        v-model="editText"
        class="edit-input"
        @keyup.enter="saveEdit"
        @keyup.escape="cancelEdit"
        @click.stop
    />

    <p
        v-else
        @dblclick="startEdit"
    >
      {{ message.body }}
    </p>

    <footer>
      <span>{{ message.author }}</span>
      <span>|</span>
      <span>{{ message.created_at }}</span>
    </footer>
  </article>

  <div
      v-if="imageOpened"
      class="image-viewer"
      @click="closeImage"
  >
    <button
        class="close-button"
        type="button"
        @click="closeImage"
    >
      ×
    </button>

    <img

        :src="imgSrc"
        class="image-viewer-image"
        alt="Увеличенное изображение"
        @click.stop
    />
  </div>
</template>

<style scoped>
.message {
  align-self: flex-end;
  max-width: 70%;
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: #386be0;
}

.message p {
  margin: 0;
  line-height: 1.45;
  overflow-wrap: anywhere;
  cursor: text;
}

.message-image {
  display: block;
  max-width: 100%;
  max-height: 300px;
  border-radius: 6px;
  object-fit: contain;
  cursor: zoom-in;
}

.message footer {
  display: flex;
  justify-content: flex-end;
  gap: 5px;
  margin-top: 6px;
  color: #ccd8f7;
  font-size: 10px;
}

.delete-btn {
  position: absolute;
  font-size: 16px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s, background 0.15s;
}

.message:hover .delete-btn{
  opacity: 1;
}

.image-viewer {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: rgba(0, 0, 0, 0.85);
  cursor: pointer;
}

.image-viewer-image {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  cursor: default;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.close-button {
  position: absolute;
  top: 20px;
  right: 25px;
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 50%;
  background: #20232a;
  color: white;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
}

.close-button:hover {
  background: #343842;
}
</style>