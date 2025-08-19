'use client'

import { User } from '@/types/room'

interface ResultsExportProps {
  users: User[]
}

export default function ResultsExport({ users }: ResultsExportProps) {
  const exportJSON = () => {
    const data = users.map((u) => ({ name: u.name, vote: u.vote }))
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'results.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportCSV = () => {
    const header = 'name,vote\n'
    const rows = users
      .map((u) => `${u.name},${u.vote ?? ''}`)
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'results.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!users.length) return null

  return (
    <div className="flex gap-2 justify-end mt-4">
      <button
        onClick={exportCSV}
        className="px-3 py-1 bg-[#00A550] text-white rounded-md text-sm"
      >
        CSV
      </button>
      <button
        onClick={exportJSON}
        className="px-3 py-1 bg-[#00A550] text-white rounded-md text-sm"
      >
        JSON
      </button>
    </div>
  )
}
