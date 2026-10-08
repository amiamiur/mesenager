<script setup lang="ts">
import { ref, watch } from "vue";
import type { Message } from "../types/message.ts";
import {readImageAsDataUrl} from "../utils/readImage.ts"

const props = defineProps<{
  message: Message;
  isOwn: boolean;
  avatarPath?: string | null;
}>();

const emit = defineEmits<{
  update: [id: number, body: string]
  delete: [id: number]
  'open-profile': [userId:number]
}>();

const imgSrc = ref("");
const imageOpened = ref(false);
const editing = ref(false);
const editText = ref("");
const avatarSrc = ref("");

watch(
    () => props.message.attachment,
    async (attachment) => {
      imgSrc.value = "";
      imageOpened.value = false;

      if (!attachment) return;

      imgSrc.value = await readImageAsDataUrl(attachment);
    },
    { immediate: true }
);

watch(
    () => props.message.attachment,
    async (attachment) => {
      imgSrc.value = "";
      imageOpened.value = false;

      if (!attachment) return;

      imgSrc.value = await readImageAsDataUrl(attachment);
    },
    {immediate: true}
);

watch(
    () => [props.isOwn, props.avatarPath] as const,
    async([isOwn, path]) => {
      if (isOwn || !path){
        avatarSrc.value = "";
        return
      }
      avatarSrc.value = await readImageAsDataUrl(path);
    },
    {immediate: true}
)

function openImage() {
  if (imgSrc.value) {
    imageOpened.value = true;
  }
}

function closeImage() {
  imageOpened.value = false;
}
function startEdit() {
  if (!props.isOwn) return;
  editText.value = props.message.body ?? "";
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

watch(
    () => props.isOwn,
    (isOwn) => {
      if (!isOwn){
        editing.value = false;
        editText.value = "";
      }
    }
);

</script>

<template>
  <div
      class="message-row"
      :class="isOwn ? 'own' : 'other'"
  >
    <template v-if="!isOwn">
      <img
          v-if="avatarSrc"
          :src="avatarSrc"
          class="avatar clickable"
          alt=""
          :title="`Открыть профиль ${message.author_name}`"
          @click="emit('open-profile', message.author_id)"
      />
      <div
          v-else
          class="avatar placeholder clickable"
          :title="`Открыть профиль ${message.author_name}`"
          @click="emit('open-profile', message.author_id)"
      >
        {{ message.author_name[0] }}
      </div>
    </template>

    <article
        class="message"
        :class="isOwn ? 'own' : 'other'"
    >
      <button
          v-if="isOwn"
          class="delete-btn"
          type="button"
          title="Удалить сообщение"
          @click="removeMessage"
      >
        X
      </button>

      <div
        v-if="!isOwn"
        class="author"
      >
        {{message.author_name}}
      </div>

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
        <span>{{ message.created_at }}</span>
      </footer>
    </article>
  </div>

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
.message-row{
  display: flex;
  align-items: flex-end;
  gap: 8px;
  max-width: 70%;
}

.message-row.own{
  align-self: flex-end;
}

.message-row.other{
  align-self: flex-start;
}

.avatar{
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.avatar.placeholder{
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-elevated);
  color: var(--text-soft);
  font-size: 14px;
  font-weight: 600;
}

.avatar.clickable{
  cursor:pointer;
  transition: transform 0.12s, box-shadow 0.12s;
}

.avatar.clickable:hover{
  transform: scale(1.08);
  box-shadow: 0 0 0 2px var(--accent-focus);
}

.message {
  min-width: 0;
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  position: relative;
}

.message.own{
  background: var(--accent);
  color: white;
}

.message.other{
  background: var(--bubble-other-bg);
  color: var(--bubble-other-text);
}

.author {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 4px;
  opacity: 0.85;
  letter-spacing: 0.2px;
}

.message p {
  margin: 0;
  line-height: 1.45;
  overflow-wrap: anywhere;
  cursor: text;
}

.message.other p{
  cursor: default;
}

.message-image {
  display: block;
  max-width: 100%;
  max-height: 300px;
  border-radius: 6px;
  object-fit: contain;
  cursor: zoom-in;
}

.edit-input {
  width: 100%;
  min-width: 200px;
  margin: 0;
  padding: 4px 6px;
  border: 1px solid var(--edit-input-border);
  border-radius: 4px;
  background: var(--edit-input-bg);
  color: white;
  font: inherit;
  line-height: 1.45;
  outline: none;
}

.delete-btn {
  position: absolute;
  top: 4px;
  right: 6px;
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--delete-color);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s, background 0.15s;
}

.delete-btn:hover {
  background: rgba(0, 0, 0, 0.25);
}

.message:hover .delete-btn {
  opacity: 1;
}

.message footer {
  display: flex;
  justify-content: flex-end;
  gap: 5px;
  margin-top: 6px;
  font-size: 10px;
}

.message.other footer{
  color: var(--text-muted);
}

.message.own footer{
  color: var(--bubble-own-footer);
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