// Thêm method mới
getRoomViewerHistory: async (roomId, days) => {
  return await window.ipcRenderer.invoke('get-room-viewer-history', roomId, days)
} 