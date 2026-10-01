<script setup lang="ts">
// Импортим из vue 2 функции
// onMounted - запускает код после отображения всех компонентов
import { onMounted, ref } from "vue";

import Database from "@tauri-apps/plugin-sql";

import AppHeader from "./components/AppHeader.vue";
import MessageList from "./components/MessageList.vue";
import MessageComposer from "./components/MessageComposer.vue";

import type {Message} from "./types/message.ts";
import type {User} from "./types/user.ts";

const CHAT_ID = 1;


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

  // ⚠️ ОДНОРАЗОВО: если messages старой схемы — сносим
  const cols = await db.select<{ name: string }[]>("PRAGMA table_info(messages)");
  const hasChatId = cols.some(c => c.name === "chat_id");

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
      "SELECT id, username, display_name, avatar_path, status, created_at FROM users ORDER BY id ASC",
  )
}

async function loadMessages(){
  if (!db) return;
  const rows = await db.select<Omit<Message, "author_name">[]>(
      "SELECT id, chat_id, author_id, type, body, attachment, created_at FROM messages WHERE chat_id = $1 ORDER BY id ASC",
      [CHAT_ID],
  );

  messages.value = rows.map(m => ({
    ...m,
    author_name: users.value.find(u => u.id === m.author_id)?.display_name ?? "Хз кто",
  }));
}

function selectUser(user: User){
  currentUser.value = user;
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
        @select-user="selectUser"
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
      />

      <MessageComposer @send="sendMessage"/>
    </section>
  </main>
</template>

<style scoped>
:global(*){
  box-sizing: border-box;
}

:global(html){
  background: #111318;
  color-scheme: dark;
}

:global(body){
  margin: 0;

  font-family: Inter,
  system-ui,
  -apple-system,
  BlickMacSystemFont,
  "Segoe UI",
  sans-serif;

  color: #f2f3f5;
  background: #111318;
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
  border-bottom: 1px solid #252830;
  flex-shrink: 0;
}

.chat-info h2{
  margin: 0;
  font-size: 16px;
}

.chat-info p{
  margin: 5px 0 0;
  color: #858c98;
}

</style>