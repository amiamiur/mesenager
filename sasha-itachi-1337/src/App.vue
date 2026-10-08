<script setup lang="ts">
// Импортим из vue 2 функции
// onMounted - запускает код после отображения всех компонентов
import { onMounted, ref } from "vue";

import Database from "@tauri-apps/plugin-sql";

import AppHeader from "./components/AppHeader.vue";
import MessageList from "./components/MessageList.vue";
import MessageComposer from "./components/MessageComposer.vue";
import ProfileModal from "./components/ProfileModal.vue";

import type {Message} from "./types/message.ts";
import type {User} from "./types/user.ts";


const showProfile = ref(false);
const profileUser = ref<User | null>(null);
const profileReadOnly = ref(false);

const CHAT_ID = 1;

const savedTheme = (localStorage.getItem("theme") as "dark" | "light" | null) ?? "dark";
const theme = ref<"dark" | "light">(savedTheme);

// Применяем тему сразу при загрузке до первого рендера
document.documentElement.setAttribute("data-theme", savedTheme);

function setTheme(t: "dark" | "light") {
  theme.value = t;
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem("theme", t);
}

// Строит структуру одного сообщения

const messages = ref<Message[]>([]);
const users  = ref<User[]>([]);
const currentUser = ref<User | null>(null);


const status = ref("Гомер бартов выпустил")

// Подключение к бд, пока его нет используем null
let db: Database | null = null;

async function initDatabase() {
  if (!db) return;

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
                                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                                       username TEXT NOT NULL UNIQUE,
                                       display_name TEXT NOT NULL,
                                       avatar_path TEXT,
                                       status TEXT NOT NULL DEFAULT '',
                                       created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS chats (
                                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                                       title TEXT NOT NULL
    )
  `);

  // ОДНОРАЗОВО: если messages старой схемы — сносим
  const cols = await db.select<{ name: string }[]>("PRAGMA table_info(messages)");
  const hasChatId = cols.some(c => c.name === "chat_id");
  const userCols = await db.select<{ name: string }[]>("PRAGMA table_info(users)");
  if (!userCols.some(c => c.name === "bio")) {
    console.log("[init] Добавляем колонку bio в users");
    await db.execute("ALTER TABLE users ADD COLUMN bio TEXT NOT NULL DEFAULT ''");
  }

  if (cols.length > 0 && !hasChatId) {
    console.log("[init] Старая схема messages — удаляем и пересоздаём");
    await db.execute("DROP TABLE messages");
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS messages (
                                          id INTEGER PRIMARY KEY AUTOINCREMENT,
                                          chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      type TEXT NOT NULL DEFAULT 'text',
      body TEXT,
      attachment TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CHECK (type IN ('text', 'image'))
      )
  `);

  await db.execute(`INSERT OR IGNORE INTO chats (id, title) VALUES (1, 'Первый чат')`);

  await db.execute(`
    INSERT OR IGNORE INTO users (id, username, display_name, status) VALUES
      (1, 'oleg227',    'Олег',   'В сети'),
      (2, 'kirill2010', 'Кирилл', 'В сети'),
      (3, 'mishasigma', 'Миша',   'В сети')
  `);
}

// Асинхр функция загрузки сообщений из бд

async function loadUsers(){
  if (!db) return;
  users.value = await db.select<User[]>(
      "SELECT id, username, display_name, avatar_path, status, bio, created_at FROM users ORDER BY id ASC",
  )
}

async function updateUser(
    id: number,
    data: { display_name: string; bio: string; avatar_path: string | null }
) {
  if (!db) return;

  await db.execute(
      "UPDATE users SET display_name = $1, bio = $2, avatar_path = $3 WHERE id = $4",
      [data.display_name, data.bio, data.avatar_path, id],
  );

  await loadUsers();

  if (currentUser.value && currentUser.value.id === id) {
    currentUser.value = users.value.find(u => u.id === id) ?? null;
  }

  await loadMessages();
  showProfile.value = false;
}

async function loadMessages(){
  if (!db) return;
  const rows = await db.select<Omit<Message, "author_name">[]>(
      "SELECT id, chat_id, author_id, type, body, attachment, created_at FROM messages WHERE chat_id = $1 ORDER BY id ASC",
      [CHAT_ID],
  );

  messages.value = rows.map(m => {
    const u = users.value.find(u => u.id === m.author_id);
    return{
      ...m,
      author_name: u?.display_name ?? "Хз кто",
      author_avatar: u?.avatar_path ?? null,
    };
  });
}

function selectUser(user: User){
  currentUser.value = user;
}

function openOwnProfile(){
  profileUser.value = currentUser.value;
  profileReadOnly.value = false;
  showProfile.value = true;
}

function openUserProfile(userId:number){
  const u = users.value.find(u => u.id === userId);
  if (!u) return;
  profileUser.value = u;
  profileReadOnly.value = true;
  showProfile.value = true;
}

function closeProfile(){
  showProfile.value = false;
  profileUser.value = null;
  profileReadOnly.value = false;
}

async function sendMessage(payload: {body: string | null, attachment: string | null}){
  if (!db || !currentUser.value) return;

  const type = payload.attachment ? "image" : "text";

  await db.execute(
      "INSERT INTO messages (chat_id, author_id, type, body, attachment) VALUES ($1, $2, $3, $4, $5)",
      [CHAT_ID, currentUser.value.id, type, payload.body, payload.attachment],
  )


  await loadMessages();
}

async function updateMessage(id: number, body: string) {
  if (!db || !currentUser.value) return;

  await db.execute(
      "UPDATE messages SET body = $1 WHERE id = $2 and author_id = $3",
      [body, id, currentUser.value.id]
  );
  await loadMessages();
}

async function deleteMessage(id: number) {
  if (!db || !currentUser.value) return;

  await db.execute(
      "DELETE FROM messages WHERE id = $1 and author_id = $2",
      [id, currentUser.value.id],
  );

  await loadMessages();
}

onMounted(async () => {
  console.log("=== onMounted start ===");

  try {

    db = await Database.load("sqlite:messenger.db");

    await initDatabase();

    try {
      const cols = await db.select<{ name: string }[]>(
          "PRAGMA table_info(messages)"
      );
      console.log("[4] Колонки messages:", cols.map(c => c.name));
    } catch (e) {
      console.error("[4] PRAGMA failed:", e);
    }

    // 5. Загрузка пользователей
    console.log("[5] loadUsers...");
    await loadUsers();
    console.log("[5] users count =", users.value.length);

    // 6. Загрузка сообщений
    console.log("[6] loadMessages...");
    await loadMessages();
    console.log("[6] messages count =", messages.value.length);

    // 7. Установка текущего пользователя
    if (users.value.length > 0) {
      currentUser.value = users.value[0];
      console.log("[7] currentUser =", currentUser.value.display_name);
    } else {
      console.warn("[7] Список пользователей пуст!");
    }

    status.value = "Локальная история сообщений";
    console.log("=== onMounted done ===");
  } catch (e) {
    console.error("=== onMounted FAILED ===", e);
    status.value = "Ошибка подключения в бд";
  }
});


</script>

<template>
  <main class="app">
    <AppHeader
        :status="status"
        :users="users"
        :current-user-id="currentUser?.id ?? null"
        :theme="theme"
        @select-user="selectUser"
        @set-theme="setTheme"
        @open-profile="openOwnProfile"
    />
    <section class="chat">
      <div class="chat-info">
          <h2>Первый чат</h2>
          <p>strannost</p>
      </div>

      <MessageList
          :messages="messages"
          :current-user-id="currentUser?.id ?? null"
          @update="updateMessage"
          @delete="deleteMessage"
          @open-profile="openUserProfile"
      />

      <MessageComposer @send="sendMessage"/>
    </section>
    <ProfileModal
        v-if="showProfile && profileUser"
        :user="profileUser"
        :readonly="profileReadOnly"
        @close="closeProfile"
        @save="(data) => updateUser(profileUser!.id, data)"
    />
  </main>
</template>

<style scoped>
:global(*){
  box-sizing: border-box;
}

/* темная тема */
:global(:root) {
  --bg: #111318;
  --bg-surface: #17191f;
  --bg-elevated: #20232a;
  --bg-hover: #2a2e36;
  --border: #292c34;
  --border-soft: #343842;
  --border-strong: #2e323b;
  --text: #f2f3f5;
  --text-muted: #8f96a3;
  --text-dim: #858c98;
  --text-soft: #afb5c0;
  --bubble-other-bg: #121212;
  --bubble-other-text: #efefef;
  --bubble-own-footer: #c8e4db;
  --badge-bg: #20232a;
  --badge-border: #343842;
  --badge-text: #afb5c0;
  --emoji-panel-bg: #1b1e25;
  --emoji-panel-border: #2e323b;
  --edit-input-bg: #2a4fb8;
  --edit-input-border: #ccd8f7;
  --delete-color: #ccd8f7;
  --composer-input-bg: #20232a;
  --composer-input-border: #343842;

  /* синий, не меняется между темами */
  --accent: #386be0;
  --accent-hover: #4779e8;
  --accent-focus: #4f7fea;
}

/* светлая тема */
:global([data-theme="light"]) {
  --bg: #eef1f6;
  --bg-surface: #ffffff;
  --bg-elevated: #e8ebf0;
  --bg-hover: #dde1e8;
  --border: #d8dce3;
  --border-soft: #d0d4dc;
  --border-strong: #c8cdd6;
  --text: #1a1d24;
  --text-muted: #6b7280;
  --text-dim: #6b7280;
  --text-soft: #4a5160;
  --bubble-other-bg: #ffffff;
  --bubble-other-text: #1a1d24;
  --bubble-own-footer: #d4e5ff;
  --badge-bg: #e8ebf0;
  --badge-border: #d0d4dc;
  --badge-text: #4a5160;
  --emoji-panel-bg: #ffffff;
  --emoji-panel-border: #d8dce3;
  --edit-input-bg: #386be0;
  --edit-input-border: #4f7fea;
  --delete-color: #ffffff;
  --composer-input-bg: #ffffff;
  --composer-input-border: #d8dce3;

  --accent: #386be0;
  --accent-hover: #4779e8;
  --accent-focus: #4f7fea;
}

:global(html){
  background: var(--bg);
}

:global(html[data-theme="dark"]){ color-scheme: dark; }
:global(html[data-theme="light"]){ color-scheme: light; }

:global(body){
  margin: 0;
  font-family: Inter, system-ui, -apple-system, "Segoe UI", sans-serif;
  color: var(--text);
  background: var(--bg);
}

.app{
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.chat-info{
  padding: 20px 25px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.chat-info h2{
  margin: 0;
  font-size: 16px;
}

.chat-info p{
  margin: 5px 0 0;
  color: var(--text-dim);
}

</style>