import React from 'react'

export default function Toggle({ checked, enabled, onChange }) {
  // Support both checked and enabled props
  const isEnabled = checked !== undefined ? checked : enabled
  
  // console.log('Toggle render:', { checked, enabled, isEnabled }); // Debug
  
  if (isEnabled === undefined) {
    console.warn('Toggle: No checked or enabled prop provided');
    return null; // Return null instead of crashing
  }
  
  return (
    <button
      type="button"
      onClick={() => onChange && onChange(!isEnabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        isEnabled 
          ? 'bg-blue-600 hover:bg-blue-700' 
          : 'bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500'
      }`}
    >
      <span className="sr-only">Toggle</span>
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
          isEnabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
} 