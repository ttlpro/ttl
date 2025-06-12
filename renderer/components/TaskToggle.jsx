import React from 'react'

export default function TaskToggle({ task, onChange }) {
  console.log('TaskToggle render:', { id: task.id, enabled: task.enabled });
  
  return (
    <div className="flex items-center space-x-2">
      <span className="text-xs text-gray-400">
        {task.enabled ? 'ON' : 'OFF'}
      </span>
      <button
        onClick={() => {
          console.log('TaskToggle clicked, changing to:', !task.enabled);
          onChange(!task.enabled);
        }}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          task.enabled ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            task.enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
} 