export async function copyText(text) {
    if (navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text)
            return
        } catch {
            // Some mobile WebViews or HTTP origins need the selection fallback.
        }
    }
    const focused = document.activeElement
    const selection = document.getSelection()
    const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, i) => selection.getRangeAt(i).cloneRange()) : []
    const input = document.createElement('textarea')
    input.value = text
    input.setAttribute('readonly', '')
    input.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px;'
    document.body.appendChild(input)
    try {
        input.focus()
        input.select()
        input.setSelectionRange(0, text.length)
        if (!document.execCommand('copy')) throw new Error('Clipboard access unavailable')
    } finally {
        input.remove()
        focused?.focus?.({ preventScroll: true })
        if (selection) {
            selection.removeAllRanges()
            ranges.forEach(range => selection.addRange(range))
        }
    }
}
