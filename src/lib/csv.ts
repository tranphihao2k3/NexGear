export function toCsv<T extends Record<string, unknown>>(rows: T[]): string {
    if (rows.length === 0) return ''

    const headers = Object.keys(rows[0])
    const headerRow = headers.join(',')
    const bodyRows = rows.map((row) =>
        headers
            .map((header) => escapeCsvValue(row[header]))
            .join(',')
    )

    return [headerRow, ...bodyRows].join('\n')
}

export function downloadCsv(filename: string, csvContent: string) {
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

function escapeCsvValue(value: unknown): string {
    if (value == null) return ''

    const stringValue = String(value)
    if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`
    }

    return stringValue
}
