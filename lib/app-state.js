/**
 * Quản lý trạng thái toàn cục của ứng dụng trong main process
 */
class AppState {
  constructor() {
    // Khởi tạo trạng thái mặc định
    this._state = {
      language: 'vi', // Ngôn ngữ mặc định
      theme: 'dark',
      notifications: true,
      soundEnabled: true
    };
    
    // Danh sách các listeners
    this._listeners = {
      language: []
    };
  }
  
  /**
   * Lấy ngôn ngữ hiện tại
   */
  get language() {
    return this._state.language;
  }
  
  /**
   * Đặt ngôn ngữ hiện tại và thông báo cho các listeners
   */
  set language(value) {
    if (this._state.language !== value) {
      this._state.language = value;
      this._notifyListeners('language', value);
    }
  }
  
  /**
   * Lấy theme hiện tại
   */
  get theme() {
    return this._state.theme;
  }
  
  /**
   * Đặt theme hiện tại
   */
  set theme(value) {
    this._state.theme = value;
  }
  
  /**
   * Lấy trạng thái thông báo
   */
  get notifications() {
    return this._state.notifications;
  }
  
  /**
   * Đặt trạng thái thông báo
   */
  set notifications(value) {
    this._state.notifications = value;
  }
  
  /**
   * Lấy trạng thái âm thanh
   */
  get soundEnabled() {
    return this._state.soundEnabled;
  }
  
  /**
   * Đặt trạng thái âm thanh
   */
  set soundEnabled(value) {
    this._state.soundEnabled = value;
  }
  
  /**
   * Đăng ký listener cho các thay đổi
   * @param {string} event - Tên sự kiện ('language', 'theme', etc)
   * @param {Function} callback - Hàm callback khi có thay đổi
   */
  addListener(event, callback) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(callback);
  }
  
  /**
   * Hủy đăng ký listener
   * @param {string} event - Tên sự kiện
   * @param {Function} callback - Hàm callback đã đăng ký
   */
  removeListener(event, callback) {
    if (this._listeners[event]) {
      this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
    }
  }
  
  /**
   * Thông báo cho các listeners về thay đổi
   * @param {string} event - Tên sự kiện
   * @param {any} value - Giá trị mới
   */
  _notifyListeners(event, value) {
    if (this._listeners[event]) {
      this._listeners[event].forEach(callback => {
        try {
          callback(value);
        } catch (err) {
          console.error(`Lỗi khi gọi listener cho ${event}:`, err);
        }
      });
    }
  }
}

// Export singleton instance
module.exports = new AppState(); 