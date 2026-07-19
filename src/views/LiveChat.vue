<template>
    <v-container ref="chatContainer" class="py-6 chat-window position-relative" @scroll="handleScroll">
        <div id="top-sentinel" class="d-flex justify-center py-2" style="min-height: 25px;">
            <v-progress-circular v-if="isLoadingOlder" indeterminate size="20" color="secondary"></v-progress-circular>
        </div>

        <v-row v-for="(msg, index) in activeViewMessages" :key="msg.id || index" class="mb-4" no-gutters>
            <v-col cols="12" :class="['d-flex align-end', msg.sender_id === myId ? 'justify-end' : 'justify-start']">
                <v-avatar v-if="msg.sender_id !== myId" color="secondary" size="36" class="me-2 mb-1" theme="dark">
                    <span class="text-subtitle-2 font-weight-bold">{{ getAvatarInitials(msg.sender) }}</span>
                </v-avatar>
                <v-card :color="msg.sender_id === myId ? 'primary' : 'white'"
                    :theme="msg.sender_id === myId ? 'dark' : 'light'" max-width="70%" elevation="1" rounded="lg"
                    class="pa-3">

                    <div
                        :class="msg.sender_id !== myId ? `text-caption font-weight-bold text-secondary mb-1` : 'text-caption font-weight-bold text-amber-lighten-4 mb-1'">
                        {{ msg.sender || 'Unknown User' }}
                    </div>

                    <div class="text-body-2">{{ msg.text }}</div>

                    <div class="d-flex justify-end align-center mt-1"
                        style="font-size: 0.65rem !important; opacity: 0.7;">
                        <v-icon v-if="msg.syncStatus === 'pending'" size="10" class="me-1">mdi-clock-outline</v-icon>
                        <div>{{ msg.date }}</div>
                    </div>
                </v-card>
            </v-col>
        </v-row>

        <v-row v-if="isTyping" class="mb-4" no-gutters>
            <v-col cols="12" class="d-flex align-center justify-start">
                <v-avatar color="secondary" size="36" class="me-2" theme="dark">
                    <span class="text-subtitle-2 font-weight-bold">{{ getAvatarInitials(typingUser) }}</span>
                </v-avatar>
                <div class="typing-indicator-bubble pa-3">
                    <span class="text-caption font-weight-bold text-secondary d-block mb-1">{{ typingUser }}</span>
                    <div class="dots-container">
                        <span class="dot"></span>
                        <span class="dot"></span>
                        <span class="dot"></span>
                    </div>
                </div>
            </v-col>
        </v-row>

        <v-btn v-if="unreadCount > 0" color="secondary" class="unread-floating-btn" theme="dark" rounded="pill"
            @click="scrollToBottomAndRead">
            {{ unreadCount }} New Messages
            <v-icon class="ms-2">mdi-arrow-down</v-icon>
        </v-btn>
    </v-container>

    <v-bottom-navigation app height="72" color="white" class="border-top px-4">
        <v-row no-gutters align="center" class="w-100">
            <v-col cols="auto" class="pe-2">
                <v-menu v-model="emojiMenu" :close-on-content-click="true" location="top" offset="20">
                    <template v-slot:activator="{ props }">
                        <v-icon color="grey-darken-1" variant="text" v-bind="props">mdi-emoticon-happy-outline</v-icon>
                    </template>
                    <v-card class="pa-2 emoji-picker-card" width="100%" elevation="4" rounded="lg">
                        <v-row no-gutters class="emoji-grid">
                            <v-col cols="auto" v-for="emoji in emojis" :key="emoji" class="pa-1">
                                <v-btn variant="text" density="compact" class="emoji-btn" @click="addEmoji(emoji)">
                                    {{ emoji }}
                                </v-btn>
                            </v-col>
                        </v-row>
                    </v-card>
                </v-menu>
            </v-col>
            <v-col>
                <v-text-field v-model="newMessage" placeholder="Type a message..." variant="solo-filled"
                    density="compact" hide-details flat @keyup.enter="sendMessage"></v-text-field>
            </v-col>
            <v-col cols="auto" class="ps-3">
                <v-icon color="primary" :disabled="!newMessage.trim()" @click="sendMessage">mdi-send</v-icon>
            </v-col>
        </v-row>
    </v-bottom-navigation>
</template>
<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { db } from '@/utils/database'
import chatService from '@/services/chat.service'
import { useSocketIO } from '@hlf01/vue3-socket.io'
import moment from 'moment'

const isTyping = ref(false)
const typingUser = ref('')
const socket = useSocketIO()
const myId = ref(0)
const myName = ref('')
const newMessage = ref('')
let typingTimer = null
const chatContainer = ref(null)

const activeViewMessages = ref([])
const unreadCount = ref(0)

const INITIAL_LIMIT = 20
const SCROLL_CHUNK_LIMIT = 10
const currentLimit = ref(INITIAL_LIMIT)

const hasOlderLocal = ref(false)
const isLoadingOlder = ref(false)
const isUserAtBottom = ref(true)
const emojiMenu = ref(false)
const emojis = ref([
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
    '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
    '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
    '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
    '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
    '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾',
    '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿',
    '😾', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞',
    '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
    '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝',
    '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂',
    '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋',
    '🩸', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎'
])

const addEmoji = (emoji) => {
    newMessage.value += emoji
}
const refreshActiveView = async (preserveScrollDirection = null) => {
    try {
        const container = chatContainer.value?.$el || chatContainer.value;
        const previousScrollHeight = container ? container.scrollHeight : 0;
        const previousScrollTop = container ? container.scrollTop : 0;

        activeViewMessages.value = await db.messages
            .orderBy('id')
            .reverse()
            .limit(currentLimit.value)
            .toArray();
        activeViewMessages.value.reverse();

        if (activeViewMessages.value.length > 0) {
            const oldestInView = activeViewMessages.value[0].id;
            const olderCount = await db.messages.where('id').below(oldestInView).count();
            hasOlderLocal.value = olderCount > 0;
        }

        unreadCount.value = await db.messages.where('is_read').equals(0).count();

        await nextTick();
        if (container) {
            if (preserveScrollDirection === 'older') {
                container.scrollTop = previousScrollTop + (container.scrollHeight - previousScrollHeight);
            } else if (!preserveScrollDirection && isUserAtBottom.value) {
                container.scrollTop = container.scrollHeight;
            }
        }
    } catch (err) {
        console.error("Dexie Index mapping error:", err);
    }
}

const handleScroll = async (event) => {
    const container = event.target;
    if (!container) return;

    isUserAtBottom.value = container.scrollHeight - container.scrollTop <= container.clientHeight + 30;

    if (isUserAtBottom.value && unreadCount.value > 0) {
        await markAllAsRead();
    }

    if (container.scrollTop <= 15 && hasOlderLocal.value && !isLoadingOlder.value) {
        await loadOlderLocalChunks();
    }
}

const loadOlderLocalChunks = async () => {
    isLoadingOlder.value = true;
    currentLimit.value += SCROLL_CHUNK_LIMIT;
    await refreshActiveView('older');
    isLoadingOlder.value = false;
}

const markAllAsRead = async () => {
    await db.messages.where('is_read').equals(0).modify({ is_read: 1 });
    unreadCount.value = 0;
};

const scrollToBottom = async () => {
    await nextTick();
    const container = chatContainer.value?.$el || chatContainer.value;
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
}

const scrollToBottomAndRead = async () => {
    isUserAtBottom.value = true;
    await scrollToBottom();
    await markAllAsRead();
}

const syncUnreadFromNetwork = async () => {
    try {
        const lastMessage = await db.messages.orderBy('server_id').reverse().first();
        const queryParams = { limit: 50 };

        if (lastMessage && lastMessage.server_id) {
            queryParams.cursor = lastMessage.server_id;
            queryParams.direction = 'forward';
        }

        const res = await chatService.Get(queryParams);
        if (res?.data && res.data.length > 0) {
            await db.transaction('rw', db.messages, async () => {
                for (let msg of res.data) {
                    const existing = await db.messages.where('server_id').equals(msg.server_id).first();
                    if (!existing) {
                        await db.messages.add({
                            server_id: msg.server_id,
                            sender_id: msg.sender_id,
                            sender: msg.sender,
                            text: msg.text,
                            date: msg.date,
                            syncStatus: 'synced',
                            is_read: msg.sender_id === myId.value ? 1 : 0
                        });
                    }
                }
            });
        }
    } catch (e) {
        console.error("Network sync bypassed. Bootstrapping raw local cache index context.", e);
    }
}

const sendMessage = async () => {
    if (!newMessage.value.trim()) return

    const msgObj = {
        text: newMessage.value,
        sender: myName.value,
        sender_id: myId.value,
        date: moment().format("DD/MM/YYYY h:mm a"),
        syncStatus: 'pending',
        server_id: null,
        is_read: 1
    }

    newMessage.value = ''
    const localId = await db.messages.add(msgObj)

    currentLimit.value = INITIAL_LIMIT;
    isUserAtBottom.value = true;
    await refreshActiveView();
    await scrollToBottom();

    chatService.SendMessage(msgObj).then(res => {
        if (res.data?.success) {
            db.messages.update(localId, { syncStatus: 'synced', server_id: res.data.server_id })
                .then(() => refreshActiveView());
        }
    });
}

const getAvatarInitials = (name) => {
    if (!name) return '??';

    const words = name.trim().split(' ');
    const titleBypass = ['ko', 'ma', 'mg', 'u', 'daw'];
    const filteredWords = words.filter(word => !titleBypass.includes(word.toLowerCase()));
    const targetWords = filteredWords.length > 0 ? filteredWords : words;

    if (targetWords.length >= 2) {
        return (targetWords[0].charAt(0) + targetWords[1].charAt(0)).toUpperCase();
    } else {
        return targetWords[0].substring(0, 2).toUpperCase();
    }
}
const sendTypingEvent = async()=>{
    chatService.SendTypingEvent().then((res)=>{
        console.log(res)
    }).catch((err)=>{
        console.log(err)
    })
}
watch(()=> newMessage.value, (newVal)=>{
    if(newVal && newVal.length>0){
        sendTypingEvent()
    }
})
onMounted(async () => {
    const user = JSON.parse(localStorage.getItem('2duser') || '{}');
    if (user?.data) {
        myId.value = user.data.id;
        myName.value = user.data.name;
    }

    await syncUnreadFromNetwork();
    await refreshActiveView();
    await scrollToBottom();
    socket.subscribe('typing', async (data) => {
        if (data.sender_id === myId.value) return

        isTyping.value = true
        typingUser.value = data.sender || 'Someone'
         await scrollToBottom();
        clearTimeout(typingTimer)

        typingTimer = setTimeout(() => {
            isTyping.value = false
            typingUser.value = ''
        }, 500)
    })
    socket.subscribe('message', async (data) => {
        const existing = await db.messages.where('server_id').equals(data.server_id).first();

        if (existing) return;

        if (data.sender_id === myId.value) {
            const localPendingMsg = await db.messages
                .where('syncStatus')
                .equals('pending')
                .filter(m => m.text === data.text)
                .first();

            if (localPendingMsg) {
                await db.messages.update(localPendingMsg.id, {
                    server_id: data.server_id,
                    syncStatus: 'synced'
                });
                await refreshActiveView();
                return;
            }
        }

        const shouldMarkAsRead = isUserAtBottom.value;
        await db.messages.add({
            ...data,
            syncStatus: 'synced',
            is_read: shouldMarkAsRead ? 1 : 0
        });

        await refreshActiveView();
        if (shouldMarkAsRead) {
            await scrollToBottom();
        }
    });
})
</script>

<style scoped>
.chat-window {
    height: calc(100vh - 150px);
    overflow-y: auto;
    scroll-behavior: auto;
}

.unread-floating-btn {
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.typing-indicator-bubble {
    background-color: #f1f1f1;
    border-radius: 8px;
    max-width: 70%;
    box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.05);
}

.dots-container {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 12px;
}

.dot {
    width: 6px;
    height: 6px;
    background-color: #757575;
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) {
    animation-delay: -0.32s;
}

.dot:nth-child(2) {
    animation-delay: -0.16s;
}

@keyframes bounce {

    0%,
    80%,
    100% {
        transform: scale(0);
    }

    40% {
        transform: scale(1.0);
    }
}
</style>