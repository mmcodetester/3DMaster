function permutations(number) {
    if (number.length === 1) return [number]
    return [...new Set([...number].flatMap((digit, index) =>
        permutations(number.slice(0, index) + number.slice(index + 1)).map(rest => digit + rest),
    ))]
}

export function formatUnsubmittedOrders(rows) {
    const totals = new Map()
    for (const row of rows) {
        const number = String(row.number ?? '').trim().padStart(3, '0')
        const amount = Number(row.total_amount)
        const extra = Number(row.total_extra ?? 0)
        if (!/^\d{3}$/.test(number) || row.number == null || String(row.number).trim() === '' ||
            row.total_amount == null || !Number.isSafeInteger(amount) || amount < 0 ||
            !Number.isSafeInteger(extra) || extra < 0) {
            throw new Error('စာရင်းအချက်အလက် မပြည့်စုံသဖြင့် ကူးယူ၍မရပါ။')
        }
        const total = totals.get(number) || { number, amount: 0, extra: 0 }
        total.amount += amount
        total.extra += extra
        if (!Number.isSafeInteger(total.amount) || !Number.isSafeInteger(total.extra)) {
            throw new Error('စုစုပေါင်းပမာဏ မမှန်ပါ။')
        }
        totals.set(number, total)
    }

    const copied = new Set()
    const lines = []
    for (const row of [...totals.values()].sort((a, b) => a.number.localeCompare(b.number))) {
        if (copied.has(row.number)) continue
        const variants = permutations(row.number).sort()
        const group = variants.map(number => totals.get(number))
        // R expands to every unique permutation, so only compress complete groups.
        if (variants.length > 1 && group.every(item => item && item.extra === 0)) {
            const counts = new Map()
            group.forEach(item => counts.set(item.amount, (counts.get(item.amount) || 0) + 1))
            const common = [...counts].find(([, count]) => count >= variants.length - 1)
            if (common) {
                const original = group.find(item => item.amount !== common[0]) || group[0]
                lines.push(`${original.number}=${original.amount}R${common[0]},`)
                variants.forEach(number => copied.add(number))
                continue
            }
        }
        lines.push(`${row.number}=${row.amount}${row.extra ? `*${row.extra}` : ''},`)
        copied.add(row.number)
    }
    return lines.join('\n')
}
