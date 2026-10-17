<template>
  <div ref="root" class="chat-attachment my-2">
    <button
      v-if="preview"
      aria-label="View photo"
      class="photo-preview"
      type="button"
      @click="expanded = true"
    ><img :alt="isImage ? 'Photo' : attachment.name" :src="preview" @load="$emit('resize')"></button>
    <div class="d-flex align-center ga-2">
      <v-icon v-if="!isImage" icon="mdi-file-document-outline" size="small" />
      <span v-if="!isImage" class="text-caption text-truncate">{{ attachment.name }} · {{ sizeLabel }}</span>
      <v-btn
        aria-label="Save or share attachment"
        :disabled="busy"
        icon="mdi-download"
        :loading="busy"
        size="x-small"
        variant="text"
        @click="download"
      />
    </div>
    <p v-if="error" class="text-caption text-error">{{ error }} <button type="button" @click="loadPreview">Retry</button></p>
    <v-dialog v-model="expanded" max-width="900"><v-card><v-img :alt="isImage ? 'Photo' : attachment.name" contain max-height="80vh" :src="preview" /><v-card-actions><v-btn @click="download">Save / share</v-btn><v-spacer /><v-btn @click="expanded = false">Close</v-btn></v-card-actions></v-card></v-dialog>
  </div>
</template>
<script setup>
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { attachmentBlob, openAttachment } from '@/services/chat.attachments'
  const props = defineProps({ attachment: { type: Object, required: true }, localFile: { type: Blob, default: null } })
  defineEmits(['resize'])
  const root = ref(null), preview = ref(''), expanded = ref(false), error = ref(''), busy = ref(false)
  const isImage = computed(() => props.attachment.mime?.startsWith('image/'))
  const sizeLabel = computed(() => props.attachment.size >= 1024 * 1024 ? `${(props.attachment.size / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(props.attachment.size / 1024)} KB`)
  let observer, disposed = false
  async function loadPreview () {
    if (!props.attachment.mime?.startsWith('image/') || preview.value) return
    try {
      error.value = ''
      const blob = await attachmentBlob(props.attachment, props.localFile)
      if (!disposed) preview.value = URL.createObjectURL(blob)
    } catch {
      if (!disposed) error.value = 'Photo unavailable. Connect and retry.'
    }
  }
  async function download () {
    busy.value = true
    error.value = ''
    try {
      await openAttachment(props.attachment, props.localFile)
    } catch {
      error.value = 'Unable to open file. Connect and retry.'
    } finally {
      busy.value = false
    }
  }
  watch(() => [props.attachment.id, props.attachment.mime], () => {
    if (!preview.value) void loadPreview()
  })
  onMounted(() => {
    if (typeof IntersectionObserver === 'undefined') {
      void loadPreview()
      return
    }
    observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer.disconnect()
        void loadPreview()
      }
    })
    observer.observe(root.value)
  })
  onUnmounted(() => {
    disposed = true
    observer?.disconnect()
    if (preview.value) URL.revokeObjectURL(preview.value)
  })
</script>
<style scoped>
.chat-attachment { max-width: 280px; }
.photo-preview { display: block; width: 100%; cursor: zoom-in; }
.photo-preview img { display: block; max-height: 260px; max-width: 100%; border-radius: 8px; object-fit: contain; }
</style>
