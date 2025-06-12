// const { exec } = require('child_process');
// const { promisify } = require('util');
// const fs = require('fs');
const path = require("path");
const { delay, getString, getTime, getRandomInt, genheaderenter } = require("./helper");
const axios = require("axios");
const https = require("https");
const tunnel = require("tunnel"); // Thêm module tunnel
const querystring = require('querystring');
const os = require("os");
const request = require('request'); // Thêm module request để lấy signature
// const { log} = require('../../lib/logger');
const StorageManager = require('../../lib/storage/storage-manager');

// Tạo một instance của axios với các cài đặt mặc định
const axiosInstance = axios.create({
    timeout: 30000,
    httpsAgent: new https.Agent({ 
        keepAlive: false,
        rejectUnauthorized: false
    })
});

// Xác định OS và browser platform
let os_type = os.type();
let browser_platform = "";
let os_ver = "";

os_type = "Linux"
switch (os_type) {
    case "Linux": {
        os_ver = "X11; Ubuntu; Linux x86_64";
        browser_platform = encodeURIComponent("Linux x86_64");
        break;
    } 
    case "Windows_NT": {
        os_ver = "Windows NT 10.0; Win64; x64";
        browser_platform = "Win32";
        break;
    } 
    case "Darwin": {
        os_ver = "Macintosh; Intel Mac OS X 10_15_7";
        browser_platform = "MacIntel";
        break;
    } 
    default: {
        os_ver = "X11; Ubuntu; Linux x86_64";
        browser_platform = encodeURIComponent("Linux x86_64");
    }
}

let userAgentDefault = `Mozilla/5.0 (${os_ver}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36`;
// userAgentDefault = `Mozilla/5.0 (X11; Ubuntu; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36`

const appVersionDefault = userAgentDefault.replace("Mozilla/", "");

console.log("userAgentDefault", userAgentDefault);
console.log("browser_platform", browser_platform);

// Dữ liệu chung
const data = {};
let data_local = {};
let list_403_total = [];
let list_die_total = [];
let is_running = true;
let intervalcheck;

// Class duy nhất cho cả viewer và logic clone
class GroupView {
    constructor({cookie_string, task_id, room_id, proxy, proxy_list, server_site} = {}) {
        if (cookie_string) {
            this.task_id = task_id;
            this.cookie_string = cookie_string;
            this.username = getString(cookie_string, 'username=', ';');
            this.session_id = getString(cookie_string, 'sessionid=', ';');
            this.room_id = room_id;
            this.proxy = proxy;
            this.proxy_list = proxy_list;
            this.failTime = 0;
            this.status = "running";
            this.browser_platform = browser_platform;
            let random_de = getRandomInt(187248723442, 934782374123);  
            this.device_id = "7284943" + random_de;
            this.device_id = getString(cookie_string, ';wid=', ';');
            this.is_first = true;
            this.status_viewer = -1; // 3 - no login, 1 viewed, 2 - error, 4 - 403
            this.endpoint = "";
            this.imfetch_time = 0;
            this.delay_all_time = 5000;
            this.delay_10_time = 45000;
            this.delay = this.delay_all_time;
            this.url = "";
            this.is_10_time = true;
            this.server_site = server_site || "tt2";
        }
    }

    // =========== PHƯƠNG THỨC QUẢN LÝ TRẠNG THÁI CLONE ===========
    async run() {
        this.status = "running";
        console.log("run",this.username)
        // return true;
        // await this.updateAccountStatus("inactive");
        
        let is_join = await this.runJoin();
        if(is_join) {
            this.status = "running";
            this.runFetchs();
            return true;
        } else {
            this.status = "end";
            return false;
        }
    }

    async cancel() {
        this.status = "end";
    }

    async pause() {
        this.status = "pause";
    }

    async resume() {
        this.status = "running";
    }

    sign(options) {
        let {url, bodyEncoded, msToken, bodyJson} = options;
        const SERVER_URL = 'http://sign.amazingcpanel.com';
      return new Promise((resolve, reject) => {
        // Chuẩn bị dữ liệu request
        const requestData = {
          url: url,
          bodyEncoded: bodyEncoded,
          msToken: msToken,
          bodyJson,
        };
    
        // Gửi request để lấy signature
        request({
          method: 'POST',
          url: `${SERVER_URL}/api/xbogus`,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        }, (error, response, body) => {
          if (error) {
            console.log("Lỗi khi lấy signature:", error);
            reject(error);
            return;
          }
          
          try {
            const data = JSON.parse(body);
            resolve(data);
          } catch (err) {
            console.log("Lỗi khi parse response:", err);
            reject(err);
          }
        });
      });
    }
    async runJoin() {
        // Bỏ đoạn test proxy
        // while(true){
        //     let options = {
        //         url: "https://jsonip.com/",
        //         method: 'GET',
        //         headers: {
        //             "User-Agent": userAgentDefault,
        //             "Accept": "application/json, text/plain, */*",
        //             "Accept-Language": "en-US,en;q=0.9",
        //         },
        //         responseType: 'json',
        //         isRetry: true,
        //         retryTime: 2
        //     };
            
        //     let data_ip = await this.makeRequest(options);
        //     await delay(this.delay_all_time);
        // }
        // console.console.log("data ip:", data_ip.bodyJson || data_ip.body);

        // await delay(10000000);
        // return false;
        // process.exit(1)
        // Sử dụng phương thức nội bộ thay vì gọi từ helper
        let cookie_status = await this.checkCookieLive();

        // if(!cookie_status.status || !cookie_status.live) {
        if(cookie_status.status && !cookie_status.live) {
            console.log(getTime(), this.username, `Cookie die`);
            this.status_viewer = 3;
            await this.updateAccountStatus("diecookie");
            return false;
        }

        // Lưu thông tin user nếu có
        if(cookie_status.userId) {
            this.userId = cookie_status.userId;
            this.secUid = cookie_status.secUid;
        }

        let res1 = await this.callApi({ type: "enter" });
        let is_good = false;
        if(res1 && res1.body && res1.body.includes('user_side_title')) {
            is_good = true;
        }

        if ([-1, 1].includes(this.status_viewer) && is_good) {
            return true;
        } else {
            if(this.status_viewer == 4) {
                await this.updateAccountStatus("403");
            }
            console.log(getTime(), this.username, "enter", this.status_viewer, is_good);
            return false;
        }
    }

    // Thêm phương thức checkCookieLive nội bộ
    async checkCookieLive({ username, cookie_string, proxy, proxy_list } = {}) {
        // Use instance variables instead of parameters
        username = username || this.username;
        cookie_string = cookie_string || this.cookie_string;
        proxy = proxy || this.proxy;
        proxy_list = proxy_list || this.proxy_list;
        
        // Lưu protocol của request hiện tại
        this.lastRequestProtocol = 'https:';

        // Sử dụng makeRequest để tận dụng các cấu hình proxy đã có
        var options = {
            url: `https://www.tiktok.com/passport/web/account/info/?aid=1459&app_language=en&app_name=tiktok_web&browser_platform=MacIntel&device_platform=web_pc&region=VN&tz_name=Asia%2FSaigon&webcast_language=en`,
            method: 'GET',
            headers: {
                "User-Agent": userAgentDefault,
                "cookie": cookie_string,
                "Accept": "application/json, text/plain, */*",
                "Accept-Language": "en-US,en;q=0.9",
                "Connection": "keep-alive",
                "Referer": "https://www.tiktok.com/live",
                "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not?A_Brand";v="24"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"macOS"'
            },
            responseType: 'json',
            timeout: 15000,
            isRetry: true,
            retryTime: 2
        };

        try {
            // Sử dụng makeRequest thay vì axios trực tiếp
            const response = await this.makeRequest(options);
            
            // Phân tích kết quả
            if (response.bodyJson && response.bodyJson.data && response.bodyJson.data.user_id) {
                return { 
                    status: true, 
                    live: true, 
                    username: response.bodyJson.data.username,
                    userId: response.bodyJson.data.user_id,
                    secUid: response.bodyJson.data.sec_user_id
                };
            }else if(response.body.includes("session_expired")){
                return { status: true, live: false };
            } else {
                // 
                return { status: false, live: true};
            }
        } catch (error) {
            console.log(`Check cookie error for ${username}:`, error.message);
            return { status: false, live: true, error: error.message };
        }
    }

    async runFetchs() {
        let is_run = true;
        this.setCursor = true;
        while(is_run) {
            if(this.status == "running") {
                let r_enter = await this.fetch();
                if(r_enter.is_403) {
                    is_run = false;
                    this.status_viewer = 4;
                }
                await delay(this.delay);
                this.imfetch_time++;
            } else if(this.status == "pause") {
                await delay(1000);
            } else if(this.status == "resume") {
                this.status = "running";
                await delay(1000);
            } else if(this.status == "end") {
                is_run = false;
            }
        }
    }

    // =========== PHƯƠNG THỨC XỬ LÝ API ===========
    async callApi({ type }) {
        let { cookie_string, room_id, msToken: cmsToken, session_id: csession_id, timeout, device_id } = this;
        timeout = timeout || 30000;
        var msToken = cmsToken || getString(cookie_string + ';', 'msToken=', ';');
        let session_id = csession_id || getString(cookie_string.replace(/ /g,'') + ';', 'sessionid=', ';');
        this.tt_csrf_token = getString(cookie_string.replace(/ /g,'') + ';', 'tt_csrf_token=', ';');
        this.s_v_web_id = getString(cookie_string.replace(/ /g,'') + ';', 's_v_web_id=', ';');
        this.session_id = session_id;
        let device_type = "web_h265";
        // let screen_height = 982;
        // let screen_width = 1512;
        let screen_height = 1107;
        let screen_width = 1710;

        try {
            if (session_id == "") {
                throw new Error("Cookie no session id");
            }

            let url = "";

            let verifyFp = getString(cookie_string.replace(/ /g,'') + ';', 's_v_web_id=', ';');
            let _bodyJson = null;

            switch (type) {
                case "leave":
                    url = `https://webcast.tiktok.com/webcast/room/leave/?aid=1988&app_language=en&app_name=tiktok_web&browser_language=en-US&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=${this.encodeRFC3986URIComponent(appVersionDefault)}&channel=tiktok_web&cookie_enabled=true&device_id=${device_id}&device_platform=web_pc&device_type=web_h264&focus_state=true&from_page=user&history_len=4&is_fullscreen=false&is_page_visible=true&os=mac&priority_region=&referer=&region=VN&screen_height=900&screen_width=1440&tz_name=Asia%2FSaigon&webcast_language=en&msToken=${msToken}`;
                    _bodyJson = {reason: 0, room_id: room_id};
                    break;
                case "enter":
                    url = `https://webcast.tiktok.com/webcast/room/enter/?aid=1988&app_language=vi-VN&app_name=tiktok_web&browser_language=vi&browser_name=Mozilla&browser_online=true&browser_platform=${browser_platform}&browser_version=${this.encodeRFC3986URIComponent(appVersionDefault)}&channel=tiktok_web&cookie_enabled=true&data_collection_enabled=true&device_id=${device_id}&device_platform=web_pc&device_type=${device_type}&focus_state=true&from_page=&history_len=0&is_fullscreen=false&is_page_visible=true&os=mac&priority_region=&referer=&region=VN&screen_height=${screen_height}&screen_width=${screen_width}&tz_name=Asia%2FBangkok&user_is_login=true&verifyFp=${verifyFp}&webcast_language=vi-VN`;
                    _bodyJson = {enter_source: "others-others", room_id: room_id};
                    break;
                case "name":
                    url = `https://www.tiktok.com/api/update/profile/?WebIdLastTime=&aid=1988&app_language=vi-VN&app_name=tiktok_web&browser_language=vi&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=${this.encodeRFC3986URIComponent(appVersionDefault)}&channel=tiktok_web&cookie_enabled=true&data_collection_enabled=true&device_id=${device_id}&device_platform=web_pc&focus_state=true&from_page=user&history_len=3&is_fullscreen=false&is_page_visible=true&odinId=${this.userId}&os=mac&priority_region=&referer=&region=VN&screen_height=982&screen_width=1512&tz_name=Asia%2FSaigon&user_is_login=true&verifyFp=${this.s_v_web_id}&webcast_language=vi-VN&msToken=${msToken}`;
                    _bodyJson = {
                        'nickname': this.name,
                        'tt_csrf_token': this.tt_csrf_token
                    };
                    break;
            }

            let bodyEncoded = querystring.stringify(_bodyJson);
            let {targetUrl} = await this.sign({url, bodyEncoded: bodyEncoded, msToken});
            let is_retry = false;
            
            if(is_retry) {
                await delay(500);
                return await this.callApi({type});
            }

            let target_url = targetUrl;
            let s_sdk_crypt_sdk = getString(cookie_string, 'crypt_sdk_b64=', ';');
            let s_sdk_sign_data_key = getString(cookie_string, 'sign_data_key_b64=', ';');
            let data_gen = genheaderenter({
                s_sdk_crypt_sdk,
                s_sdk_sign_data_key,
                path: '/webcast/room/enter/'
            })
            if(!data_gen || !data_gen["tt-ticket-guard-client-data"] || !data_gen["tt-ticket-guard-public-key"]) {
            throw new Error("No data gen")
            }
            var options = {
                url: target_url,
                method: 'POST',
                headers: {
                    'Accept': '*/*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Connection': 'keep-alive',
                    'Cookie': cookie_string,
                    'Origin': 'https://www.tiktok.com',
                    'Referer': 'https://www.tiktok.com',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-origin',
                    'User-Agent': userAgentDefault,
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not?A_Brand";v="24"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"macOS"',
                    'x-secsdk-csrf-token': 'DOWNGRADE',
                    'tt-ticket-guard-client-data': data_gen["tt-ticket-guard-client-data"],
                    'tt-ticket-guard-iteration-version': 0,
                    'tt-ticket-guard-public-key': data_gen["tt-ticket-guard-public-key"],
                    'tt-ticket-guard-version': 2,
                    'tt-ticket-guard-web-version': 1
                },
                data: bodyEncoded,
                timeout: timeout,
                responseType: 'arraybuffer'
            };

            let data_page = await this.makeRequest(options);
            if(data_page.status == 403) {
                throw new Error("Request failed with status code 403");
            }
            if(data_page.error && data_page.error != "Request timeout") {
                console.log(data_page.error);
            }
            if(data_page.body) {
                let code = data_page.bodyJson.status_code;
                let message = (data_page.bodyJson || {}).data && (data_page.bodyJson || {}).data.message;
                let result = {
                    is_403: false,
                    is_dead: message === "User doesn't login" || code === 20003 ? true : false,
                    body: data_page.body
                };
                return result;
            }
            let result = { is_403: false, data: data_page.body, body: data_page.body };
            return result;
        } catch (error) {
            console.log("error call api", this.session_id, error.message);
            let result = {
                is_403: error.message.includes("status code 403") ? true: false,
                error: error.message
            };
            return result;
        }
    }

    // Cấu hình proxy cho Axios với tunnel agents
    configureProxy(proxy) {
        if (!proxy) return undefined;
        
        try {
            // Parse proxy string nếu cần
            let parsedProxy = this.parseProxyString(proxy);
            
            if (!parsedProxy || !parsedProxy.host || !parsedProxy.port) {
                console.log("Invalid proxy format:", proxy);
                return undefined;
            }

            const { protocol, host, port, username, password } = parsedProxy;
            const auth = username && password ? `${username}:${password}` : '';
            
            // Trả về cấu hình proxy phù hợp với axios
            return {
                host,
                port: parseInt(port),
                protocol: `${protocol || "http"}:`,
                auth: auth ? {
                    username: username,
                    password: password
                } : undefined
            };
        } catch (error) {
            console.log("Error configuring proxy:", error.message);
            return undefined;
        }
    }

    // Parse proxy string helper
    parseProxyString(proxyStr) {
        if (!proxyStr) return null;
        
        // Nếu đã là object proxy, trả về luôn
        if (typeof proxyStr === 'object' && proxyStr.host) {
            return proxyStr;
        }
        
        try {
            // Xử lý trường hợp proxy đã là URL hoàn chỉnh
            if (proxyStr.includes("https://") || proxyStr.includes("http://")) {
                const proxyUrl = new URL(proxyStr);
                return {
                    protocol: proxyUrl.protocol.replace(':', ''),
                    host: proxyUrl.hostname,
                    port: proxyUrl.port,
                    username: proxyUrl.username,
                    password: proxyUrl.password
                };
            }
            
            // Xử lý định dạng host:port hoặc host:port:user:pass
            const parts = proxyStr.split(':');
            if (parts.length >= 2) {
                return {
                    host: parts[0],
                    port: parts[1],
                    username: parts.length > 2 ? parts[2] : undefined,
                    password: parts.length > 3 ? parts[3] : undefined,
                    protocol: 'http'
                };
            }
            
            return null;
        } catch (error) {
            console.log("Error parsing proxy string:", error.message);
            return null;
        }
    }

    // Tạo tunnel agent dựa vào protocol (http/https)
    createTunnelAgent(proxy, isHttps = true) {
        if (!proxy) return undefined;
        
        try {
            // Parse proxy string
            let parsedProxy = this.parseProxyString(proxy);
            
            if (!parsedProxy) {
                console.log("Invalid proxy format:", proxy);
                return undefined;
            }

            const { host, port, username, password } = parsedProxy;
            
            // Cấu hình tunnel options
            const tunnelOptions = {
                proxy: {
                    host: host,
                    port: parseInt(port),
                    proxyAuth: username && password ? `${username}:${password}` : undefined
                },
                rejectUnauthorized: false  // Bỏ qua lỗi chứng chỉ SSL
            };
            tunnelOptions.keepAlive = false;

            // Trả về tunnel agent phù hợp
            if (isHttps) {
                return tunnel.httpsOverHttp(tunnelOptions);
            } else {
                return tunnel.httpOverHttp(tunnelOptions);
            }
        } catch (error) {
            console.log("Error creating tunnel agent:", error.message);
            return undefined;
        }
    }
    safeDestroyAgent(agent) {
        try {
          agent?.destroy?.();
        } catch (e) {
          console.log('Destroy agent error:', e.message);
        }
      }
      

    async makeRequest(options) {
        let that = this;
        
        let {url, headers, method, proxy, retryCount, data, timeout, retryTime, proxy_list, form, preCheckRetry, name, retryAfter, httpsAgent, httpAgent} = options;
        if((url.includes('webcast.tiktok.com/webcast/im/fetch/')||url.includes('webcast.tiktok.com/webcast/room/enter/')||url.includes('webcast.tiktok.com/webcast/room/leave/')) &&!url.includes("X-Gnarly")) {
            return {error: "None sign" + that.proxy, body: "", headers: {}, status: null};
        }
        
        method = method || "get";
        retryTime = retryTime || 2;
        retryAfter = retryAfter || 10000;
        let isGetBody = true;
        if(options.hasOwnProperty("isGetBody")) {
            isGetBody = options.isGetBody;
        }
        let isRetry = true;
        if(options.hasOwnProperty("isRetry")) {
            isRetry = options.isRetry;
        }
        let retry = retryCount || 0;
        
        try {
            // Xác định protocol của URL hiện tại (http hoặc https)
            const isHttps = url.startsWith("https");
            this.lastRequestProtocol = isHttps ? "https:" : "http:";
            
            // Quyết định sử dụng proxy dựa trên logic mới
            // Chỉ khi proxy là false rõ ràng thì mới không sử dụng proxy
            // Mặc định sẽ sử dụng this.proxy nếu không có proxy được truyền vào
            let proxyToUse = proxy;
            if (proxy !== false) {
                proxyToUse = proxy || this.proxy;
            }
            
            // Tạo custom agent dựa trên protocol nếu proxy tồn tại
            let customHttpsAgent = httpsAgent;
            let customHttpAgent = httpAgent;
            
            if (proxyToUse && !customHttpsAgent && !customHttpAgent) {
                if (isHttps) {
                    customHttpsAgent = this.createTunnelAgent(proxyToUse, true);
                } else {
                    customHttpAgent = this.createTunnelAgent(proxyToUse, false);
                }
            }
            
            const axiosOptions = {
                url,
                method: method.toUpperCase(),
                headers,
                timeout: timeout || 30000,
                responseType: options.responseType || "arraybuffer"
            };
            
            // Ưu tiên sử dụng agent đã được tạo trước
            if (isHttps) {
                axiosOptions.httpsAgent = customHttpsAgent;
            } else {
                axiosOptions.httpAgent = customHttpAgent;
            }
            
            // Không sử dụng proxy config nếu đã có agent hoặc proxy là false
            if (!customHttpsAgent && !customHttpAgent && proxyToUse) {
                // Chỉ sử dụng proxy config khi không có agent
                axiosOptions.proxy = this.configureProxy(proxyToUse);
            }
            
            if (data) axiosOptions.data = data;
            
            // Sử dụng Promise.race để handle timeout tùy chỉnh
            const requestPromise = axios(axiosOptions);
            
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error("Request timeout " + proxyToUse));
                }, timeout || 30000);
            });
            
            const response = await Promise.race([requestPromise, timeoutPromise]);
            
            // Xử lý response
            let responseBody = "";
            let bodyBinary = null;
            
            if (response.data) {
                bodyBinary = response.data;
                if (Buffer.isBuffer(response.data)) {
                    responseBody = response.data.toString("utf8");
                } else if (typeof response.data === "object") {
                    responseBody = JSON.stringify(response.data);
                } else {
                    responseBody = String(response.data);
                }
            }
            
            // Kiểm tra và cập nhật status_viewer dựa trên response
            if (!responseBody) {
                that.status_viewer = 6;
            }
            
            if (response.status === 403) {
                that.status_viewer = 4;
            } else if (url.includes("webcast/room/enter")) {
                if (responseBody && responseBody.includes('"status_code":20003')) {
                    that.status_viewer = 3; // logout
                } else if (responseBody && responseBody.includes('"status_code":4003182')) {
                    that.status_viewer = 2;
                } else if (responseBody && responseBody.includes("AnchorABMap")) {
                    that.status_viewer = 1; // good
                } else if (responseBody && responseBody.includes('"status_code":30003')) {
                    that.status_viewer = 5; // finish
                }
            }
            
            // Chuẩn bị kết quả trả về
            const head = {
                error: null,
                body: responseBody,
                bodyBinary: bodyBinary,
                headers: response.headers,
                status: response.status
            };
            
            // Kiểm tra nếu cần retry theo preCheckRetry
            let isRetryPreCheck = false;
            if (typeof preCheckRetry === "function") {
                try {
                    isRetryPreCheck = await preCheckRetry(head.body || "", head);
                } catch(e) {
                    console.log("err pre", e);
                }
            }
            
            // Parse JSON body nếu có thể
            let bodyJson = {};
            try {
                bodyJson = JSON.parse(head.body);
            } catch(e) {}
            
            head.bodyJson = bodyJson;
            
            // Xử lý retry nếu cần
            if (isRetryPreCheck || !head.body && isGetBody) {
                if (retry < retryTime && isRetry) {
                    if (proxy_list && proxy_list.length > 0) {
                        const randomProxy = proxy_list[Math.floor((Math.random() * proxy_list.length))];
                        options.proxy = randomProxy;
                    }
                    retry++;
                    options.retryCount = retry;
                    await delay(retryAfter || 10000);
                    return await this.makeRequest(options);
                }
            }
            if(customHttpsAgent)this.safeDestroyAgent(customHttpsAgent);
            if(customHttpAgent)this.safeDestroyAgent(customHttpAgent);

            return head;
        } catch (error) {
            // Ghi log chi tiết hơn về lỗi để dễ debug
            console.log(`Request error [${url}] [${proxy || this.proxy}]:`, error.message);
            
            // Xử lý lỗi
            const errorResponse = {
                error: error.message,
                body: "",
                headers: error.response ? error.response.headers : {},
                status: error.response ? error.response.status : null
            };
            
            // Kiểm tra nếu là lỗi 403
            if (error.response && error.response.status === 403) {
                that.status_viewer = 4;
                errorResponse.status = 403;
            }
            
            // Kiểm tra lỗi 503 - Service Unavailable
            if (error.response && error.response.status === 503) {
                console.log(`Service Unavailable (503) with proxy ${proxy || that.proxy}`);
                // Thử retry với proxy khác
                if (proxy_list && proxy_list.length > 0) {
                    const randomProxy = proxy_list[Math.floor((Math.random() * proxy_list.length))];
                    console.log(`Retrying with different proxy: ${randomProxy}`);
                    options.proxy = randomProxy;
                    retry++;
                    options.retryCount = retry;
                    // if(customHttpsAgent)this.safeDestroyAgent(customHttpsAgent);
                    // if(customHttpAgent)this.safeDestroyAgent(customHttpAgent);
                    await delay(3000); // Đợi lâu hơn cho lỗi 503
                    return await this.makeRequest(options);
                }
            }
            
            // Xử lý retry nếu cần
            if (retry < retryTime && isRetry) {
                if (proxy_list && proxy_list.length > 0) {
                    const randomProxy = proxy_list[Math.floor((Math.random() * proxy_list.length))];
                    options.proxy = randomProxy;
                }
                retry++;
                options.retryCount = retry;
                await delay(retryAfter || 10000);
                // if(customHttpsAgent)this.safeDestroyAgent(customHttpsAgent);
                // if(customHttpAgent)this.safeDestroyAgent(customHttpAgent);
                return await this.makeRequest(options);
            }
            
            return errorResponse;
        }
    }

    encodeRFC3986URIComponent(str) {
        return encodeURIComponent(str).replace(
            /[!'()*]/g,
            (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
        );
    }

    // async send403Rabbit(proxy) {
    //     try {
    //         let rabbitService = await RabbitMQ.getInstance({
    //             url: "amqp://bupmat:bupmat@185.190.140.88:5672/" + this.server_site + "?heartbeat=60"
    //         });
    //         if(proxy) {
    //             let message = {
    //                 "action": "update_account_403_fetch",
    //                 "proxy": proxy,
    //                 time_now: Date.now()
    //             };
    //             await rabbitService.sendMessage("rabbit_cron", message);
    //         }
    //     } catch(error) {
    //         console.log("error handleSendRabbit", error);
    //     }
    // }

    fetch() {
        return new Promise(async r => {
            let start = Date.now();
            let done = false;
            let isFetch = false;
            let isApi = false;
            let { timeout } = { timeout: 30000 };
            let { cookie_string, video_id, msToken: cmsToken, session_id: csession_id } = this;
            var msToken = cmsToken || getString(cookie_string + ';', 'msToken=', ';');
            let session_id = csession_id || 
                            getString(cookie_string.replace(/ /g,'') + ';', ';sessionid=', ';') ||
                            getString(cookie_string.replace(/ /g,'') + ';', 'sessionid=', ';');
            this.session_id = session_id;
            
            if(session_id == "") {
                throw new Error("Cookie no session id");
            }
            
            try {

                let appVersion = encodeURI(appVersionDefault);
                isFetch = true;
                let history_comment_cursor = this.history_comment_cursor || 0;
                let cursor = this.cursor || '';
                let internal_ext = this.internal_ext || '';
                let fetch_rule = this.internal_ext ? 2 : 1;
                fetch_rule = 1;
                
                let endpoint = `version_code=180800&device_platform=web&cookie_enabled=true&screen_width=1512&screen_height=982&browser_language=vi&browser_platform=${browser_platform}&browser_name=Mozilla&browser_version=${appVersion}&browser_online=true&tz_name=Asia/Saigon&aid=1988&app_name=tiktok_web&live_id=12&version_code=270000&debug=false&app_language=vi-VN&client_enter=1&room_id=${this.room_id}&identity=audience&history_comment_count=6&fetch_rule=1&last_rtt=${this.last_rtt}&internal_ext=${(internal_ext).replaceAll("|","%7C")}&cursor=${cursor}&history_comment_cursor=${history_comment_cursor}&sup_ws_ds_opt=1&resp_content_type=protobuf&did_rule=3`;
                let url = "";
                
                if(!internal_ext) {
                    endpoint = `version_code=180800&device_platform=web&cookie_enabled=true&screen_width=1512&screen_height=982&browser_language=vi&browser_platform=${browser_platform}&browser_name=Mozilla&browser_version=${appVersion}&browser_online=true&tz_name=Asia/Saigon&aid=1988&app_name=tiktok_web&live_id=12&version_code=270000&debug=false&app_language=vi-VN&client_enter=1&room_id=${this.room_id}&identity=audience&history_comment_count=6&fetch_rule=1&last_rtt=-1&internal_ext=0&cursor=0&history_comment_cursor=0&sup_ws_ds_opt=1&resp_content_type=protobuf&did_rule=3`;
                }
                
                if(this.imfetch_time >= 11) {
                    endpoint = this.endpoint;
                    this.delay = getRandomInt(30,45)*1000;
                } else {
                    this.endpoint = endpoint;
                    this.delay = this.delay_all_time;
                }
                
                let route = 'https://webcast.tiktok.com/webcast/im/fetch/';
                let { targetUrl} = await this.sign({
                    url: `${route}?${endpoint}`,
                    msToken,
                });
                let is_retry = false;
                
                
                // let  { url: targetUrl, xbogus, _signature, is_retry} = await br.buildUrlPageFull({url: `${route}?${endpoint}`, msToken})
                if(is_retry) {
                    await delay(500);
                    return r(await this.fetch());
                }
                
                url = targetUrl;
                var options = {
                    url: url,
                    method: 'GET',
                    timeout,
                    headers: {
                        'Accept': '*/*',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Connection': 'keep-alive',
                        'Cookie': cookie_string,
                        "priority": "u=1, i",
                        "b": cookie_string,
                        'Origin': 'https://www.tiktok.com',
                        'Referer': 'https://www.tiktok.com',
                        'Sec-Fetch-Dest': 'empty',
                        'Sec-Fetch-Mode': 'cors',
                        'Sec-Fetch-Site': 'same-origin',
                        'User-Agent': userAgentDefault,
                        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        'sec-ch-ua': '"Chromium";v="131", "Not:A-Brand";v="24", "Google Chrome";v="131"',
                        'sec-ch-ua-mobile': '?0',
                        'sec-ch-ua-platform': '"macOS"',
                        "dnt": "1",
                        'x-secsdk-csrf-token': 'DOWNGRADE'
                    },
                    isRetry: true,
                    retryTime: 2,
                    responseType: 'arraybuffer',
                    preCheckRetry: (body, jsonBody) => {
                        if(!body || !body.includes(`wrss`)) {
                            return true;   
                        }
                    }
                };
                
                this.last_time = Date.now();
                let data_page = await this.makeRequest(options);
                
                if(data_page.bodyBinary) {
                    let hex = data_page.bodyBinary.toString('hex');
                    let idHexServer = getString(hex, "a181", "6720") ||
                                    getString(hex, "b181", "6720") ||
                                    getString(hex, "c181", "6720");
                    if(!this.idHexServer) {
                        this.idHexServer = idHexServer;
                    }
                }
                
                let that = this;
                function updateCookie() {
                    if(data_page.headers && data_page.headers['set-cookie'] && data_page.headers['set-cookie'].length) {
                        let new_cookie = data_page.headers['set-cookie'].map(i => {
                            let msToken = getString(i, 'msToken=', ';');
                            if(msToken) {
                                that.cookie_string = cookie_string.replace(/msToken=[^;]+/g, `msToken=${msToken}`);
                                return `msToken=${msToken}`;
                            }
                        });
                    }
                }
                updateCookie();
                
                this.last_rtt = Date.now() - this.last_time;
                
                function Wrss(data) {
                    let [t, w] = data.match(/wrss(.*?):/) || [];
                    w = w || "";
                    return w.slice(2,45);
                }
                
                function getData(split, current, is_last_time) {
                    split = split || [];
                    current = current || split.length - 1;
                
                    if(is_last_time) current = 0;
                
                    while(current >= 0) {
                        if(split[current].includes("fetch_time")) {
                            return split[current];
                        }
                        current--;
                    }
                
                    return "";
                }
                
                function getHistoryComment(split) {
                    let history_comment = "";
                    for(let i = 0; i < split.length; i++) {
                        if(split[i].includes("ws_proxy")) {
                            history_comment = split[i].slice(-19);
                        }
                    }
                    history_comment = history_comment.replace(/\D/g, "");
                    return history_comment;
                }
                
                if(!done) {
                    done = true;
                    if(data_page.error) {
                        console.log("error fetch", this.session_id, data_page.error, this.proxy);
                    }
                    if(data_page.status == 403) {
                        console.log("fetch 403", this.session_id, this.proxy);
                        this.updateAccountStatus("403fetch");
                        throw new Error("Request failed with status code 403");
                    }
                    
                    if(data_page.body && data_page.body.length) {
                        let split = data_page.body.split('\n');
                        let wrss = Wrss(data_page.body);
                        
                        wrss = wrss.replace(":", "");
                        if(wrss) {
                            this.wrss = wrss;
                        }
                        
                        let str = getData(split);
                        let ext = getString(str, 'fetch_time').replace('0\x01:&', '').replace(/\x01/g, "").replace(":\t", "");
                        let cursor = getString(ext, 'next_cursor:', '|').replace('\x01:&', '');
                        
                        if(!this.history_comment_cursor) {
                            this.history_comment_cursor = getHistoryComment(split);
                        }
                        
                        if(this.setCursor) {
                            ext = ext.replace(/:3$/, "");
                            ext = ext.endsWith("00") ? ext.replace(/0$/, "") : ext;
                            this.internal_ext = 'fetch_time' + ext;
                            this.cursor = cursor;
                        }
                    }
                    
                    let result = {
                        is_403: data_page.status == 403,
                        is_fetch: true,
                        process_time: Date.now() - start,
                        start
                    };
                    this.fetch_403 = data_page.status == 403;
                    return r(result);
                }
            } catch(error) {
                console.log("error", error);
                if(error.message.includes("status code 403")) {
                    this.internal_ext = "";
                    this.cursor = "";
                    this.last_time = 0;
                }
                
                this.url = "";
                let result = {
                    is_403: error.message.includes("status code 403") ? true : false,
                    is_fetch: true,
                    error: error.message,
                    process_time: Date.now() - start,
                    start
                };
                this.fetch_403 = error.message.includes("status code 403") ? true : false;
                
                return r(result);
            }
        });
    }
    async updateAccountStatus(status = "active") {
        let storageManager = null;
        try {
            storageManager = new StorageManager();
            await storageManager.init();  // Khởi tạo database connection
            await storageManager.updateAccountStatus(this.username, status);
            console.log("updateAccountStatus success", this.username, status);
        } catch (error) {
            console.log("updateAccountStatus error", error.message);
        } finally {
            // Luôn đóng connection để tránh memory leak
            if (storageManager) {
                try {
                    await storageManager.close();
                } catch (closeError) {
                    console.log("Error closing storage manager:", closeError.message);
                }
            }
        }
    }

    // =========== PHƯƠNG THỨC QUẢN LÝ GROUP VIEWER ===========
    static setdatelocal(key, value) {
        data_local[key] = value;
    }
    
    static getdatelocal(key) {
        return data_local[key];
    }
    
    static async checkViewer403() {
        // while(is_running) {
        //     await delay(20000);
        //     try {
        //         let total = 0;
        //         let fetch_403 = 0;
        //         let list_403 = [];
        //         let list_die = [];
                
        //         for(let i in data) {
        //             let sockets = data[i].sockets;
        //             sockets.forEach(item => {
        //                 total++;
        //                 if(item.status_viewer == 4 && !list_403_total.includes(item.session_id)) {
        //                     list_403.push(item.session_id);
        //                     list_403_total.push(item.session_id);
        //                     fetch_403++;
        //                 }
        //                 if(item.status_viewer == 3 && !list_die_total.includes(item.session_id)) {
        //                     list_die.push(item.session_id);
        //                     list_die_total.push(item.session_id);
        //                 }
        //             });
        //         }
                
        //         if(list_403.length > 0) {
        //             console.log("list_403", list_403.length);
        //             // await GroupView.send403Rabbit(list_403,"update_account_403");
        //         }
                
        //         if(list_die.length > 0) {
        //             console.log("list_die", list_die.length);
        //             // await GroupView.send403Rabbit(list_die,"update_account_die");
        //         }
        //     } catch(e) {
        //         console.log("checkViewer403 error", e);
        //     }
        // }
    }
    
    static async removeViewer(socket) {
        // Phương thức để xóa viewer khỏi danh sách
    }
    
    static startProxyGroupViewers({accounts, task_id, proxy, room_id, ex_wrss}) {
        try {
            accounts.forEach(async (i, index) => {
                let p = getString(i+";", "proxy=",";");
                if(p && proxy) {
                    i = i.replace("proxy="+p,"");
                    i += ";proxy="+proxy;
                }
                let proxy_list = [p];
                let viewer = new GroupView({
                    cookie_string: i, 
                    room_id, 
                    proxy: proxy || p, 
                    proxy_list, 
                    server_site: data_local.server_site
                });
                viewer.run();
                data[task_id].sockets = [...data[task_id].sockets, viewer];
            });
        } catch(e) {
            console.log("startProxyGroupViewers error", e, (new Date().toLocaleString()));
        }
        // GroupView.checkViewer403();
    }
    
    static async startViewers({accounts, task_id, proxy, room_id, ex_wrss, tokens}) {
        try {
            console.log("Start task_id:", task_id, " room:", room_id, " accounts:", accounts.length);
            data[task_id] = { sockets: []};
            let grouped_proxy = accounts.reduce((pre, cur) => {
                let p = getString(cur+";", "proxy=",";");
                return {...pre, [p]: pre[p] ? [...pre[p], cur]: [cur]};
            }, {});
            
            for(let i in grouped_proxy) {
                GroupView.startProxyGroupViewers({
                    accounts: grouped_proxy[i],
                    task_id,
                    proxy,
                    room_id
                });
            }
        } catch(e) {
            console.log("startViewers error", e, (new Date().toLocaleString()));
        }
    }
    
    static async updateProxy({data_proxy}) {
        try {
            for(let task_id in data) {
                if(data[task_id]) {
                    let sockets = data[task_id].sockets;
                    for(let i = 0; i < sockets.length; i++) {
                        if(sockets[i].status == "running") {
                            let p = getString(sockets[i].cookie_string+";", "proxy=",";");
                            if(p && data_proxy[p]) {
                                sockets[i].proxy = data_proxy[p];
                                sockets[i].proxy_list = [data_proxy[p]];
                            }
                        }
                    }
                }
            }
        } catch(e) {
            console.log("updateProxy error", e, (new Date().toLocaleString()));
        }
    }
    
    static async stopViewers({ task_id }) {
        is_running = false;
        console.log("Stop -- task_id:", task_id);
        try {
            if(data[task_id]) {
                for(let i = 0; i < data[task_id].sockets.length; i++) {
                    data[task_id].sockets[i].cancel();
                }
                data[task_id].sockets = [];
            }
        } catch(e) {
            console.log("stopViewers error", e, (new Date().toLocaleString()));
        }
    }
    
    // static async send403Rabbit(list_403, action = "update_account_403") {
    //     try {
    //         let rabbitService = await RabbitMQ.getInstance({
    //             url: "amqp://bupmat:bupmat@185.190.140.88:5672/" + data_local.server_site + "?heartbeat=60"
    //         });
    //         if(list_403.length) {
    //             let message = {
    //                 "action": action, 
    //                 "accounts": list_403, 
    //                 time_now: Date.now()
    //             };
    //             await rabbitService.sendMessage("rabbit_cron", message);
    //         }
    //     } catch(error) {
    //         console.log("error handleSendRabbit", error);
    //     }
    // }

    // Phương thức chuẩn hóa xử lý chuỗi proxy
    parseProxyString(proxy) {
        if (!proxy) return null;
        
        try {
            // Trường hợp proxy đã là object
            if (typeof proxy === 'object' && proxy.host && proxy.port) {
                return proxy;
            }
            
            // Trường hợp proxy là string
            if (typeof proxy === 'string') {
                // Proxy là URL đầy đủ (http://user:pass@host:port)
                if (proxy.includes('://')) {
                    try {
                        const proxyUrl = new URL(proxy);
                        return {
                            protocol: proxyUrl.protocol.replace(':', ''),
                            host: proxyUrl.hostname,
                            port: parseInt(proxyUrl.port),
                            username: proxyUrl.username || undefined,
                            password: proxyUrl.password || undefined
                        };
                    } catch (e) {
                        console.log("Error parsing proxy URL:", e.message);
                    }
                }
                
                // Proxy dạng user:pass@host:port
                if (proxy.includes('@')) {
                    const [auth, hostPort] = proxy.split('@');
                    if (hostPort && hostPort.includes(':')) {
                        const [host, port] = hostPort.split(':');
                        const [username, password] = auth.split(':');
                        return {
                            host,
                            port: parseInt(port),
                            username,
                            password
                        };
                    }
                }
                
                // Proxy dạng host:port
                if (proxy.includes(':')) {
                    const [host, port] = proxy.split(':');
                    return {
                        host,
                        port: parseInt(port)
                    };
                }
            }
            
            console.log("Invalid proxy format:", proxy);
            return null;
        } catch (e) {
            console.log("Error parsing proxy:", e.message);
            return null;
        }
    }
}

GroupView.data = data;
module.exports = GroupView;