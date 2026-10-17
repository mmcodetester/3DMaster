<template>
  <v-container class="chat-page pa-2 pa-md-5" fluid @keydown="typingSound.unlock" @pointerdown="typingSound.unlock">
    <v-alert
      v-if="chat.error || localError"
      class="mb-3"
      closable
      type="warning"
      variant="tonal"
      @click:close="chat.error = ''; localError = ''"
    >
      {{ localError || chat.error }}
    </v-alert>
    <div class="chat-shell" :class="{ 'show-conversation': showConversation }">
      <aside class="conversation-sidebar">
        <div class="pa-4 border-b">
          <div class="d-flex align-center justify-space-between mb-3">
            <div>
              <h1 class="text-h6 font-weight-bold">Chats</h1>
              <div class="text-caption text-medium-emphasis">
                <span class="presence-dot" :class="{ online: chat.connected }" />
                {{ chat.connected ? 'Connected' : 'Offline · messages will queue' }}
              </div>
            </div>
            <v-btn
              v-if="!chat.notificationsEnabled"
              aria-label="Enable chat notifications"
              icon="mdi-bell-outline"
              title="Enable chat notifications"
              variant="text"
              @click="toggleChatNotifications"
            />
            <v-btn
              aria-label="Create group chat"
              color="primary"
              :disabled="!chat.connected"
              icon="mdi-account-multiple-plus-outline"
              title="Create group chat"
              variant="tonal"
              @click="openGroup"
            />
          </div>
          <v-text-field
            v-model="search"
            clearable
            density="compact"
            hide-details
            placeholder="Search chats or people"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
          />
          <v-tabs
            v-model="tab"
            class="mt-2"
            color="primary"
            density="compact"
            grow
          >
            <v-tab value="chats">Conversations</v-tab>
            <v-tab value="people">People</v-tab>
          </v-tabs>
        </div>
        <v-alert
          v-if="chat.notificationError"
          class="ma-3 text-caption"
          closable
          density="compact"
          type="info"
          variant="tonal"
          @click:close="chat.notificationError = ''"
        >{{ chat.notificationError }}</v-alert>
        <div class="sidebar-content">
          <template v-if="tab === 'chats'">
            <v-list aria-label="Conversations" bg-color="transparent" class="pa-2">
              <v-list-item
                v-for="room in filteredRooms"
                :key="room.id"
                :active="room.id === chat.activeId"
                class="mb-1 py-2"
                color="primary"
                rounded="lg"
                @click="openRoom(room.id)"
              >
                <template #prepend>
                  <div class="conversation-avatar me-3"><v-avatar :color="room.type === 'direct' ? 'teal-lighten-5' : 'indigo-lighten-5'">
                    <v-icon :color="room.type === 'direct' ? 'teal' : 'indigo'" :icon="room.type === 'direct' ? 'mdi-account-outline' : room.type === 'group' ? 'mdi-account-group-outline' : 'mdi-forum-outline'" />
                  </v-avatar><span
                    v-if="isRoomOnline(room)"
                    aria-label="Online"
                    class="conversation-online-dot"
                    role="img"
                    title="Online"
                  /></div>
                </template>
                <v-list-item-title class="font-weight-medium">{{ room.name }}</v-list-item-title>
                <v-list-item-subtitle class="text-truncate" :title="conversationPreview(room.last_message, chat.accountId, room.type)">{{ conversationPreview(room.last_message, chat.accountId, room.type) }}</v-list-item-subtitle>
                <template #append><v-badge v-if="room.unread" color="primary" :content="room.unread" inline /></template>
              </v-list-item>
            </v-list>
            <p v-if="filteredRooms.length === 0" class="pa-5 text-body-2 text-medium-emphasis">{{ chat.rooms.length > 0 ? 'No matching conversations.' : 'Connect to load your conversations.' }}</p>
          </template>
          <template v-else>
            <v-btn-toggle
              v-model="peopleFilter"
              aria-label="Filter people by status"
              class="ma-3"
              color="primary"
              density="compact"
              divided
              mandatory
              variant="outlined"
            >
              <v-btn size="small" value="all">All</v-btn><v-btn size="small" value="online">Online</v-btn><v-btn size="small" value="offline">Offline</v-btn>
            </v-btn-toggle>
            <p v-if="!chat.connected" class="px-4 text-caption text-medium-emphasis">Connect to see current availability.</p>
            <v-list aria-label="People" bg-color="transparent" class="pa-2">
              <v-list-item
                v-for="person in filteredPeople"
                :key="person.id"
                class="mb-1 py-2"
                :disabled="creating || !chat.connected"
                rounded="lg"
                @click="openDirect(person)"
              >
                <template #prepend><v-avatar class="me-3 text-teal" color="teal-lighten-5">{{ initials(person.name) }}</v-avatar></template>
                <v-list-item-title>{{ person.name }}</v-list-item-title>
                <v-list-item-subtitle><span class="presence-dot" :class="{ online: person.online && chat.connected }" />{{ chat.connected ? person.online ? 'Online' : 'Offline' : 'Status unavailable' }}</v-list-item-subtitle>
                <template #append><v-icon icon="mdi-message-outline" size="small" /></template>
              </v-list-item>
            </v-list>
            <p v-if="filteredPeople.length === 0" class="pa-5 text-body-2 text-medium-emphasis">No people match this filter.</p>
          </template>
        </div>
        <div class="pa-3 border-t text-caption text-medium-emphasis">Private chats are visible only to their members.</div>
      </aside>

      <section aria-label="Selected conversation" class="conversation-panel">
        <template v-if="activeRoom">
          <header class="conversation-header pa-3 pa-md-4 border-b d-flex align-center ga-3">
            <v-btn
              aria-label="Back to conversations"
              class="back-button"
              icon="mdi-arrow-left"
              variant="text"
              @click="showConversation = false"
            />
            <v-avatar color="primary" size="42"><v-icon :icon="activeRoom.type === 'direct' ? 'mdi-account-outline' : 'mdi-account-group-outline'" /></v-avatar>
            <div class="flex-grow-1 min-width-0">
              <h2 class="text-subtitle-1 font-weight-bold text-truncate">{{ activeRoom.name }}</h2>
              <div class="text-caption text-medium-emphasis">{{ roomDescription(activeRoom) }}</div>
            </div>
            <v-btn
              v-if="activeRoom.type === 'group'"
              aria-label="View group members"
              icon="mdi-account-multiple-outline"
              variant="text"
              @click="membersDialog = true"
            />
          </header>
          <div v-if="activeRoom.pins?.length" class="pinned-strip px-3 py-2 border-b d-flex ga-2 overflow-x-auto">
            <v-icon icon="mdi-pin" size="small" />
            <div v-for="pin in activeRoom.pins" :key="pin.server_id" class="d-flex align-center flex-shrink-0">
              <v-btn
                aria-label="Go to pinned message"
                class="text-truncate"
                max-width="240"
                size="small"
                variant="text"
                @click="jumpTo(pin.server_id)"
              >{{ pin.text || (pin.attachment?.mime?.startsWith('image/') ? 'Photo' : pin.attachment?.name) || 'Photo/File' }}</v-btn>
              <v-btn
                aria-label="Unpin pinned message"
                :disabled="!chat.connected || pinning"
                icon="mdi-pin-off-outline"
                size="x-small"
                variant="text"
                @click.stop="togglePin(pin)"
              />
            </div>
          </div>
          <div
            ref="messageArea"
            aria-label="Messages"
            class="message-area pa-3 pa-md-5"
            role="log"
            @scroll="onScroll"
          >
            <div class="text-center mb-4">
              <v-btn
                v-if="chat.hasOlder"
                :disabled="!chat.connected"
                :loading="chat.loading"
                size="small"
                variant="text"
                @click="older"
              >Load earlier messages</v-btn>
            </div>
            <div v-if="chat.messages.length === 0" class="empty-conversation text-center text-medium-emphasis">
              <v-icon class="mb-3" icon="mdi-chat-outline" size="42" />
              <p>No messages yet. Say hello.</p>
              <p v-if="activeRoom.type === 'direct'" class="text-caption mt-2">You can send messages while this person is offline.</p>
            </div>
            <div
              v-for="message in chat.messages"
              :id="`chat-message-${message.server_id}`"
              :key="message.key"
              class="message-row"
              :class="{ mine: message.sender_id === chat.accountId }"
            >
              <v-avatar v-if="message.sender_id !== chat.accountId" class="mt-1 text-caption text-teal" color="teal-lighten-5" size="30">{{ initials(message.sender) }}</v-avatar>
              <div class="message-bubble" :class="{ 'own-bubble': message.sender_id === chat.accountId }">
                <div v-if="message.sender_id !== chat.accountId" class="text-caption font-weight-bold mb-1 text-teal">{{ message.sender }}</div>
                <button v-if="message.reply_to" class="reply-quote text-start mb-2" type="button" @click="jumpTo(message.reply_to.server_id)"><strong>{{ message.reply_to.sender }}</strong><span class="d-block text-caption text-truncate">{{ message.reply_to.text || 'Photo/File' }}</span></button>
                <ChatAttachment v-if="message.attachment" :attachment="message.attachment" :local-file="message.file_blob" @resize="atBottom && bottom()" />
                <div v-if="message.text" class="message-text text-body-2">{{ message.text }}</div>
                <div class="message-meta text-caption mt-1">
                  <span>{{ formatDate(message.date) }}</span>
                  <span v-if="message.sender_id === chat.accountId" class="ms-2">
                    <template v-if="message.syncStatus === 'pending'"><v-icon icon="mdi-clock-outline" size="12" /> Queued</template>
                    <template v-else-if="message.syncStatus === 'failed'"><v-icon icon="mdi-alert-circle-outline" size="12" /> Not sent</template>
                    <button v-else class="seen-status" type="button" @click="readersMessage = message"><v-icon :color="seenReaders(message).length > 0 ? 'primary' : undefined" :icon="seenReaders(message).length > 0 ? 'mdi-check-all' : 'mdi-check'" size="14" /> {{ seenReaders(message).length > 0 ? (activeRoom.type === 'direct' ? 'Seen' : `Seen by ${seenReaders(message).length}`) : 'Sent' }}</button>
                  </span>
                </div>
                <div v-if="message.server_id && !message.deleted" class="d-flex align-center justify-end">
                  <v-btn
                    v-if="message.sender_id === chat.accountId"
                    aria-label="Delete message"
                    :disabled="!chat.connected"
                    icon="mdi-delete-outline"
                    size="x-small"
                    variant="text"
                    @click="deleteTarget = message"
                  />
                  <v-btn
                    aria-label="Reply to message"
                    icon="mdi-reply"
                    size="x-small"
                    variant="text"
                    @click="replyTarget = message"
                  />
                  <v-btn
                    :aria-label="isPinned(message) ? 'Unpin message' : 'Pin message'"
                    :disabled="!chat.connected || pinning"
                    :icon="isPinned(message) ? 'mdi-pin-off-outline' : 'mdi-pin-outline'"
                    size="x-small"
                    variant="text"
                    @click="togglePin(message)"
                  />
                </div>
                <p v-if="message.syncStatus === 'pending' && message.file_blob" class="text-caption">{{ message.uploadProgress ? `Uploading ${message.uploadProgress}%` : 'File queued' }}</p>
                <div v-if="message.syncStatus === 'failed'" class="mt-2">
                  <p class="text-caption">{{ message.failure }}</p>
                  <v-btn size="x-small" variant="tonal" @click="retryMessage(message)">Retry</v-btn>
                </div>
              </div>
            </div>
          </div>
          <v-btn
            v-if="!atBottom"
            class="new-message-button"
            color="primary"
            rounded="pill"
            size="small"
            @click="bottom"
          >Latest messages <v-icon end icon="mdi-arrow-down" /></v-btn>
          <div aria-live="polite" class="typing-line px-4 text-caption text-medium-emphasis"><span v-if="chat.typing" aria-hidden="true" class="typing-dots"><i /><i /><i /></span>{{ chat.typing }}</div>
          <div v-if="replyTarget || selectedFile" class="px-3 py-2 border-t">
            <div v-if="replyTarget" class="d-flex align-center ga-2"><v-icon icon="mdi-reply" size="small" /><div class="flex-grow-1 min-width-0 text-caption"><strong>Reply to {{ replyTarget.sender }}</strong><div class="text-truncate">{{ replyTarget.text || replyTarget.attachment?.name || 'Photo/File' }}</div></div><v-btn
              aria-label="Cancel reply"
              icon="mdi-close"
              size="x-small"
              variant="text"
              @click="replyTarget = null"
            /></div>
            <div v-if="selectedFile" class="d-flex align-center ga-2 text-caption"><v-icon icon="mdi-paperclip" size="small" /><span class="flex-grow-1 text-truncate">{{ selectedFile.name }} · {{ (selectedFile.size / 1024 / 1024).toFixed(1) }} MB</span><v-btn
              aria-label="Remove selected file"
              icon="mdi-close"
              size="x-small"
              variant="text"
              @click="selectedFile = null"
            /></div>
          </div>
          <form class="composer pa-3 border-t" @submit.prevent="submit">
            <input
              ref="fileInput"
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.csv,.zip,.docx,.xlsx,.pptx"
              class="d-none"
              type="file"
              @change="chooseFile"
            >
            <v-btn aria-label="Attach photo or file" icon="mdi-paperclip" variant="text" @click="fileInput.click()" />
            <v-menu :close-on-content-click="false" location="top">
              <template #activator="{ props }"><v-btn v-bind="props" aria-label="Choose emoji" icon="mdi-emoticon-happy-outline" variant="text" /></template>
              <v-card class="pa-2 overflow-y-auto" max-height="220" width="280"><v-btn
                v-for="emoji in emojis"
                :key="emoji"
                size="small"
                variant="text"
                @click="draft += emoji"
              >{{ emoji }}</v-btn></v-card>
            </v-menu>
            <v-textarea
              v-model="draft"
              aria-label="Message"
              auto-grow
              density="compact"
              hide-details
              max-rows="5"
              :maxlength="4000"
              :placeholder="chat.connected ? 'Type a message…' : 'Write a message — sends when connected'"
              rows="1"
              variant="outlined"
              @input="sendTyping"
              @keydown.enter.exact="enterMessage"
            />
            <v-btn
              aria-label="Send message"
              color="primary"
              :disabled="(!draft.trim() && !selectedFile) || sending"
              icon="mdi-send"
              :loading="sending"
              type="submit"
            />
          </form>
        </template>
        <div v-else class="empty-conversation text-center text-medium-emphasis pa-6">
          <v-icon class="mb-4" icon="mdi-forum-outline" size="56" />
          <h2 class="text-h6">Your conversations</h2>
          <p class="mt-2">Choose a chat, message a person, or create a group.</p>
        </div>
      </section>
    </div>

    <v-dialog v-model="deleteDialog" max-width="400" :persistent="deleting">
      <v-card title="Delete message?">
        <v-card-text>This message will show as “Deleted Message” for everyone.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="deleting" @click="deleteTarget = null">Cancel</v-btn>
          <v-btn color="error" :loading="deleting" @click="removeMessage">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog max-width="420" :model-value="Boolean(readersMessage)" @update:model-value="!$event && (readersMessage = null)"><v-card title="Seen by"><v-list><v-list-item v-for="reader in seenReaders(readersMessage)" :key="reader.user_id" :subtitle="formatDate(reader.read_at)" :title="reader.name" /></v-list><v-card-text v-if="seenReaders(readersMessage).length === 0">Not seen yet.</v-card-text><v-card-actions><v-spacer /><v-btn @click="readersMessage = null">Close</v-btn></v-card-actions></v-card></v-dialog>
    <v-dialog v-model="groupDialog" max-width="480">
      <v-card rounded="lg" title="Create group chat">
        <v-card-text>
          <v-text-field
            v-model="groupName"
            autofocus
            counter="100"
            label="Group name"
            maxlength="100"
            variant="outlined"
          />
          <v-autocomplete
            v-model="selectedMembers"
            chips
            closable-chips
            :hint="`${selectedMembers.length} selected · you are included automatically`"
            item-title="name"
            item-value="id"
            :items="chat.users"
            label="Choose members"
            multiple
            persistent-hint
            variant="outlined"
          />
          <v-alert v-if="groupError" class="mt-3" type="error" variant="tonal">{{ groupError }}</v-alert>
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn :disabled="creating" @click="groupDialog = false">Cancel</v-btn><v-btn
          color="primary"
          :disabled="!groupName.trim() || selectedMembers.length === 0 || !chat.connected"
          :loading="creating"
          variant="flat"
          @click="makeGroup"
        >Create group</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="membersDialog" max-width="420">
      <v-card :title="activeRoom?.name">
        <v-card-subtitle>Group members</v-card-subtitle>
        <v-list><v-list-item v-for="member in activeRoom?.members || []" :key="member.id" :subtitle="member.id === chat.accountId ? 'You' : statusFor(member.id)" :title="member.name" /></v-list>
        <v-card-actions><v-spacer /><v-btn @click="membersDialog = false">Close</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
  import { Capacitor } from '@capacitor/core'
  import { NativeAudio } from '@capgo/capacitor-native-audio'
  import moment from 'moment'
  import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import typingAudioUrl from '@/assets/typing.mp3'
  import ChatAttachment from '@/components/ChatAttachment.vue'
  import { chat, createRoom, deleteMessage, loadOlder, markRoomRead, pinMessage, retryMessage, selectRoom, sendMessage, sendTyping, setViewingRoom, startChat, toggleChatNotifications } from '@/services/chat.state'
  import { conversationOnline, conversationPreview } from '@/utils/chat-messages'
  import Emoji from '@/utils/emoji'
  import { createTypingSound } from '@/utils/typing-sound'
  const route = useRoute()
  const typingSound = createTypingSound({
    native: Capacitor.isNativePlatform(), nativeAudio: NativeAudio,
    createAudio: url => new Audio(url), url: typingAudioUrl,
  })
  watch(() => chat.typingPulse, () => {
    if (chat.typing && chat.viewingRoomId === chat.activeId && !document.hidden) void typingSound.play()
  })
  const search = ref(''), tab = ref('chats'), peopleFilter = ref('all')
  const draft = ref(''), sending = ref(false), creating = ref(false), localError = ref('')
  const showConversation = ref(false), groupDialog = ref(false), membersDialog = ref(false)
  const groupName = ref(''), selectedMembers = ref([]), groupError = ref('')
  const messageArea = ref(null), atBottom = ref(true)
  const replyTarget = ref(null), selectedFile = ref(null), fileInput = ref(null), readersMessage = ref(null), pinning = ref(false)
  const media = window.matchMedia('(min-width: 701px)')
  const wideLayout = ref(media.matches)
  function onResize (event) {
    wideLayout.value = event.matches
  }
  watch([() => chat.activeId, wideLayout, showConversation], () => {
    void setViewingRoom(wideLayout.value || showConversation.value ? chat.activeId : null)
  }, { immediate: true })
  let consumedQueryRoom = null
  watch([() => route.query.room, () => chat.requestedRoomId, () => chat.rooms], () => {
    const requested = chat.requestedRoomId || (route.query.room === consumedQueryRoom ? null : route.query.room)
    if (!requested) return
    const accountMatches = chat.requestedRoomId || !route.query.chat_account || Number(route.query.chat_account) === chat.accountId
    const roomId = Number(requested)
    if (accountMatches && chat.rooms.some(room => room.id === roomId)) {
      consumedQueryRoom = route.query.room
      chat.requestedRoomId = null
      if (roomId !== chat.activeId || !showConversation.value) void openRoom(roomId)
    }
  }, { immediate: true, flush: 'post' })
  let preservingScroll = false
  const emojis = Emoji.emojis
  const activeRoom = computed(() => chat.rooms.find(room => room.id === chat.activeId))
  const matches = name => name.toLocaleLowerCase().includes((search.value || '').toLocaleLowerCase())
  const filteredRooms = computed(() => chat.rooms.filter(room => matches(room.name)))
  const filteredPeople = computed(() => chat.users.filter(person => matches(person.name) && (peopleFilter.value === 'all' || (peopleFilter.value === 'online' ? chat.connected && person.online : chat.connected && !person.online))))
  const statusFor = id => chat.connected ? (chat.users.find(user => user.id === id)?.online ? 'Online' : 'Offline') : 'Status unavailable'
  const isRoomOnline = room => conversationOnline(room, chat.users, chat.connected, chat.accountId)
  function roomDescription (room) {
    if (room.type === 'general') return 'Shared with everyone'
    if (room.type === 'group') return `${room.members.length} members`
    return statusFor(room.members.find(member => member.id !== chat.accountId)?.id)
  }
  const initials = name => (name || '?').trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase()
  const formatDate = date => moment(date).format('DD MMM · h:mm a')
  async function bottom () {
    await nextTick()
    if (messageArea.value) messageArea.value.scrollTop = messageArea.value.scrollHeight
    atBottom.value = true
    void markRoomRead()
  }
  function onScroll () {
    const element = messageArea.value
    if (element) atBottom.value = element.scrollHeight - element.scrollTop - element.clientHeight < 70
    if (atBottom.value) void markRoomRead()
  }
  async function openRoom (id) {
    draft.value = ''
    showConversation.value = true
    await selectRoom(id)
    await bottom()
  }
  function chooseFile (event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size === 0 || file.size > 10 * 1024 * 1024) {
      localError.value = 'Choose a file between 1 byte and 10 MB.'
      return
    }
    selectedFile.value = file
  }
  function isPinned (message) {
    return activeRoom.value?.pins?.some(pin => pin.server_id === message.server_id) || false
  }
  const deleteTarget = ref(null), deleting = ref(false)
  const deleteDialog = computed({
    get: () => Boolean(deleteTarget.value),
    set: value => {
      if (!value && !deleting.value) deleteTarget.value = null
    },
  })
  async function removeMessage () {
    const message = deleteTarget.value
    if (!message || deleting.value) return
    deleting.value = true
    try {
      await deleteMessage(message)
      if (replyTarget.value?.server_id === message.server_id) replyTarget.value = null
      deleteTarget.value = null
    } catch (error) {
      localError.value = error.response?.data?.message || 'Unable to delete message. Please try again.'
      deleteTarget.value = null
    } finally {
      deleting.value = false
    }
  }

  async function togglePin (message) {
    pinning.value = true
    try {
      await pinMessage(message, !isPinned(message))
    } catch (error) {
      localError.value = error.response?.data?.message || 'Unable to update pinned message.'
    } finally {
      pinning.value = false
    }
  }
  async function jumpTo (id) {
    const room = chat.activeId
    atBottom.value = false
    preservingScroll = true
    try {
      await nextTick()
      let element = messageArea.value?.querySelector(`#chat-message-${id}`)
      while (!element && chat.hasOlder && chat.connected && !chat.loading && chat.activeId === room) {
        const count = chat.messages.length
        await loadOlder()
        await nextTick()
        if (chat.activeId !== room) return
        element = messageArea.value?.querySelector(`#chat-message-${id}`)
        if (chat.messages.length === count) break
      }
      if (chat.activeId !== room) return
      if (element && messageArea.value) {
        const area = messageArea.value
        const top = area.scrollTop + element.getBoundingClientRect().top - area.getBoundingClientRect().top
        area.scrollTo({ top: Math.max(0, top - (area.clientHeight - element.clientHeight) / 2), behavior: 'smooth' })
      } else {
        localError.value = 'Message unavailable. Connect and try again.'
      }
    } finally {
      preservingScroll = false
    }
  }
  function seenReaders (message) {
    if (!message?.server_id) return []
    return (activeRoom.value?.reads || []).filter(reader => reader.user_id !== message.sender_id && reader.message_id >= message.server_id).map(reader => ({ ...reader,
                                                                                                                                                             name: reader.user_id === chat.accountId ? 'You' : activeRoom.value?.members?.find(member => member.id === reader.user_id)?.name || chat.users.find(user => user.id === reader.user_id)?.name || 'Member',
    }))
  }
  function openGroup () {
    groupName.value = ''
    selectedMembers.value = []
    groupError.value = ''
    groupDialog.value = true
  }
  async function makeGroup () {
    creating.value = true
    groupError.value = ''
    try {
      await createRoom({ type: 'group', name: groupName.value, member_ids: selectedMembers.value })
      groupDialog.value = false
      tab.value = 'chats'
      showConversation.value = true
      draft.value = ''
      await bottom()
    } catch (error) {
      groupError.value = error.response?.data?.message || 'Unable to create group. Please try again.'
    } finally {
      creating.value = false
    }
  }
  async function openDirect (person) {
    creating.value = true
    try {
      const room = chat.rooms.find(item => item.type === 'direct' && item.members.some(member => member.id === person.id))
      if (room) await openRoom(room.id)
      else {
        await createRoom({ type: 'direct', member_ids: [person.id] })
        draft.value = ''
        showConversation.value = true
        await bottom()
      }
      tab.value = 'chats'
    } catch (error) {
      localError.value = error.response?.data?.message || 'Unable to open individual chat.'
    } finally {
      creating.value = false
    }
  }
  async function submit () {
    if (sending.value || (!draft.value.trim() && !selectedFile.value)) return
    sending.value = true
    try {
      await sendMessage(draft.value, { reply: replyTarget.value, file: selectedFile.value })
      replyTarget.value = null
      selectedFile.value = null
      draft.value = ''
      await bottom()
    } catch {
      localError.value = 'Could not save this message on your device. Please try again.'
    } finally {
      sending.value = false
    }
  }
  function enterMessage (event) {
    if (event.isComposing) return
    event.preventDefault()
    void submit()
  }
  async function older () {
    const element = messageArea.value
    const previousHeight = element?.scrollHeight || 0
    const previousTop = element?.scrollTop || 0
    preservingScroll = true
    try {
      await loadOlder()
      await nextTick()
      if (element) element.scrollTop = previousTop + element.scrollHeight - previousHeight
    } finally {
      preservingScroll = false
    }
  }
  watch(() => chat.messages.length, () => {
    if (atBottom.value && !preservingScroll) void bottom()
  })
  watch(() => chat.messages, messages => {
    if (messages.find(message => message.server_id === replyTarget.value?.server_id)?.deleted) replyTarget.value = null
    if (messages.find(message => message.server_id === deleteTarget.value?.server_id)?.deleted && !deleting.value) deleteTarget.value = null
  })
  watch(() => chat.activeId, () => {
    deleteTarget.value = null
    replyTarget.value = null
    selectedFile.value = null
    readersMessage.value = null
    draft.value = ''
  })
  function visibilityChanged () {
    if (!document.hidden && chat.activeId && showConversation.value) void selectRoom(chat.activeId)
  }
  onMounted(async () => {
    void typingSound.initialize()
    try {
      await startChat()
      await bottom()
    } catch {
      localError.value = 'Unable to open chat storage.'
    }
    document.addEventListener('visibilitychange', visibilityChanged)
    media.addEventListener('change', onResize)
  })
  onUnmounted(() => {
    void typingSound.dispose()
    document.removeEventListener('visibilitychange', visibilityChanged)
    media.removeEventListener('change', onResize)
    void setViewingRoom(null)
  })
</script>

<style scoped>
.reply-quote { display: block; width: 100%; max-width: 280px; border-left: 3px solid rgb(var(--v-theme-primary)); padding: 6px 10px; background: rgba(var(--v-theme-primary), .08); color: inherit; border-radius: 4px; cursor: pointer; }
.seen-status { color: inherit; cursor: pointer; }
.pinned-strip { flex-shrink: 0; }
.typing-dots { display: inline-flex; align-items: center; gap: 3px; margin-right: 8px; }
.typing-dots i { width: 4px; height: 4px; border-radius: 50%; background: currentColor; animation: typing-bounce 1s infinite; }
.typing-dots i:nth-child(2) { animation-delay: .15s; }
.typing-dots i:nth-child(3) { animation-delay: .3s; }
@keyframes typing-bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-3px); } }
@media (prefers-reduced-motion: reduce) { .typing-dots i { animation: none; } }
.conversation-avatar { position: relative; flex-shrink: 0; }
.conversation-online-dot { position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; border: 2px solid rgb(var(--v-theme-surface)); border-radius: 50%; background: #16a36b; }
.chat-page { max-width: 1440px; }
.chat-shell { color: rgb(var(--v-theme-on-surface)); display: grid; grid-template-columns: 320px minmax(0, 1fr); height: calc(100dvh - 112px); min-height: 440px; background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface), .12); border-radius: 16px; overflow: hidden; box-shadow: 0 6px 30px #18264a08; }
.conversation-sidebar { display: flex; flex-direction: column; min-height: 0; border-right: 1px solid rgba(var(--v-theme-on-surface), .12); background: rgb(var(--v-theme-surface)); }
.sidebar-content { flex: 1; overflow-y: auto; }
.conversation-panel { display: flex; flex-direction: column; min-height: 0; min-width: 0; position: relative; }
.conversation-header { background: rgb(var(--v-theme-surface)); }
.message-area { flex: 1; overflow-y: auto; background: rgb(var(--v-theme-background)); }
.message-row { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 16px; }
.message-row.mine { justify-content: flex-end; }
.message-bubble { max-width: 78%; padding: 10px 14px; border: 1px solid rgba(var(--v-theme-on-surface), .12); border-radius: 3px 15px 15px; background: rgb(var(--v-theme-surface)); min-width: 95px; }
.own-bubble { border-radius: 15px 3px 15px 15px; background: rgba(var(--v-theme-primary), .14); border-color: rgba(var(--v-theme-primary), .24); }
.message-text { white-space: pre-wrap; overflow-wrap: anywhere; }
.message-meta { color: rgba(var(--v-theme-on-surface), .65); text-align: right; font-size: 10px !important; }
.composer { display: flex; align-items: flex-end; gap: 8px; background: rgb(var(--v-theme-surface)); }
.typing-line { min-height: 24px; background: rgb(var(--v-theme-background)); }
.presence-dot { display: inline-block; width: 7px; height: 7px; margin-right: 5px; border-radius: 50%; background: #9aa5b5; }
.presence-dot.online { background: #16a36b; }
.empty-conversation { margin: auto; padding-top: 70px; padding-bottom: 70px; }
.new-message-button { position: absolute; bottom: 108px; align-self: center; }
.min-width-0 { min-width: 0; }
.back-button { display: none; }
@media (max-width: 700px) {
  .chat-shell { grid-template-columns: 1fr; height: calc(100dvh - 88px); min-height: 340px; border-radius: 10px; }
  .conversation-panel { display: none; }
  .show-conversation .conversation-sidebar { display: none; }
  .show-conversation .conversation-panel { display: flex; }
  .back-button { display: inline-flex; }
  .message-bubble { max-width: 88%; }
}
</style>
