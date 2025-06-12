const { log, error } = require('../../lib/logger');
const GroupView = require('../businesses/Viewer');
const helper = require('../businesses/helper');
const notificationManager = require('../../lib/notification-manager');
const { dialog, BrowserWindow } = require('electron');

const roomHandlers = (storageManager, viewerManager) => {
  return {
    'get-rooms': async () => {
      try {
        const rooms = await storageManager.getAllRooms()
        return { success: true, rooms }
      } catch (err) {
        console.error('Error getting rooms:', err)
        return { success: false, error: err.message, rooms: [] }
      }
    },

    'add-room': async (event, roomData) => {
      try {
        log('🏠 Gọi add-room');
        
        // Kiểm tra license trước khi thêm room
        const licenseActive = await storageManager.isLicenseActive();
        if (!licenseActive) {
          return {
            success: false,
            error: 'License not active - Room management feature is disabled'
          };
        }

        // Kiểm tra license limits cho rooms
        const limitResult = await storageManager.checkRoomLimit(1);
        
        if (!limitResult.allowed) {
          return {
            success: false,
            error: limitResult.message || 'Cannot start room - license limit exceeded'
          };
        }
        
        log("roomData",roomData)
        let roomId = roomData.roomUrl.trim();
        
        // Nếu là URL TikTok, chỉ lấy username
        if (roomData.roomUrl.includes('tiktok.com')) {
            // Extract từ format @username/live
            const usernameMatch = roomData.roomUrl.match(/@([^\/]+)\/live/);
            if (usernameMatch) {
                roomId = usernameMatch[1]; // Chỉ lấy username
            } else {
                // Fallback: extract từ các format khác nếu có
                const urlMatch = roomData.roomUrl.match(/\/live\/(\w+)/);
                if (urlMatch) {
                    roomId = urlMatch[1];
                }
            }
        }
        // Nếu không phải URL, giữ nguyên input (đó chính là room_id)
        let avatarThumb = null;
        let roomUsername = roomId;
        let roomStatus = 2;
        let startCount = 0;
        if(!helper.isNumeric(roomId)){
            let dataUser = await helper.getRoomId3({name: roomId})
            log(dataUser.data.user.avatarThumb)
            log(dataUser.data.user.roomId)
            log(dataUser.data.user.status)
            if(dataUser && dataUser.data && dataUser.data.user && dataUser.data.user.roomId){
                roomId = dataUser.data.user.roomId;
            }
            if(dataUser && dataUser.data && dataUser.data.user && dataUser.data.user.status){
                roomStatus = dataUser.data.user.status;
            }
            if(dataUser && dataUser.data && dataUser.data.user && dataUser.data.user.avatarThumb){
                avatarThumb = dataUser.data.user.avatarThumb;
            }
        }
        let dataRoom = await helper.getRoomInfo4({room_id: roomId})
        if(dataRoom && dataRoom.display_id){
            roomUsername = dataRoom.display_id;
        }
        if(dataRoom && !dataRoom.is_alive){
            roomStatus = 4;
        }
        if(dataRoom && dataRoom.view_count){
            startCount = dataRoom.view_count;
        }
        if(dataRoom && dataRoom.avatarThumb){
            avatarThumb = dataRoom.avatarThumb;
        }
        
        if(roomStatus != 2){
            return { success: false, error: 'Phòng live đã kết thúc' };
        }

        // Generate unique ID for the room
        const uniqueId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        // Đảm bảo room có uid và id
        roomData.uid = uniqueId;
        roomData.id = uniqueId; // id và uid giống nhau để đảm bảo tương thích
        
        roomData.roomId = roomId;
        roomData.avatarThumb = avatarThumb;
        roomData.roomUsername = roomUsername;
        roomData.startCount = startCount;
        roomData.currentViewers = 0;
        roomData.status = 'watching';
        
        log(`🆔 Created room with uid=${roomData.uid}, id=${roomData.id}, roomId=${roomData.roomId}`);
        
        const result = await storageManager.addRoom(roomData)
        
        // Gửi thông báo khi thêm phòng mới thành công
        if (result.success) {
          notificationManager.notifyNewRoom(roomData);
          log(`📲 Đã gửi thông báo cho room mới: ${roomData.roomUsername || roomData.roomId}`);
        }
        
        return result
      } catch (err) {
        error('Error adding room:', err)
        return { success: false, error: err.message }
      }
    },

    'delete-room': async (event, roomId) => {
      try {
        const result = await storageManager.deleteRoom(roomId)
        return result
      } catch (err) {
        error('Error deleting room:', err)
        return { success: false, error: err.message }
      }
    },

    'stop-room': async (event, roomId) => {
      try {
        // Kiểm tra roomId không được null
        if (!roomId) {
          error('❌ Không thể dừng room: roomId là null')
          return { success: false, error: 'ROOM_ID_NULL' }
        }
        
        // Lấy thông tin của room trước khi dừng để hiển thị thông báo
        const rooms = await storageManager.getAllRooms();
        const roomData = rooms.find(room => room.id === roomId);
        
        // Dừng viewers trước
        await GroupView.stopViewers({ task_id: roomId })
        
        // Cập nhật trạng thái room
        const result = await storageManager.updateRoom(roomId, { 
          status: 'stopped',
          stoppedAt: new Date().toISOString(),
          stopReason: 'manual_stopped'
        })
        
        // Giải phóng các accounts
        try {
          await storageManager.releaseAccountsFromRoom(roomId)
          log(`✅ Released accounts from stopped room ${roomId}`)
        } catch (releaseErr) {
          error(`❌ Error releasing accounts from room ${roomId}:`, releaseErr)
        }
        
        // Gửi thông báo khi room đã dừng
        if (roomData) {
          // Sử dụng Notification API
          notificationManager.notifyRoomStopped(roomData);
          
          // Hiển thị dialog thay thế
          // try {
          //   const focusedWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
          //   if (focusedWindow) {
          //     const roomIdentifier = roomData.roomName || roomData.roomId || roomData.roomUsername || 'Unknown';
          //     dialog.showMessageBox(focusedWindow, {
          //       type: 'info',
          //       title: 'Room đã dừng phát',
          //       message: `Room "${roomIdentifier}" đã dừng phát sóng.`,
          //       buttons: ['OK']
          //     });
          //   }
          // } catch (dialogErr) {
          //   error(`❌ Lỗi khi hiển thị dialog thông báo room dừng: ${dialogErr}`);
          // }
          
          log(`📲 Đã gửi thông báo cho room ${roomId} dừng phát sóng`);
        }
        
        log(`Room ${roomId} stopped successfully`)
        return result
      } catch (err) {
        error('Error stopping room:', err)
        return { success: false, error: err.message }
      }
    },

    'update-room': async (event, roomId, data) => {
      try {
        const result = await storageManager.updateRoom(roomId, data)
        return result
      } catch (err) {
        console.error('Error updating room:', err)
        return { success: false, error: err.message }
      }
    },

    'duplicate-room': async (event, roomId, newData) => {
      try {
        const result = await storageManager.duplicateRoom(roomId, newData)
        return result
      } catch (err) {
        console.error('Error duplicating room:', err)
        return { success: false, error: err.message }
      }
    },

    'get-rooms-with-filter': async (event, filterOptions, sortOptions) => {
      try {
        const rooms = await storageManager.getAllRooms()
        let filtered = [...rooms]

        // Apply filters
        if (filterOptions.status && filterOptions.status !== 'all') {
          filtered = filtered.filter(room => room.status === filterOptions.status)
        }

        if (filterOptions.minViewers !== undefined) {
          filtered = filtered.filter(room => (room.currentViewers || 0) >= filterOptions.minViewers)
        }

        if (filterOptions.maxViewers !== undefined) {
          filtered = filtered.filter(room => (room.currentViewers || 0) <= filterOptions.maxViewers)
        }

        if (filterOptions.minDuration !== undefined) {
          filtered = filtered.filter(room => (room.duration || 0) >= filterOptions.minDuration)
        }

        if (filterOptions.maxDuration !== undefined) {
          filtered = filtered.filter(room => (room.duration || 0) <= filterOptions.maxDuration)
        }

        if (filterOptions.searchTerm) {
          filtered = filtered.filter(room => 
            room.roomUrl.toLowerCase().includes(filterOptions.searchTerm.toLowerCase()) ||
            (room.note && room.note.toLowerCase().includes(filterOptions.searchTerm.toLowerCase()))
          )
        }

        // Apply sorting
        if (sortOptions && sortOptions.sortBy) {
          filtered.sort((a, b) => {
            let aVal, bVal
            switch (sortOptions.sortBy) {
              case 'createdAt':
                aVal = new Date(a.createdAt || 0)
                bVal = new Date(b.createdAt || 0)
                break
              case 'currentViewers':
                aVal = a.currentViewers || 0
                bVal = b.currentViewers || 0
                break
              case 'status':
                const statusOrder = { 'watching': 1, 'stopped': 2, 'completed': 3 }
                aVal = statusOrder[a.status] || 4
                bVal = statusOrder[b.status] || 4
                break
              default:
                return 0
            }
            
            if (sortOptions.sortOrder === 'desc') {
              return bVal > aVal ? 1 : bVal < aVal ? -1 : 0
            } else {
              return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
            }
          })
        }

        // Apply pagination
        const page = filterOptions.page || 1
        const pageSize = filterOptions.pageSize || 20
        const startIndex = (page - 1) * pageSize
        const endIndex = startIndex + pageSize
        const paginatedRooms = filtered.slice(startIndex, endIndex)

        return {
          success: true,
          rooms: paginatedRooms,
          totalCount: filtered.length,
          totalPages: Math.ceil(filtered.length / pageSize),
          currentPage: page
        }
      } catch (err) {
        console.error('Error getting filtered rooms:', err)
        return { success: false, error: err.message, rooms: [], totalCount: 0, totalPages: 0 }
      }
    },

    'start-room-viewer': async (event, config) => {
      try {
        const { roomId, accounts, duration } = config
        
        // Lấy thông tin room để có roomId thực
        const rooms = await storageManager.getAllRooms()
        const room = rooms.find(r => r.id === roomId)
        
        if (!room) {
          return { success: false, error: 'Room not found' }
        }
        
        // Cập nhật trạng thái room thành "watching"
        await storageManager.updateRoom(roomId, { 
          status: 'watching',
          startedAt: new Date().toISOString(),
          currentViewers: accounts.length
        })
        
        // Thêm accounts vào activeRooms với room.roomId
        for (const account of accounts) {
          await storageManager.addAccountToRoom(account.id, room.roomId)
        }
        
        console.log(`Started room viewer for room ${roomId} with ${accounts.length} accounts`)
        
        return { success: true, message: 'Room viewer started successfully' }
      } catch (err) {
        console.error('Error starting room viewer:', err)
        return { success: false, error: err.message }
      }
    },

    'startRoomViewer': async (event, config) => {
      try {
        const { roomId, accounts, duration } = config
        
        const rooms = await storageManager.getAllRooms()
        const room = rooms.find(r => r.id === roomId)
        
        if (!room) {
          return { success: false, error: 'Room not found' }
        }

        // Lấy tất cả proxies để map với proxyId
        const allProxies = await storageManager.getAllProxies()
        const proxyMap = new Map()
        allProxies.forEach(proxy => {
          proxyMap.set(proxy.id, proxy.proxyInfo)
        })
        
        // Cập nhật trạng thái room thành "watching"
        await storageManager.updateRoom(roomId, { 
          status: 'watching',
          startedAt: new Date().toISOString(),
          currentViewers: accounts.length
        })
        
        // Thêm accounts vào activeRooms với room.roomId
        for (const account of accounts) {
          await storageManager.addAccountToRoom(account.id, room.roomId)
        }
        
        console.log(`Started room viewer for room ${roomId} with ${accounts.length} accounts`)
        
        // Tạo accountsList với proxy info đầy đủ
        let accountsList = accounts.map(acc => {
            console.log(acc)
          const proxyInfo = acc.proxyId ? proxyMap.get(acc.proxyId) : 'no-proxy'
          const normalizedProxy = normalizeProxyFormat(proxyInfo);
          // console.log("proxyInfo",proxyInfo,"normalizedProxy",normalizedProxy)
          return `${acc.cookie};username=${acc.username};proxy=${normalizedProxy};`.replace(/;;/g, ';').replace(/; /g, ';')
        })
        await GroupView.startViewers({
          accounts: accountsList,
          task_id: roomId,
          room_id: room.roomId,
          proxy: null
        });
        // console.log(`Accounts: ${accountsList.join(', ')}`)
        
        return { success: true, message: 'Room viewer started successfully' }
      } catch (err) {
        console.error('Error starting room viewer:', err)
        return { success: false, error: err.message }
      }
    },

    'get-room-stats': async (event, roomId) => {
      try {
        if (viewerManager && typeof viewerManager.getRoomStats === 'function') {
          return viewerManager.getRoomStats(roomId)
        }
        return {
          currentViewers: 0,
          status: 'stopped',
          accounts: []
        }
      } catch (err) {
        console.error('Error getting room stats:', err)
        return {
          currentViewers: 0,
          status: 'stopped',
          accounts: []
        }
      }
    },

    'update-room-stats': async (event, roomId, stats) => {
      try {
        if (viewerManager && typeof viewerManager.updateRoomStats === 'function') {
          viewerManager.updateRoomStats(roomId, stats)
          return { success: true }
        }
        return { success: false, error: 'ViewerManager not available' }
      } catch (err) {
        console.error('Error updating room stats:', err)
        return { success: false, error: err.message }
      }
    },

    'update-room-viewers': async (event, roomId, viewerCount) => {
      try {
        const result = await storageManager.updateRoom(roomId, { 
          currentViewers: viewerCount,
          lastViewerUpdate: new Date().toISOString()
        })
        return result
      } catch (err) {
        console.error('Error updating room viewers:', err)
        return { success: false, error: err.message }
      }
    },

    'add-room-and-start-viewer': async (event, roomData, accounts) => {
      try {
        log("🔄 Xử lý add-room-and-start-viewer với", roomData.roomUrl, "và", accounts.length, "accounts")
        let roomId = roomData.roomUrl.trim();
        
        // Nếu là URL TikTok, chỉ lấy username
        if (roomData.roomUrl.includes('tiktok.com')) {
            // Extract từ format @username/live
            const usernameMatch = roomData.roomUrl.match(/@([^\/]+)\/live/);
            if (usernameMatch) {
                roomId = usernameMatch[1]; // Chỉ lấy username
            } else {
                // Fallback: extract từ các format khác nếu có
                const urlMatch = roomData.roomUrl.match(/\/live\/(\w+)/);
                if (urlMatch) {
                    roomId = urlMatch[1];
                }
            }
        }
        // Nếu không phải URL, giữ nguyên input (đó chính là room_id)
        let avatarThumb = null;
        let roomUsername = roomId;
        let roomStatus = 2;
        let startCount = 0;
        let proxies = await helper.getProxySite()
        let proxy_random = proxies[Math.floor(Math.random() * proxies.length)];
        if(!helper.isNumeric(roomId)){
            let dataUser = await helper.getRoomId3({name: roomId, proxy: proxy_random})
            log(dataUser.data.user.avatarThumb)
            log(dataUser.data.user.roomId)
            log(dataUser.data.user.status)
            if(dataUser && dataUser.data && dataUser.data.user && dataUser.data.user.roomId){
                roomId = dataUser.data.user.roomId;
            }
            if(dataUser && dataUser.data && dataUser.data.user && dataUser.data.user.status){
                roomStatus = dataUser.data.user.status;
            }
            if(dataUser && dataUser.data && dataUser.data.user && dataUser.data.user.avatarThumb){
                avatarThumb = dataUser.data.user.avatarThumb;
            }
        }
        let account_random = accounts[Math.floor(Math.random() * accounts.length)];
        let cookie_string_random = account_random.cookie || account_random.metadata.cookie;
        let dataRoom = await helper.getRoomInfo4({room_id: roomId, proxy: proxy_random, cookie_string: cookie_string_random})
        // console.log("dataRoom",dataRoom)
        if(dataRoom && dataRoom.display_id){
            roomUsername = dataRoom.display_id;
        }
        if(dataRoom && !dataRoom.is_alive){
            roomStatus = 4;
        }
        if(dataRoom && dataRoom.view_count){
            startCount = dataRoom.view_count;
        }
        if(dataRoom && dataRoom.avatarThumb){
            avatarThumb = dataRoom.avatarThumb;
        }
        
        if(roomStatus != 2){
            return { success: false, error: 'Phòng live đã kết thúc' };
        }
        // return { success: false, error: 'ok' };
        // Generate unique ID for the room
        const uniqueId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        // Đảm bảo room có uid và id
        roomData.uid = uniqueId;
        roomData.id = uniqueId; // id và uid giống nhau để đảm bảo tương thích
        
        roomData.roomId = roomId;
        roomData.avatarThumb = avatarThumb;
        roomData.roomUsername = roomUsername;
        roomData.startCount = startCount;
        roomData.currentViewers = accounts.length;
        roomData.status = 'watching';
        roomData.startedAt = new Date().toISOString();
        roomData.realViewers = startCount;
        roomData.lastTimeCheckViewers = new Date().toISOString();
        log(`🆔 Created room with uid=${roomData.uid}, id=${roomData.id}, roomId=${roomData.roomId}`);
        
        // 1. Lưu room vào database
        const result = await storageManager.addRoom(roomData)
        if (!result.success) {
          console.error('❌ Lỗi khi thêm room:', result.error)
          return result
        }
        // Thêm vào file history riêng thay vì rooms.json
        await storageManager.addViewerHistoryEntry(roomData.id, {
          timestamp: roomData.lastTimeCheckViewers,
          viewers: roomData.realViewers,
          isAlive: true
        });
        notificationManager.notifyNewRoom(roomData);
        log(`✅ Đã thêm room thành công: ${roomData.id}`)
        
        // 2. Liên kết từng account với room
        log(`🔄 Liên kết ${accounts.length} accounts với room ${roomData.id}`)
        for (const account of accounts) {
          await storageManager.addAccountToRoom(account.id, roomData.id)
        }
        
        // 3. Tạo accountsList với proxy từ bảng proxies
        let accountsList = []
        for (const acc of accounts) {
          log("🔄 Account", acc)
          let proxyInfo = 'no-proxy'
          
          // Nếu account có proxyId, lấy thông tin proxy từ bảng proxies
          if (acc.proxyId) {
            try {
              // Lấy một proxy cụ thể theo ID thay vì lấy tất cả
              const proxy = await storageManager.getProxyById(acc.proxyId)
              if (proxy) {
                // Sử dụng host, port, username, password của proxy
                const { host, port, username, password } = proxy
                if (username && password) {
                  proxyInfo = `${username}:${password}@${host}:${port}`
                } else {
                  proxyInfo = `${host}:${port}`
                }
              }
            } catch (e) {
              console.error(`❌ Lỗi khi lấy proxy cho account ${acc.id}:`, e)
            }
          }
          
          const normalizedProxy = normalizeProxyFormat(proxyInfo)
          accountsList.push(`${acc.cookie || acc.metadata.cookie};username=${acc.username};proxy=${normalizedProxy};`.replace(/;;/g, ';').replace(/; /g, ';'))
        }
        
        // 4. Bắt đầu viewers
        log("🔄 Accounts", accountsList)
        await GroupView.startViewers({
          accounts: accountsList,
          task_id: roomData.id,
          room_id: roomId,
          proxy: null
        });
        
        log(`✅ Đã bắt đầu viewer thành công cho room ${roomData.id}`)
        
        return { 
          success: true, 
          roomId: roomData.id, 
          room: result.room,
          message: 'Room added and viewer started successfully' 
        }
      } catch (err) {
        error('Error in add-room-and-start-viewer:', err)
        return { success: false, error: err.message }
      }
    },

    'get-real-time-viewers': async () => {
      try {
        const rooms = await storageManager.getAllRooms()
        const activeRooms = rooms.filter(room => room.status === 'running')
        
        const stats = {}
        for (const room of activeRooms) {
          const accountsInRoom = await storageManager.getAccountsInRoom(room.id)
          
          stats[room.id] = {
            currentViewers: accountsInRoom.count || 0,
            targetViewers: room.targetViewers || 0,
            status: room.status,
            updatedAt: new Date().toISOString()
          }
        }
        
        return { success: true, stats }
      } catch (err) {
        console.error('Error getting real-time viewers:', err)
        return { success: false, error: err.message, stats: {} }
      }
    },

    'get-room-viewer-history': async (event, roomId, days) => {
      try {
        const result = await storageManager.getRoomViewerHistory(roomId, days)
        
        // Nếu là mảng (từ database) thì chuyển đổi sang định dạng phù hợp với frontend
        if (Array.isArray(result)) {
          console.log(`Chuyển đổi ${result.length} kết quả từ database sang định dạng frontend`)
          return {
            success: true,
            history: result.map(item => ({
              timestamp: item.timestamp,
              viewers: item.viewerCount || 0,
              isAlive: true
            })),
            totalEntries: result.length,
            roomInfo: { roomUid: roomId }
          }
        }
        
        // Trường hợp đã là đúng định dạng từ file storage
        return result
      } catch (err) {
        console.error('Error getting room viewer history:', err)
        return { success: false, errorCode: 'UNKNOWN_ERROR', error: err.message }
      }
    },

    'assign-account-to-room': async (event, data) => {
      try {
        const { accountId, roomId } = data;
        if (!accountId || !roomId) {
          return { success: false, error: 'accountId và roomId là bắt buộc' };
        }
        
        // Kiểm tra account và room có tồn tại không
        const account = await storageManager.getAccountById(accountId);
        const room = await storageManager.getRoomByUid(roomId);
        
        if (!account) {
          return { success: false, error: 'Account không tồn tại' };
        }
        
        if (!room) {
          return { success: false, error: 'Room không tồn tại' };
        }
        
        // Thêm liên kết giữa account và room
        await storageManager.assignAccountToRoom(accountId, roomId);
        
        // Cập nhật account status
        await storageManager.updateAccount(accountId, {
          status: 'assigned',
          updatedAt: new Date().toISOString()
        });
        
        return { 
          success: true, 
          message: `Đã gán account ${account.username} vào room ${room.roomInfo?.owner?.nickname || room.uid}` 
        };
      } catch (err) {
        console.error('Error assigning account to room:', err);
        return { success: false, error: err.message };
      }
    }
  }
}
function normalizeProxyFormat(proxyString) {
  if (!proxyString || proxyString === 'no-proxy') return 'no-proxy';

  try {
      if (proxyString.includes('@')) return proxyString; // đã đúng

      const match = proxyString.match(/^([^:]+):(\d+):([^:]+):(.+)$/);
      if (match) {
          const [, ip, port, user, pass] = match;
          return `${user}:${pass}@${ip}:${port}`;
      }

      const simple = proxyString.match(/^([^:]+):(\d+)$/);
      if (simple) return proxyString;

      console.log(`Invalid proxy format: ${proxyString}`);
      return 'no-proxy';
  } catch (err) {
      console.log(`Error parsing proxy: ${proxyString}`, err);
      return 'no-proxy';
  }
}

module.exports = roomHandlers