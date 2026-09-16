<script setup lang="ts">
import {convertFileSrc} from "@tauri-apps/api/core";
import type {Message} from "../types/message.ts";

defineProps<{
  message: Message;
}>()
</script>

<template>
  <article class="message">
    <img
        v-if="/\.(png|jpe?g|webp)$/i.test(message.body)"
        :src="convertFileSrc(message.body)"
        class="message-image"
    />
    <p v-else>{{ message.body }}</p>

    <footer>
      <span> {{ message.author }} </span>
      <span> | </span>
      <span> {{ message.created_at }}</span>
    </footer>
  </article>
</template>

<style scoped>
.message{
  align-self: flex-end;
  max-width: 70%;
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: #386be0;
}

.message p{
  margin: 0;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.message-image {
  display: block;
  max-width: 100%;
  max-height: 300px;
  border-radius: 6px;
  object-fit: contain;
}

.message footer{
  display: flex;
  justify-content: flex-end;
  gap: 5px;
  margin-top: 6px;
  color: #ccd8f7;
  font-size: 10px;
}
</style>