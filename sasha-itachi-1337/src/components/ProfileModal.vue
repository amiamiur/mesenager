<script setup lang="ts">
import { ref, watch } from "vue";
import { open } from "@tauri-apps/plugin-dialog";
import { copyFile, mkdir, BaseDirectory } from "@tauri-apps/plugin-fs";
import { readImageAsDataUrl } from "../utils/readImage";
import type { User } from "../types/user.ts";

const props = defineProps<{
  user: User;
}>();

const emit = defineEmits<{
  close: []
  save: [data: { display_name: string; bio: string; avatar_path: string | null }]
}>();

const displayName = ref("");
const bio = ref("");
const avatarPath = ref<string | null>(null);
const avatarSrc = ref("");
const busy = ref(false);

watch(
    () => props.user,
    async (user) => {
      displayName.value = user.display_name;
      bio.value = user.bio ?? "";
      avatarPath.value = user.avatar_path;
      avatarSrc.value = user.avatar_path
          ? await readImageAsDataUrl(user.avatar_path)
          : "";
    },
    { immediate: true }
);

async function pickAvatar() {
  try {
    busy.value = true;

    const file = await open({
      multiple: false,
      directory: false,
      filters: [
        { name: "Images", extensions: ["png", "jpg", "jpeg"] }
      ],
    });

    if (!file || Array.isArray(file)) return;

    const name = file.split(/[\\/]/).pop();
    if (!name) return;

    const ext = name.split(".").pop()!.toLowerCase();
    const newName = `${props.user.username}_${Date.now()}.${ext}`;
    const relative = `avatars/${newName}`;

    await mkdir("avatars", {
      baseDir: BaseDirectory.AppData,
      recursive: true,
    });

    await copyFile(file, relative, {
      toPathBaseDir: BaseDirectory.AppData,
    });

    avatarPath.value = relative;
    avatarSrc.value = await readImageAsDataUrl(relative);
  } catch (e) {
    console.error("Ошибка при выборе аватара:", e);
  } finally {
    busy.value = false;
  }
}

function save() {
  emit("save", {
    display_name: displayName.value.trim() || props.user.display_name,
    bio: bio.value.trim(),
    avatar_path: avatarPath.value,
  });
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal">
      <h2>Профиль</h2>

      <div class="avatar-block">
        <div class="avatar-preview">
          <img v-if="avatarSrc" :src="avatarSrc" alt="" />
          <span v-else>{{ user.display_name[0] }}</span>
        </div>
        <button type="button" :disabled="busy" @click="pickAvatar">
          {{ busy ? "Загрузка…" : "Сменить аватар" }}
        </button>
      </div>

      <label>
        <span>Ник</span>
        <input v-model="displayName" type="text" maxlength="32" />
      </label>

      <label>
        <span>О себе</span>
        <textarea
            v-model="bio"
            rows="4"
            maxlength="300"
            placeholder="Пара слов о себе"
        ></textarea>
      </label>

      <div class="actions">
        <button type="button" class="ghost" @click="emit('close')">
          Отмена
        </button>
        <button type="button" class="primary" @click="save">
          Сохранить
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.modal {
  width: 100%;
  max-width: 420px;
  padding: 24px;
  border-radius: 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal h2 {
  margin: 0;
  font-size: 18px;
}

.avatar-block {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-preview {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 600;
  color: var(--text-soft);
  flex-shrink: 0;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-block button {
  padding: 8px 14px;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: var(--bg-elevated);
  color: var(--text);
  font: inherit;
  cursor: pointer;
}

.avatar-block button:hover:not(:disabled) {
  background: var(--bg-hover);
}

.avatar-block button:disabled {
  opacity: 0.6;
  cursor: default;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--text-muted);
}

label input,
label textarea {
  padding: 10px 12px;
  border: 1px solid var(--composer-input-border);
  border-radius: 6px;
  background: var(--composer-input-bg);
  color: var(--text);
  font: inherit;
  outline: none;
  resize: vertical;
}

label input:focus,
label textarea:focus {
  border-color: var(--accent-focus);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.actions button {
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.actions .ghost {
  background: var(--bg-elevated);
  color: var(--text);
}

.actions .ghost:hover {
  background: var(--bg-hover);
}

.actions .primary {
  background: var(--accent);
  color: white;
}

.actions .primary:hover {
  background: var(--accent-hover);
}
</style>