const fs = require('fs')
const path = require("path")
const request = require("request")
const os = require('os');
const {execSync,exec, spawn} = require('child_process');
const crypto = require('crypto');
const { log, error } = require('../../lib/logger');
const helper = {
  genuaMAC(){
    var ua = `Mozilla/5.0 (Macintosh; Intel Mac OS X ${helper.getRandomInt (10, 17)}_${helper.getRandomInt (0, 3)}_${helper.getRandomInt (0, 3)}) AppleWebKit/${helper.getRandomInt (500, 600)}.1.${helper.getRandomInt (1, 15)} (KHTML, like Gecko) Version/${helper.getRandomInt (15, 17)}.${helper.getRandomInt (0, 3)} Safari/${helper.getRandomInt (500, 600)}.1.${helper.getRandomInt (1, 15)}`
    return ua
},
  makeSureDir:(dir)=>{
    return new Promise((r) => {
        try {
            if(!fs.existsSync(dir)){
                fs.mkdirSync(dir)
            }
            return r(true)
        } catch(e){
            error("error makeSureDir", e)
            return (false)
        }
       
    })
},
  strData: function (path) {
    return new Promise((r) => {
      try {
        fs.exists(path, (ex)=>{
          if(!ex) return r("")
          let stream = fs.createReadStream(path || './data/strData.txt')
          let str = ''
          stream.on('data', (chunk) => {
            str += chunk
          })
          stream.on('end', (chunk) => {
            r(str.trim())
          })
        })
        
      } catch(error) {
        r("")
      }

    })
  },
  appendFile : async function ({path, data}) {
    return await new Promise((r)=>{
      try {
        fs.appendFile(path, data, error=>r(error? false: true))
      } catch(e) {
        error("appendFile error", e)
      }
    })
  },
  writeFile : async function ({path, data}) {
    return await new Promise((r)=>{
      try {
        fs.writeFile(path, data, error=>r(error? false: true))
      } catch(e) {
        error("writeFile error", e)
      }
    })
  },
  shuffle: (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  },
  log_403: async function ({timestamp, clones, number_id}){
    try { 
      let _path_session = `./log_403/${timestamp}_${number_id}_sessionids.txt`;
      let _path_cookies = `./log_403/${timestamp}_${number_id}_cookies.txt`;
      let sessionids = await helper.strData( path.resolve(_path_session))|| "";
      let sessionids_w = [];
      let cookies_w = [];
      for (let clone of clones){
          if(!sessionids.includes(clone.session_id)){
            sessionids_w.push(clone.session_id);
            cookies_w.push(clone.cookie_string)
          }
      }
      if(cookies_w.length){
        sessionids_w = sessionids_w.join("|") + "|"
        cookies_w = cookies_w.join("\n") + "\n"
  
        helper.appendFile({path:_path_session, data: sessionids_w });
        helper.appendFile({path:_path_cookies, data: cookies_w });
      }
    } catch(e){
      error("log_403 error", e)
    }
  },
  logs_die: async function ({clones}){
    try { 
      let _path_session = `./data/acc_die_sessionids.txt`;
      let _path_cookies = `./data/acc_die.txt`;
      let  sessionids_w = [],
         cookies_w = [];
      let sessionids = await helper.strData( path.resolve(_path_session))|| "";

      for (let clone of clones){
          if(!sessionids.includes(clone.session_id)){
            sessionids_w.push(clone.session_id);
            cookies_w.push(clone.cookie_string)
          }
      }
      if(cookies_w.length){
        sessionids_w = sessionids_w.join("|") + "|"
        cookies_w = cookies_w.join("\n") + "\n"
  
        helper.appendFile({path:_path_session, data: sessionids_w });
        helper.appendFile({path:_path_cookies, data: cookies_w });
      }
    } catch(e){
      error("log_die error", e)
    }
  },
  getAccs: async function () {
    let stringSource = await helper.strData(path.resolve("./data/acc_string.txt"));
    let strings = stringSource.trim().split("\n");
    let array = [
      {
          "domain": ".tiktok.com",
          "expirationDate": 1694925287.184404,
          "hostOnly": false,
          "httpOnly": true,
          "name": "cmpl_token",
          "path": "/",
          "sameSite": "unspecified",
          "secure": true,
          "session": false,
          "storeId": "0",
          "value": "AgQQAPOFF-RO0rSNM89JeJ08_tTE3iYMf4UOYM4hxg",
          "id": 1
      },
      {
          "domain": ".tiktok.com",
          "expirationDate": 1691722929.57717,
          "hostOnly": false,
          "httpOnly": false,
          "name": "msToken",
          "path": "/",
          "sameSite": "no_restriction",
          "secure": true,
          "session": false,
          "storeId": "0",
          "value": "ZrmrlCOXaPIsJPAAgnhkyYPI54Kh0TAS0z7hTdDE2GuXp4rrxhCc94EKDE3oN0-QJu2tLAaeRdruxwas227-xiHxJJJJ-pCdV7v-3PTJ79S8h_QwwRztW1mFXZi7jnihubLIxKc=",
          "id": 2
      },
      {
          "domain": ".tiktok.com",
          "expirationDate": 1722394927.966251,
          "hostOnly": false,
          "httpOnly": true,
          "name": "odin_tt",
          "path": "/",
          "sameSite": "unspecified",
          "secure": false,
          "session": false,
          "storeId": "0",
          "value": "c0d19f2b161b916d6da355bd7f1f88145e123c17af81e155ae7478fe734de73c4e4c7f185119408308bb33245768d27f1e127553f07dc64b8aa60659376dfd954e376b1116cc77c861ba98e09101fe0d",
          "id": 3
      },
      {
          "domain": ".tiktok.com",
          "expirationDate": 1692333287.184437,
          "hostOnly": false,
          "httpOnly": true,
          "name": "passport_auth_status",
          "path": "/",
          "sameSite": "unspecified",
          "secure": false,
          "session": false,
          "storeId": "0",
          "value": "c769e1989f8a526be4320cc7d6150828%2C76c18c9ea61bc03228aebe967af7db83",
          "id": 4
      },
      {
          "domain": ".tiktok.com",
          "expirationDate": 1692333287.184451,
          "hostOnly": false,
          "httpOnly": true,
          "name": "passport_auth_status_ss",
          "path": "/",
          "sameSite": "no_restriction",
          "secure": true,
          "session": false,
          "storeId": "0",
          "value": "c769e1989f8a526be4320cc7d6150828%2C76c18c9ea61bc03228aebe967af7db83",
          "id": 5
      },
      {
          "domain": ".tiktok.com",
          "expirationDate": 1694876512.0136,
          "hostOnly": false,
          "httpOnly": false,
          "name": "passport_csrf_token",
          "path": "/",
          "sameSite": "no_restriction",
          "secure": true,
          "session": false,
          "storeId": "0",
          "value": "f6adbbf41da4349e1d95e0ff2361f78a",
          "id": 6
      },
      {
          "domain": ".tiktok.com",
          "expirationDate": 1694876512.013636,
          "hostOnly": false,
          "httpOnly": false,
          "name": "passport_csrf_token_default",
          "path": "/",
          "sameSite": "unspecified",
          "secure": false,
          "session": false,
          "storeId": "0",
          "value": "f6adbbf41da4349e1d95e0ff2361f78a",
          "id": 7
      },
      {
          "domain": ".tiktok.com",
          "expirationDate": 1705293286.184521,
          "hostOnly": false,
          "httpOnly": true,
          "name": "sessionid",
          "path": "/",
          "sameSite": "unspecified",
          "secure": true,
          "session": false,
          "storeId": "0",
          "value": "118adf4b4f42221cdf948dd6bcfa21b3",
          "id": 8
      },
      {
          "domain": ".tiktok.com",
          "expirationDate": 1705293286.184533,
          "hostOnly": false,
          "httpOnly": true,
          "name": "sessionid_ss",
          "path": "/",
          "sameSite": "no_restriction",
          "secure": true,
          "session": false,
          "storeId": "0",
          "value": "118adf4b4f42221cdf948dd6bcfa21b3",
          "id": 9
      },
      {
          "domain": ".tiktok.com",
          "expirationDate": 1720845287.184469,
          "hostOnly": false,
          "httpOnly": true,
          "name": "sid_guard",
          "path": "/",
          "sameSite": "unspecified",
          "secure": true,
          "session": false,
          "storeId": "0",
          "value": "118adf4b4f42221cdf948dd6bcfa21b3%7C1689741287%7C15551999%7CMon%2C+15-Jan-2024+04%3A34%3A46+GMT",
          "id": 10
      },
      {
          "domain": ".tiktok.com",
          "expirationDate": 1705293286.184507,
          "hostOnly": false,
          "httpOnly": true,
          "name": "sid_tt",
          "path": "/",
          "sameSite": "unspecified",
          "secure": true,
          "session": false,
          "storeId": "0",
          "value": "118adf4b4f42221cdf948dd6bcfa21b3",
          "id": 11
      },
      {
          "domain": ".tiktok.com",
          "expirationDate": 1705293286.184547,
          "hostOnly": false,
          "httpOnly": true,
          "name": "sid_ucp_v1",
          "path": "/",
          "sameSite": "unspecified",
          "secure": true,
          "session": false,
          "storeId": "0",
          "value": "1.0.0-KDc2ZjEyZGEwOTFhYzIwOTE0MjEyMjFiMDVjOTNmMDI5NDAxYTAyODQKHwiFiKmKjK332WQQ58_dpQYYswsgDDCMu8-lBjgIQBIQAxoGbWFsaXZhIiAxMThhZGY0YjRmNDIyMjFjZGY5NDhkZDZiY2ZhMjFiMw",
          "id": 12
      },
      {
          "domain": ".tiktok.com",
          "expirationDate": 1705293286.184559,
          "hostOnly": false,
          "httpOnly": true,
          "name": "ssid_ucp_v1",
          "path": "/",
          "sameSite": "no_restriction",
          "secure": true,
          "session": false,
          "storeId": "0",
          "value": "1.0.0-KDc2ZjEyZGEwOTFhYzIwOTE0MjEyMjFiMDVjOTNmMDI5NDAxYTAyODQKHwiFiKmKjK332WQQ58_dpQYYswsgDDCMu8-lBjgIQBIQAxoGbWFsaXZhIiAxMThhZGY0YjRmNDIyMjFjZGY5NDhkZDZiY2ZhMjFiMw",
          "id": 13
      },
      {
          "domain": ".tiktok.com",
          "expirationDate": 1705293285.957351,
          "hostOnly": false,
          "httpOnly": true,
          "name": "store-country-code",
          "path": "/",
          "sameSite": "unspecified",
          "secure": false,
          "session": false,
          "storeId": "0",
          "value": "vn",
          "id": 14
      },
      {
          "domain": ".tiktok.com",
          "expirationDate": 1705293285.95737,
          "hostOnly": false,
          "httpOnly": true,
          "name": "store-country-code-src",
          "path": "/",
          "sameSite": "unspecified",
          "secure": false,
          "session": false,
          "storeId": "0",
          "value": "uid",
          "id": 15
      },
      {
          "domain": ".tiktok.com",
          "expirationDate": 1705293285.957268,
          "hostOnly": false,
          "httpOnly": true,
          "name": "store-idc",
          "path": "/",
          "sameSite": "unspecified",
          "secure": false,
          "session": false,
          "storeId": "0",
          "value": "alisg",
          "id": 16
      },
      {
          "domain": ".tiktok.com",
          "expirationDate": 1706410924.525725,
          "hostOnly": false,
          "httpOnly": true,
          "name": "tt_chain_token",
          "path": "/",
          "sameSite": "unspecified",
          "secure": true,
          "session": false,
          "storeId": "0",
          "value": "Whz3fV/uffg2X3rFI2jDwA==",
          "id": 17
      },
      {
          "domain": ".tiktok.com",
          "hostOnly": false,
          "httpOnly": true,
          "name": "tt_csrf_token",
          "path": "/",
          "sameSite": "lax",
          "secure": true,
          "session": true,
          "storeId": "0",
          "value": "LcrwQjqk-fbeiBqQQm_yApX92ZX4znDxqhug",
          "id": 18
      },
      {
          "domain": ".tiktok.com",
          "expirationDate": 1705293285.957385,
          "hostOnly": false,
          "httpOnly": true,
          "name": "tt-target-idc",
          "path": "/",
          "sameSite": "unspecified",
          "secure": false,
          "session": false,
          "storeId": "0",
          "value": "alisg",
          "id": 19
      },
      {
          "domain": ".tiktok.com",
          "expirationDate": 1721277288.013407,
          "hostOnly": false,
          "httpOnly": true,
          "name": "tt-target-idc-sign",
          "path": "/",
          "sameSite": "unspecified",
          "secure": false,
          "session": false,
          "storeId": "0",
          "value": "WFpDkj4jovvU0oiahNJfMdjh2TGF15_K7cFJ4zM8cK0M3KYtkD6sE86i7_7LIb8G6R7tX3T-_1-xonpFwS5Q_wPk6f6xiPRXCaDsYEdrOkXrmKPiOXwqClUtXedo_r2V9sDmxiazAjH39J1E8X73xjPBnDNb1RZ1OEimlYv86BteD_FNGlHcf1Dku5BLy5jBReyMpoav7oRggBQLxV6_N-rKbHPDbX_2IMzaYm5Tf7w_woYDtvavO03G-0JkTL5xIthw9NE22hg6F-z2aI4m6pO-4P50rjaZO8T9bFr5WSIxMYRKpRYrQpceIZY-nNzxZyj9YVbozc_pPfdH1NuPBi7sHMM_P0TB4yU8rN7j1QjJ9KUPNARo8rETFH_8r3VayU7jlivdFxZDbDXWql6aVZheMYoYqKZYjpuaEdU-kciZJu0pwOQfgu2v7q1uAOnRMZEpG6KE0vGNFuxLEH4SBEw5wmXSSMMVW2nGlIWpOdyO0d8-rC_oM_V_rvhgFTn6",
          "id": 20
      },
      {
          "domain": ".tiktok.com",
          "expirationDate": 1722394929.232063,
          "hostOnly": false,
          "httpOnly": true,
          "name": "ttwid",
          "path": "/",
          "sameSite": "no_restriction",
          "secure": true,
          "session": false,
          "storeId": "0",
          "value": "1%7CcQahXXK1a5BOFLsJFF3vybReES7y-dREXvLhf4dFZ-0%7C1690858929%7C135da0f55ee0113f4ac2424c6d31a72953920a0845e9dec18009f2350c89738b",
          "id": 21
      },
      {
          "domain": ".tiktok.com",
          "expirationDate": 1705293286.184483,
          "hostOnly": false,
          "httpOnly": true,
          "name": "uid_tt",
          "path": "/",
          "sameSite": "unspecified",
          "secure": true,
          "session": false,
          "storeId": "0",
          "value": "6659faeffde75c6b04d5303ec7499115d60186fa016cc70a0769ea5d83c7caff",
          "id": 22
      },
      {
          "domain": ".tiktok.com",
          "expirationDate": 1705293286.184495,
          "hostOnly": false,
          "httpOnly": true,
          "name": "uid_tt_ss",
          "path": "/",
          "sameSite": "no_restriction",
          "secure": true,
          "session": false,
          "storeId": "0",
          "value": "6659faeffde75c6b04d5303ec7499115d60186fa016cc70a0769ea5d83c7caff",
          "id": 23
      },
      {
          "domain": ".www.tiktok.com",
          "expirationDate": 1691463727,
          "hostOnly": false,
          "httpOnly": false,
          "name": "__tea_cache_tokens_1988",
          "path": "/",
          "sameSite": "unspecified",
          "secure": false,
          "session": false,
          "storeId": "0",
          "value": "{%22_type_%22:%22default%22%2C%22user_unique_id%22:%227256809649374184967%22%2C%22timestamp%22:1689607678276}",
          "id": 24
      },
      {
          "domain": ".www.tiktok.com",
          "hostOnly": false,
          "httpOnly": false,
          "name": "passport_fe_beating_status",
          "path": "/",
          "sameSite": "unspecified",
          "secure": false,
          "session": true,
          "storeId": "0",
          "value": "true",
          "id": 25
      },
      {
          "domain": ".www.tiktok.com",
          "expirationDate": 1716778927,
          "hostOnly": false,
          "httpOnly": false,
          "name": "tiktok_webapp_theme",
          "path": "/",
          "sameSite": "unspecified",
          "secure": true,
          "session": false,
          "storeId": "0",
          "value": "light",
          "id": 26
      },
      {
          "domain": "www.tiktok.com",
          "expirationDate": 1721143678.809367,
          "hostOnly": true,
          "httpOnly": false,
          "name": "living_user_id",
          "path": "/",
          "sameSite": "unspecified",
          "secure": false,
          "session": false,
          "storeId": "0",
          "value": "98610993253",
          "id": 27
      },
      {
          "domain": "www.tiktok.com",
          "expirationDate": 1698561981,
          "hostOnly": true,
          "httpOnly": false,
          "name": "msToken",
          "path": "/",
          "sameSite": "unspecified",
          "secure": false,
          "session": false,
          "storeId": "0",
          "value": "L8KMHEgRCEs1LGufwSdLNFlGS6q4zyImq0mAyRXmdh-lqcJdHbBSsl_2d4egmql_IiuEoXTwUK-tnhla_-9GTHozKgUSphWxb9AhyzIlGaF1FTnzcq47NVKOMHJ7WUksEHxeryU=",
          "id": 28
      }
      ]
    let list = [];
    strings.forEach(s => {
      let new_arr = [];
      let s2 = s.split("|");
      let string = s2[5]
      let strs = string.split(";");
      let sid = ""
      strs.forEach(item => {
        let is = item.split("=");
        let index = array.findIndex(i => i.name == is[0]);
        if (is[0] == "sessionid") {
          sid = is[1]
        }
        if (index !== -1) {
          let new_i = array[index];
          new_i.value = is[1]
          new_arr.push(new_i)
        }
      })
      list.push({ array_cookie: new_arr, device_id: sid, name: sid })
    })
    return list
  },
  delay: function (time) {
    return new Promise((r) => setTimeout(()=>{
      return r()
    }, time))
  },
  delayRandom: function (time) {
    return new Promise((r) =>
      setTimeout(r, (time || 1000) + (Math.floor(Math.random() * 5) + 1) * 18)
    )
  },
  getPosition: function (string, subString, index) {
    return string.split(subString, index).join(subString).length
  },

  getString: function (test_str, text_begin, text_end, index) {
    var fromIndex = index || 1
    if (!test_str || test_str == '') {
      return ''
    }
    var start_pos = helper.getPosition(
      test_str.toString(),
      text_begin,
      fromIndex
    )
    if (start_pos < 0 || start_pos == test_str.length) {
      return ''
    }
    start_pos += text_begin.length
    var end_pos = test_str.indexOf(text_end, start_pos)
    if (end_pos == -1) end_pos = test_str.length
    var text_to_get = test_str.substring(start_pos, end_pos)
    if (text_to_get == test_str) return ''
    return text_to_get
  },
  getRoomId: async function ({name, proxy, retryCount }) {
    if (!name.includes("https://")) {
      name = `https://www.tiktok.com/@${name}/live`
    };
    // console.log('name',name)
    let retry = retryCount || 0;

    return new Promise(r => {
      const options = {
        url: name,
        method: 'GET',
      }
      if (proxy) {
        let proxystr = ""
        if( typeof proxy == "string") {
          proxystr = proxy
        } else {
          let { protocol, host, port, username, password } = proxy;
          proxystr = `${protocol || "http"}://${username && password ? `${username}:${password}@` : ''}${host}:${port}`
        }
        options.proxy = proxystr
      }
      request(options,async (error, response, body) => {
        if(error || !body) {
          if(retry< 3){
            retry++
            return r(await helper.getRoomId({name, proxy, retryCount: retry}))
          } else {
            return r("")
          }
        }
        let room = helper.getString((body || ""), "room_id=", `"`);
        return r(room)
      })
    })
  },

  getRoomId2: async function ({name, proxy, retryCount, cookie_string }) {
    // console.log(proxy)
    // proxy = helper.getProxyX();
    if (!name.includes("https://")) {
      name = `https://www.tiktok.com/@${name}/live`
    };
    // console.log('name',name)
    let retry = retryCount || 0;
    let headers = {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
        'authority': 'www.tiktok.com',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'en-US,en;q=0.9,it-IT;q=0.8,it;q=0.7,ko;q=0.6,ja;q=0.5,zh;q=0.4,vi;q=0.3,vi-VN;q=0.2,zh-HK;q=0.1',
        'cache-control': 'no-cache',
        'dnt': '1',
        'pragma': 'no-cache',
        'sec-ch-ua': '"Chromium";v="116", "Not)A;Brand";v="24", "Google Chrome";v="116"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        cookie: cookie_string
    }
    return new Promise(r => {
      const options = {
        url: name,
        headers: headers,
        method: 'GET',
      }
      if (proxy) {
        let proxystr = ""
        if( typeof proxy == "string") {
          proxystr = proxy
        } else {
          let { protocol, host, port, username, password } = proxy;
          proxystr = `${protocol || "http"}://${username && password ? `${username}:${password}@` : ''}${host}:${port}`
        }
        options.proxy = proxystr
      }
      request(options,async (error, response, body) => {
        console.log(body,proxy)
        if(error || !body) {
          if(retry< 5){
            retry++
            console.log(error,body)
            return r(await helper.getRoomId2({name, proxy, retryCount: retry}))
          } else {
            return r("")
          }
        }
        let room = helper.getString((body || ""), "room_id=", `"`);
        return r(room)
      })
    })
  },
  isNumeric: function (value) {
    return !isNaN(value) && !isNaN(parseFloat(value));
  },
  getRoomId3: async function ({name, proxy, retryCount, cookie_string }) {
    console.log(proxy)
    // proxy = helper.getProxyX();
    if(!name) {
      return ""
    }
    // if (!name.includes("https://")) {
    //   name = `https://www.tiktok.com/@${name}/live`
    // };
    let url = `https://www.tiktok.com/api-live/user/room/?aid=1988&app_language=en-US&app_name=tiktok_web&browser_language=en&browser_name=Mozilla&browser_online=true&browser_platform=Win32&browser_version=5.0+%28Windows+NT+10.0%3B+Win64%3B+x64%29+AppleWebKit%2F537.36+%28KHTML%2C+like+Gecko%29+Chrome%2F106.0.0.0+Safari%2F537.36&cookie_enabled=true&cursor=&internal_ext=&device_platform=web&focus_state=true&from_page=user&history_len=0&is_fullscreen=false&is_page_visible=true&did_rule=3&fetch_rule=1&last_rtt=0&live_id=12&resp_content_type=protobuf&screen_height=1152&screen_width=2048&tz_name=Europe%2FBerlin&referer=https%3A%2F%2Fwww.tiktok.com%2F&root_referer=https%3A%2F%2Fwww.tiktok.com%2F&host=https%3A%2F%2Fwebcast.tiktok.com&webcast_sdk_version=1.3.0&update_version_code=1.3.0&uniqueId=${name}&sourceType=54`
    console.log('name',name)
    let retry = retryCount || 0;
    let headers = {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        'authority': 'www.tiktok.com',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'en-US,en;q=0.9,it-IT;q=0.8,it;q=0.7,ko;q=0.6,ja;q=0.5,zh;q=0.4,vi;q=0.3,vi-VN;q=0.2,zh-HK;q=0.1',
        'cache-control': 'no-cache',
        'dnt': '1',
        // 'referer': name,
        'pragma': 'no-cache',
        'sec-ch-ua': '"Chromium";v="116", "Not)A;Brand";v="24", "Google Chrome";v="116"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
    }
    return new Promise(r => {
      const options = {
        url: url,
        headers: headers,
        method: 'GET',
      }
      if (proxy) {
        let proxystr = ""
        if( typeof proxy == "string") {
          proxystr = proxy
        } else {
          let { protocol, host, port, username, password } = proxy;
          proxystr = `${protocol || "http"}://${username && password ? `${username}:${password}@` : ''}${host}:${port}`
        }
        options.proxy = proxystr
        if(!options.proxy.includes("http://")) {
          options.proxy = "http://"+options.proxy
        }
      }
      request(options,async (error, response, body) => {
        // console.log(body,proxy)
        if(error || !body) {
          if(retry< 5){
            retry++
            console.log(error,body)
            await helper.delay(2000)
            return r(await helper.getRoomId3({name, proxy, retryCount: retry}))
          } else {
            return r("")
          }
        }
        try{
          body = JSON.parse(body);
          return r(body)
        }catch(e) {
          console.log(e)
          return r("")
        }
        
      })
    })
  },
  getRoomId31: async function ({name, proxy, retryCount, cookie_string }) {
    // console.log(proxy)
    // proxy = helper.getProxyX();
    if (!name.includes("https://")) {
      name = `https://www.tiktok.com/@${name}/live`
    };
    // console.log('name',name)
    let retry = retryCount || 0;
    let headers = {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
        'authority': 'www.tiktok.com',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'en-US,en;q=0.9,it-IT;q=0.8,it;q=0.7,ko;q=0.6,ja;q=0.5,zh;q=0.4,vi;q=0.3,vi-VN;q=0.2,zh-HK;q=0.1',
        'cache-control': 'no-cache',
        'dnt': '1',
        'pragma': 'no-cache',
        'sec-ch-ua': '"Chromium";v="116", "Not)A;Brand";v="24", "Google Chrome";v="116"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        cookie: cookie_string
    }
    return new Promise(r => {
      const options = {
        url: name,
        headers: headers,
        method: 'GET',
      }
      if (proxy) {
        let proxystr = ""
        if( typeof proxy == "string") {
          proxystr = proxy
        } else {
          let { protocol, host, port, username, password } = proxy;
          proxystr = `${protocol || "http"}://${username && password ? `${username}:${password}@` : ''}${host}:${port}`
        }
        options.proxy = proxystr
      }
      let req = request(options);
      let dataCollected = '';

        req.on('data', function(chunk) {
            dataCollected += chunk.toString();

            // Check if the desired data is in the partial response
            if (dataCollected.includes('room_id=')) {
                let startIndex = dataCollected.indexOf('room_id=');
                let endIndex = dataCollected.indexOf('&', startIndex);
                let roomId = dataCollected.substring(startIndex, endIndex !== -1 ? endIndex : dataCollected.length);

                // Resolve the Promise with the roomId
                // r(roomId);
                req.abort();
                let room = helper.getString((roomId || ""), "room_id=", `"`);
                return r(room)

                // Abort the request
            }else if (dataCollected.includes('"roomId":"')) {
                let startIndex = dataCollected.indexOf('"roomId":"');
                let endIndex = dataCollected.indexOf('signature', startIndex);
                let roomId = dataCollected.substring(startIndex, endIndex !== -1 ? endIndex : dataCollected.length);

                // Resolve the Promise with the roomId
                // r(roomId);
                req.abort();
                let room = helper.getString((roomId || ""), `"roomId":"`, `"`);
                return r(room)

                // Abort the request
            }
        });

        req.on('end',async function() {
            // if(retry< 5){
            //   retry++
            //   return r(await helper.getRoomId3({name, proxy, retryCount: retry}))
            // } else {
            //   return r("")
            // }
        });

        req.on('error',async function(error) {
            if (error.message === 'aborted') {
                // console.log('Request was aborted successfully.');
            } else {
              // console.log("ok")
                if(retry< 5){
                  retry++
                  // console.log(error)
                  return r(await helper.getRoomId3({name, proxy, retryCount: retry}))
                } else {
                  return r("")
                }
            }
        });
      // request(options,async (error, response, body) => {
      //   console.log(body,proxy)
      //   if(error || !body) {
      //     if(retry< 5){
      //       retry++
      //       console.log(error,body)
      //       return r(await helper.getRoomId3({name, proxy, retryCount: retry}))
      //     } else {
      //       return r("")
      //     }
      //   }
      //   let room = helper.getString((body || ""), "room_id=", `"`);
      //   return r(room)
      // })
    })
  },
  sign: function (options) {
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
      }, (err, response, body) => {
        if (err) {
          error("Lỗi khi lấy signature:", err);
          reject(err);
          return;
        }
        
        try {
          const data = JSON.parse(body);
          resolve(data);
        } catch (err) {
          error("Lỗi khi parse response:", err);
          reject(err);
        }
      });
    });
  },
  encodeRFC3986URIComponent: function(str) {
    return encodeURIComponent(str).replace(
      /[!'()*]/g,
      (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
    );
  },
  getProxySite: async function (proxy) {
    let url = 'http://217.15.163.20:8549/api/cron/getliveproxies?authensone=mysonetrend&time=120'
    let res = await helper.makeRequest({url})
    if(res.bodyJson && res.bodyJson.proxies && res.bodyJson.proxies.length > 0) {
      let proxies = res.bodyJson.proxies;
      return proxies
    }else{
      error("Error getting proxy site", res.body, res.bodyJson)
      return []
    }
  },
  getUserInfo :async function ({ proxy, cookie_string="", retryCount, username=null}){
    let msToken = helper.getString(cookie_string, "msToken=", ";");
    if(!msToken){
      msToken = 'X2q7i9LoPqE5eFSjcDdj4HpRSlIDNrf8EtP6oJY6zRM3KwanwHFEGF6sK3jMuMgptUPm5fBRRnl_seQqIiH_bfyUyPas91uCaLqlmNt2CFGgKcKif0F_2UoFjRQCGqXikRFZWBGb6_N0HANT6lo0ZZz0'.slice(0,150)+helper.generateRandomName(152-150)
    }
    msToken = 'LhYE1qGGn-4k0SfbOHfmYgG9_mJf_Ul7Hc0rNhyWBk3CQ4Klw-rUiKlY3YmXmumYjcgTGHtUH5CtM7UnOEleia5ioWPmQofcrsqJwi4Z1kSQ_a9l6FPPDmIkBzzYfBRfIcQYQOGlPoWTshNa4uMQA8P_'
    let device_id = helper.getString(cookie_string.replace(/ /g,'') + ';', ';wid=', ';');
    username = username || helper.getString(cookie_string.replace(/ /g,'') + ';', 'username=', ';');
    let userAgentDefault = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    let browser_platform = "MacIntel"
    userAgentDefault = "Mozilla/5.0 (X11; Ubuntu; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    browser_platform = encodeURIComponent("Linux x86_64")
    const appVersionDefault = userAgentDefault.replace("Mozilla/", "")
    let url = `https://www.tiktok.com/api/user/detail/?WebIdLastTime=${Math.floor(Date.now()/1000)}&abTestVersion=%5Bobject%20Object%5D&aid=1988&appType=t&app_language=en&app_name=tiktok_web&browser_language=en-US&browser_name=Mozilla&browser_online=true&browser_platform=${browser_platform}&browser_version=${helper.encodeRFC3986URIComponent(appVersionDefault)}&channel=tiktok_web&cookie_enabled=true&data_collection_enabled=true&device_id=${device_id}&device_platform=web_pc&focus_state=true&from_page=user&history_len=7&is_fullscreen=false&is_page_visible=true&language=en&needAudienceControl=false&os=linux&priority_region=VN&referer=&region=VN&screen_height=1117&screen_width=1728&secUid=&tz_name=Asia%2FSaigon&uniqueId=${username}&user=%5Bobject%20Object%5D&user_is_login=true&webcast_language=en`
    let  { targetUrl} =  await helper.sign({url, bodyEncoded:'',msToken})
    // console.log(targetUrl)
    // process.exit(0)
    if(!targetUrl) {
      return {
        avatarThumb: '',
        roomUsername: '',
        status_code: 0,
        err: true
      }
    }
    const options = {
      retryTime: 3,
  
      url: targetUrl,
      method: 'GET',
      headers: {
        Connection: 'keep-alive',
        'Cache-Control': 'max-age=0',
        'User-Agent': userAgentDefault,
        Accept: 'text/html,application/json,application/protobuf',
        // Referer: 'https://www.tiktok.com/',
        // Origin: 'https://www.tiktok.com',
        // 'Accept-Language': 'en-US,en;q=0.9',
        // 'Accept-Encoding': 'gzip, deflate',
        cookie: cookie_string
      },
        proxy,
        preCheckRetry: (body, json)=>{
            return !body.includes('uniqueId":');
  
        },
        // proxy_list: proxies
    }
    let res = await helper.makeRequest(options)
    // console.log(res.bodyJson.userInfo.user)
    try{
      let {avatarThumb,nickname:roomUsername} = (res.bodyJson.userInfo.user) || {};
      let status_code = res.bodyJson.status_code
      // console.log(status_code,json)
      return { avatarThumb,roomUsername,status_code,err: false }
    }catch(e){
      console.log(e)
      return { avatarThumb: '', roomUsername: '', status_code: 0, err: true }
    }
    
  },
  getAccountInfo: async function ({cookie_string, proxy, proxy_list,username, link }) {
    let options = {
      url: link ?link : username ? `https://www.tiktok.com/@${username}` :"https://www.tiktok.com",
      proxy,
      isRetry: true, 
      retryTime: 1,
      proxy_list,
      headers: {
        cookie: cookie_string,
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
        'authority': 'www.tiktok.com',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'en-US,en;q=0.9,it-IT;q=0.8,it;q=0.7,ko;q=0.6,ja;q=0.5,zh;q=0.4,vi;q=0.3,vi-VN;q=0.2,zh-HK;q=0.1',
        'cache-control': 'no-cache',
        'dnt': '1',
        'pragma': 'no-cache',
        'sec-ch-ua': '"Chromium";v="116", "Not)A;Brand";v="24", "Google Chrome";v="116"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
      }
     }
     let result = await helper.makeRequest(options)
     let { body, bodyJson, status, headers, error} = result;
     body = body || ""
     if(username) {
      let account_info = helper.getString((body || ""), `{"userInfo":`, `}`);
      let uid = helper.getString((account_info || ""), `id":"`, `"`);
      let sec_id = helper.getString((account_info || ""), `secUid":"`, `"`);
      let device_id = helper.getString((body || ""), "wid\":\"", `"`);
      let csrf_token = helper.getString((body || ""), `"csrfToken":"`, `","`);
      let webIdCreatedTime = helper.getString((body || ""), `"webIdCreatedTime":"`, `","`);
      
      return {account_info, uid, sec_id, device_id, csrf_token,webIdCreatedTime, error, is_alive: body.includes(`Following accounts</h2`)  }
    } else {
      if(body.includes(`Following accounts</h2`)) {
        let webIdCreatedTime = helper.getString((body || ""), `"webIdCreatedTime":"`, `","`);
        let device_id = helper.getString((body || ""), "wid\":\"", `"`);
        let uid = helper.getString((body || ""), "uid\":\"", `"`);
        return {is_alive: true, device_id, uid, webIdCreatedTime, error, cookie_string}
      } else {
        let webIdCreatedTime = helper.getString((body || ""), `"webIdCreatedTime":"`, `","`);
        let device_id = helper.getString((body || ""), "wid\":\"", `"`);
        let uid = helper.getString((body || ""), "uid\":\"", `"`);
        return { is_alive: false, error,cookie_string,  device_id, uid, webIdCreatedTime,}
      }

    }
  },
  getVideoInfo: async function ({cookie_string, proxy,link, aweme_id, proxy_list }) {
     let options = {
      url: link ? link : aweme_id? `https://www.tiktok.com/@/video/${aweme_id}`: ``,
      proxy,
      proxy_list,
      headers: {
        cookie: cookie_string,
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
        'authority': 'www.tiktok.com',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'en-US,en;q=0.9,it-IT;q=0.8,it;q=0.7,ko;q=0.6,ja;q=0.5,zh;q=0.4,vi;q=0.3,vi-VN;q=0.2,zh-HK;q=0.1',
        'cache-control': 'no-cache',
        'dnt': '1',
        'pragma': 'no-cache',
        'sec-ch-ua': '"Chromium";v="116", "Not)A;Brand";v="24", "Google Chrome";v="116"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
      }
     }
     let result = await helper.makeRequest(options)
     let { body, bodyJson, status, error} = result
     let video_info = helper.getString((body || ""), `"ItemModule":`, `}}}</script>`);
     if(!video_info)
      video_info = helper.getString((body || ""), `"itemStruct":`, `}}}</script>`);

     let like_count = helper.getString((body || ""), `"diggCount":`, `,"`);
     return {video_info, like_count, error }
  },
  getMstoken:async function ({cookie_string, proxy, retryCount }) {
    let retry = retryCount || 0;
    let head = await  new Promise(r => {
      const options = {
        url: "https://www.tiktok.com/api/ba/business/suite/permission/list/?aid=1988&app_language=vi-VN&app_name=tiktok_web&browser_language=vi-VN&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F116.0.0.0%20Safari%2F537.36&channel=tiktok_web&cookie_enabled=true&device_id=7270945183717885441&device_platform=web_pc&focus_state=true&from_page=fyp&history_len=2&is_fullscreen=false&is_page_visible=true&os=mac&permissionList=001004%2C001005&priority_region=&referer=&region=VN&screen_height=900&screen_width=1440&tz_name=Asia%2FSaigon&webcast_language=vi-VN",
        method: 'GET',
        headers: {
          cookie: cookie_string || "",
        }
      }
      if (proxy) {
        let proxystr = ""
        if( typeof proxy == "string") {
          proxystr = proxy
        } else {
          let { protocol, host, port, username, password } = proxy;
          proxystr = `${protocol || "http"}://${username && password ? `${username}:${password}@` : ''}${host}:${port}`
        }
        options.proxy = proxystr

      
      }

      request(options,(error, response, body) => {
          return  r({error, body, headers: response.headers, status: response.statusCode })
      })
    })
    if(head.error ) {
      if(retry< 3){
        retry++
        return await helper.getMstoken({cookie_string, proxy, retryCount: retry})
      } else {
        return {x_ms_token:"" , cookies: []}

      }
    }
    let headers = head.headers;
    let x_ms_token = headers["x-ms-token"];
    let cookies = headers["set-cookie"];
    return {x_ms_token, cookies}

  },
  getCsrfData:async function ({cookie_string, proxy, type }) {
    const options = {
      url: type =="update" ?"https://www.tiktok.com/api/update/profile": "https://www.tiktok.com/api/commit/follow/user/",
      method: 'HEAD',
      headers: {
        cookie: cookie_string || "",
        "X-Secsdk-Csrf-Request" :"1",
        "X-Secsdk-Csrf-Version":  "1.2.13",
      },
      isGetBody: false,
      proxy,
      retryTime: 3
    }

    let head = await helper.makeRequest(options)

    let headers = head.headers  || {};
    let tokenstring = headers["x-ware-csrf-token"];
    let x_csrf_token = helper.getString(tokenstring,",","," )
    let cookies = headers["set-cookie"];
    let csrf_session_id = helper.getString(cookies[0],"csrf_session_id=",";");
    
    return {csrf_session_id , x_csrf_token}

  },
  getRoomUser:  async function({room_id, proxy, cookie_string, retryCount}){
    if (!room_id) {
      return { is_alive: false, room_id: false, err: true };
    }

    let retry = retryCount || 0;
    
    return await new Promise((r) => {
      // Khởi tạo lệnh curl với URL
      let random_de = helper.getRandomInt(187248723442, 934782374123);
      let device_id = "7284943" + random_de;
      let random_an = helper.getRandomInt(187248723442, 934782374123);
      let anchor_id = "7171925" + random_de;
      let curlCommand = `curl "https://webcast.tiktok.com/webcast/ranklist/online_audience/?aid=1988&anchor_id=7375343667404833810&app_language=en&app_name=tiktok_web&browser_language=en-US&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F133.0.0.0%20Safari%2F537.36&channel=tiktok_web&cookie_enabled=true&data_collection_enabled=true&device_id=7484543802662487553&device_platform=web_pc&focus_state=true&from_page=user&history_len=6&is_fullscreen=false&is_page_visible=true&os=mac&priority_region=&referer=&region=VN&room_id=7486712098026687252&screen_height=1117&screen_width=1728&tz_name=Asia%2FSaigon&user_is_login=true&verifyFp=verify_lzzndjml_geR45jSd_PKon_4Ykv_Bc0M_n040N3GAU9Nc&webcast_language=en&msToken=CKrxaWHMhir7jUHOpfIOVE-rfAegd1faHpnGwMeBz8lA5AXuoKROyS4rWpGi3UsECx__26WYhjAWJibjRhO5tHS7ucwvYB1u224WHl74S6V-HHegAQ8xIFiCCtIxpmNLrINl352gS1CJHB7i6LSOWL_F&X-Bogus=DFSzswVu0j2ANrk0thBO4jLNKBOE&_signature=_02B4Z6wo000011Y2lYgAAIDABMm1kkAHWy9WNpEAALJ2f3"`;
      curlCommand = `curl "https://webcast.tiktok.com/webcast/ranklist/online_audience/?aid=1988&anchor_id=${anchor_id}&app_language=en&app_name=tiktok_web&browser_language=en-US&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F133.0.0.0%20Safari%2F537.36&channel=tiktok_web&cookie_enabled=true&data_collection_enabled=true&device_id=${device_id}&device_platform=web_pc&focus_state=true&from_page=user&history_len=2&is_fullscreen=false&is_page_visible=true&os=mac&priority_region=&referer=&region=VN&room_id=${room_id}&screen_height=1117&screen_width=1728&tz_name=Asia%2FSaigon&user_is_login=true&verifyFp=&webcast_language=en&msToken=&X-Bogus=&_signature="`

      // Thêm headers cho cookies và User-Agent
      curlCommand += ` -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36" -H "cookie: ${cookie_string}"`;

      // Thêm proxy nếu có
      if (proxy) {
        let proxystr = "";
        if (typeof proxy === "string") {
          proxystr = proxy;
        } else {
          let { protocol, host, port, username, password } = proxy;
          proxystr = `${protocol || "http"}://${username && password ? `${username}:${password}@` : ''}${host}:${port}`;
        }
        curlCommand += ` -x ${proxystr}`;
      }

      // Kiểm tra hệ điều hành để thay đổi cách gọi curl
      const platform = os.platform();
      if (platform === 'win32') {
        // Windows: sửa lệnh curl cho Windows
        curlCommand = curlCommand.replace(/'/g, '"');
      }

      // Chạy lệnh curl
      exec(curlCommand, async (error, stdout, stderr) => {
        if (error) {
          if (retry < 3) {
            retry++;
            return r(await helper.getRoomUser({ room_id, proxy, cookie_string, retryCount: retry }));
          } else {
            return r({ data_user: [], room_id: room_id, err: true, error });
          }
        }

        let json = { stats: {} };
        try {
          json = JSON.parse(stdout);
          // console.log(stdout)
          // console.log(stdout,curlCommand)
          // let { stats, user_count, status, owner, title } = json.data;
          let data_user = [];
          try{
            data_user = json?.data?.ranks?.map(function(a){
              return a?.user?.display_id
            })
          }catch(e){}
          let total_user = json?.data?.total || 0;
          let status_code = json.status_code;
          return r({
            data_user: data_user,
            room_id: room_id,
            err: false,
            total_user: total_user,
            status_code: status_code,
          });
        } catch (e) {
          return r({ data_user: [], room_id: room_id, err: true, error: e });
        }
      });
    });
  },
  checkCookieLive: async function({username,cookie_string, proxy, proxy_list}) {
    const options = {
      retryTime: 3,

      url: `https://www.tiktok.com/passport/web/account/info/?WebIdLastTime=1742631163&aid=1459&app_language=en&app_name=tiktok_web&browser_language=en-US&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F134.0.0.0%20Safari%2F537.36&channel=tiktok_web&cookie_enabled=true&data_collection_enabled=true&device_id=&device_platform=web_pc&focus_state=true&from_page=user&history_len=5&is_fullscreen=false&is_page_visible=true&odinId=&os=mac&priority_region=VN&referer=https%3A%2F%2Fwww.tiktok.com%2Flive&region=VN&root_referer=https%3A%2F%2Fwww.tiktok.com%2Flive&screen_height=1117&screen_width=1728&tz_name=Asia%2FSaigon&user_is_login=true&verifyFp=verify_lzzndjml_geR45jSd_PKon_4Ykv_Bc0M_n040N3GAU9Nc&webcast_language=en`,
      method: 'GET',
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
        cookie: cookie_string
      },
        proxy,
        preCheckRetry: (body, json)=>{
            return !body.includes(username);

        },
        proxy_list: proxy_list
    }
    let res = await helper.makeRequest(options)
    let { body, bodyJson, status, headers, error} = res;
    if(!body) {
      return {status:false}
    }else if(body.includes(username)) {
      return {status:true, live:true,body}
    }else if(body.includes("session_expired")) {
      // console.log(username,body, proxy, cookie_string)
      return {status:true, live:false, body}
    }
  },
  getRoomInfo: async function ({ room_id, name, proxy, cookie_string, retryCount }) {
  if (!room_id) {
    room_id = await helper.getRoomId({ name, proxy });
  }

  if (!room_id) {
    return { is_alive: false, room_id: false, err: true };
  }

  let retry = retryCount || 0;
  
  return await new Promise((r) => {
    // Khởi tạo lệnh curl với URL
    let curlCommand = `curl "https://webcast.tiktok.com/webcast/room/info/?aid=1988&app_language=en-US&app_name=tiktok_web&browser_language=en&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F116.0.0.0%20Safari%2F537.36&cookie_enabled=true&cursor=&internal_ext=&device_platform=web&focus_state=true&from_page=user&history_len=4&is_fullscreen=false&is_page_visible=true&did_rule=3&fetch_rule=1&last_rtt=0&live_id=12&resp_content_type=protobuf&screen_height=1152&screen_width=2048&tz_name=Europe%2FBerlin&referer=https%3A%2F%2Fwww.tiktok.com%2F&root_referer=https%3A%2F%2Fwww.tiktok.com%2F&version_code=180800&webcast_sdk_version=1.3.0&update_version_code=1.3.0&room_id=${room_id}"`;

    // Thêm headers cho cookies và User-Agent
    curlCommand += ` -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36" -H "cookie: ${cookie_string}"`;

    // Thêm proxy nếu có
    if (proxy) {
      let proxystr = "";
      if (typeof proxy === "string") {
        proxystr = proxy;
      } else {
        let { protocol, host, port, username, password } = proxy;
        proxystr = `${protocol || "http"}://${username && password ? `${username}:${password}@` : ''}${host}:${port}`;
      }
      curlCommand += ` -x ${proxystr}`;
    }

    // Kiểm tra hệ điều hành để thay đổi cách gọi curl
    const platform = os.platform();
    if (platform === 'win32') {
      // Windows: sửa lệnh curl cho Windows
      curlCommand = curlCommand.replace(/'/g, '"');
    }

    // Chạy lệnh curl
    exec(curlCommand, async (error, stdout, stderr) => {
      if (error) {
        if (retry < 3) {
          retry++;
          return r(await helper.getRoomInfo({ name, proxy, retryCount: retry }));
        } else {
          return r({ is_alive: true, room_id: room_id, err: true, error });
        }
      }

      let json = { stats: {} };
      try {
        // console.log(stdout)
        json = JSON.parse(stdout);

        let { stats, user_count, status, owner, title } = json.data;
        let status_code = json.status_code;
        return r({
          is_alive: status !== 4 ? true : false,
          view_count: user_count,
          room_id: status !== 4 ? stats?.id_str : 0,
          display_id: owner ? owner?.display_id : '',
          bio_description: owner ? owner?.bio_description : '',
          nickname: owner ? owner?.nickname : '',
          title: title,
          err: false,
          status_code: status_code,
          data: json.data
        });
      } catch (e) {
        return r({ is_alive: true, room_id: room_id, err: true, error: e });
      }
    });
  });
},
  getRoomInfo_old :async function ({room_id, proxies, name, proxy, cookie_string, retryCount}){
    const options = {
      retryTime: 3,

      url: `https://webcast.tiktok.com/webcast/room/info/?aid=1988&app_language=en-US&app_name=tiktok_web&browser_language=en&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F116.0.0.0%20Safari%2F537.36&cookie_enabled=true&cursor=&internal_ext=&device_platform=web&focus_state=true&from_page=user&history_len=4&is_fullscreen=false&is_page_visible=true&did_rule=3&fetch_rule=1&last_rtt=0&live_id=12&resp_content_type=protobuf&screen_height=1152&screen_width=2048&tz_name=Europe%2FBerlin&referer=https%3A%2F%2Fwww.tiktok.com%2F&root_referer=https%3A%2F%2Fwww.tiktok.com%2F&version_code=180800&webcast_sdk_version=1.3.0&update_version_code=1.3.0&room_id=${room_id}`,
      method: 'GET',
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
        cookie: cookie_string
      },
        proxy,
        preCheckRetry: (body, json)=>{
            return !body.includes('user_count":');

        },
        proxy_list: proxies
    }
    let res = await helper.makeRequest(options)
    let { stats, user_count, status,owner,title } = (res.bodyJson.data) || {};
    let status_code = res.status_code
    // console.log(status_code,json)
    return { is_alive: status && status !== 4 ? true : false, view_count: user_count, room_id: status !== 4 ? stats?.id_str : 0, display_id: owner? owner?.display_id : '', bio_description: owner? owner?.bio_description : '', nickname: owner? owner?.nickname : '', title: title, err: false,status_code: status_code }
},
getRoomInfo3 :async function ({room_id, proxies, name, proxy, cookie_string, retryCount}){
  const options = {
    retryTime: 3,

    url: `https://webcast.tiktok.com/webcast/room/info/?aid=1988&app_language=en-US&app_name=tiktok_web&browser_language=en&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F116.0.0.0%20Safari%2F537.36&cookie_enabled=true&cursor=&internal_ext=&device_platform=web&focus_state=true&from_page=user&history_len=4&is_fullscreen=false&is_page_visible=true&did_rule=3&fetch_rule=1&last_rtt=0&live_id=12&resp_content_type=protobuf&screen_height=1152&screen_width=2048&tz_name=Europe%2FBerlin&referer=https%3A%2F%2Fwww.tiktok.com%2F&root_referer=https%3A%2F%2Fwww.tiktok.com%2F&version_code=180800&webcast_sdk_version=1.3.0&update_version_code=1.3.0&room_id=${room_id}`,
    method: 'GET',
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
      cookie: cookie_string
    },
      proxy,
      preCheckRetry: (body, json)=>{
          return !body.includes('user_count":');

      },
      proxy_list: proxies
  }
  let res = await helper.makeRequest(options)
  console.log(res)
  let { stats, user_count, status,owner,title } = (res.bodyJson.data) || {};
  let status_code = res.status_code
  // console.log(status_code,json)
  return { is_alive: status && status !== 4 ? true : false, view_count: user_count, room_id: status !== 4 ? stats?.id_str : 0, display_id: owner? owner?.display_id : '', bio_description: owner? owner?.bio_description : '', nickname: owner? owner?.nickname : '', title: title, err: false,status_code: status_code }
},
getRoomInfo4 :async function ({room_id, proxies, name, proxy, cookie_string, retryCount}){
  const options = {
    retryTime: 3,

    url: `https://webcast.tiktok.com/webcast/room/info/?aid=1988&app_language=en-US&app_name=tiktok_web&browser_language=en&browser_name=Mozilla&browser_online=true&browser_platform=Win32&browser_version=5.0+%28Windows+NT+10.0%3B+Win64%3B+x64%29+AppleWebKit%2F537.36+%28KHTML%2C+like+Gecko%29+Chrome%2F106.0.0.0+Safari%2F537.36&cookie_enabled=true&cursor=&internal_ext=&device_platform=web&focus_state=true&from_page=user&history_len=0&is_fullscreen=false&is_page_visible=true&did_rule=3&fetch_rule=1&last_rtt=0&live_id=12&resp_content_type=protobuf&screen_height=1152&screen_width=2048&tz_name=Europe%2FBerlin&referer=https%3A%2F%2Fwww.tiktok.com%2F&root_referer=https%3A%2F%2Fwww.tiktok.com%2F&host=https%3A%2F%2Fwebcast.tiktok.com&webcast_sdk_version=1.3.0&update_version_code=1.3.0&room_id=${room_id}`,
    method: 'GET',
    headers: {
      Connection: 'keep-alive',
      'Cache-Control': 'max-age=0',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36',
      Accept: 'text/html,application/json,application/protobuf',
      Referer: 'https://www.tiktok.com/',
      Origin: 'https://www.tiktok.com',
      // 'Accept-Language': 'en-US,en;q=0.9',
      // 'Accept-Encoding': 'gzip, deflate',
      cookie: cookie_string
    },
      proxy,
      preCheckRetry: (body, json)=>{
          return !body.includes('user_count":');

      },
      proxy_list: proxies
  }
  let res = await helper.makeRequest(options)
  console.log(res.body)
  let { stats, user_count, status,owner,title } = (res.bodyJson.data) || {};
  let status_code = res.status_code
  // console.log(status_code,json)
  return { is_alive: status && status !== 4 ? true : false, view_count: user_count, room_id: status !== 4 ? stats?.id_str : 0, display_id: owner? owner?.display_id : '', bio_description: owner? owner?.bio_description : '', nickname: owner? owner?.nickname : '', title: title, err: false,status_code: status_code,avatarThumb: owner? owner?.avatar_thumb?.url_list[0] : '' }
},
getRoomInfo2 :async function ({room_id, name, proxy, cookie_string, retryCount}){
      if(!room_id){
        room_id = await helper.getRoomId({name, proxy});

      }
      // console.log('room_id', room_id)
    if(!room_id){
      return ({ is_alive: false, room_id: false, err:true })
    }
    let retry = retryCount || 0;
    return await new Promise(r => {
      const options = {
        url: `https://webcast.tiktok.com/webcast/room/info/?aid=1988&app_language=en-US&app_name=tiktok_web&browser_language=en&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F116.0.0.0%20Safari%2F537.36&cookie_enabled=true&cursor=&internal_ext=&device_platform=web&focus_state=true&from_page=user&history_len=4&is_fullscreen=false&is_page_visible=true&did_rule=3&fetch_rule=1&last_rtt=0&live_id=12&resp_content_type=protobuf&screen_height=1152&screen_width=2048&tz_name=Europe%2FBerlin&referer=https%3A%2F%2Fwww.tiktok.com%2F&root_referer=https%3A%2F%2Fwww.tiktok.com%2F&version_code=180800&webcast_sdk_version=1.3.0&update_version_code=1.3.0&room_id=${room_id}`,
        method: 'GET',
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
          cookie: cookie_string
        }
      }
      if (proxy) {
        let proxystr = ""
        if( typeof proxy == "string") {
          proxystr = proxy
        } else {
          let { protocol, host, port, username, password } = proxy;
          proxystr = `${protocol || "http"}://${username && password ? `${username}:${password}@` : ''}${host}:${port}`
        }
        options.proxy = proxystr

      
      }
      request(options, async(error, response, body) => {
        if(error) {
          if(retry< 3){
            retry++
            return r(await helper.getRoomInfo2({name, proxy, retryCount: retry}))
          } else {
            return r({ is_alive: true, room_id: room_id,err:true, error })

          }
        }
        let json = {stats: {}};
        try {
          json= JSON.parse(body)

          let { stats, user_count, status,owner,title } = json.data;
          let status_code = json.status_code
        return r({ is_alive: status !== 4 ? true : false, view_count: user_count, room_id: status !== 4 ? stats?.id_str : 0, display_id: owner? owner?.display_id : '', bio_description: owner? owner?.bio_description : '', nickname: owner? owner?.nickname : '', title: title, err: false ,status_code: status_code})
        } catch(e){
          return r({ is_alive: true, room_id: room_id,err:true, error: e})
        }
        // console.log(json)
      })
    })
  },
  getRoomInfo1 :async function ({room_id, name, proxy, cookie_string, retryCount}){
      if(!room_id){
        room_id = await helper.getRoomId({name, proxy});

      }
      // console.log('room_id', room_id)
    if(!room_id){
      return ({ is_alive: false, room_id: false, err:true })
    }
    let retry = retryCount || 0;
    return await new Promise(r => {
      const options = {
        url: `https://webcast.tiktok.com/webcast/room/info/?aid=1988&app_language=en-US&app_name=tiktok_web&browser_language=en&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F116.0.0.0%20Safari%2F537.36&cookie_enabled=true&cursor=&internal_ext=&device_platform=web&focus_state=true&from_page=user&history_len=4&is_fullscreen=false&is_page_visible=true&did_rule=3&fetch_rule=1&last_rtt=0&live_id=12&resp_content_type=protobuf&screen_height=1152&screen_width=2048&tz_name=Europe%2FBerlin&referer=https%3A%2F%2Fwww.tiktok.com%2F&root_referer=https%3A%2F%2Fwww.tiktok.com%2F&version_code=180800&webcast_sdk_version=1.3.0&update_version_code=1.3.0&room_id=${room_id}`,
        method: 'GET',
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
          cookie: cookie_string
        }
      }
      if (proxy) {
        let proxystr = ""
        if( typeof proxy == "string") {
          proxystr = proxy
        } else {
          let { protocol, host, port, username, password } = proxy;
          proxystr = `${protocol || "http"}://${username && password ? `${username}:${password}@` : ''}${host}:${port}`
        }
        options.proxy = proxystr

      
      }
      request(options, async(error, response, body) => {
        if(error) {
          if(retry< 3){
            retry++
            return r(await helper.getRoomInfo({room_id, name, proxy, cookie_string, retryCount: retry}))
          } else {
            return r({ is_alive: true, room_id: room_id,err:true, error })

          }
        }
        let json = {stats: {}};
        try {
          json= JSON.parse(body)
        } catch(e){}
        // console.log(json)
        // console.log(JSON.stringify(json))
        let { stats, user_count, status,owner,title } = json.data;
        let status_code = json.status_code
        // console.log(status_code,json)
        return r({ is_alive: status && status !== 4 ? true : false, view_count: user_count, room_id: status !== 4 ? stats?.id_str : 0, display_id: owner? owner?.display_id : '', bio_description: owner? owner?.bio_description : '', nickname: owner? owner?.nickname : '', title: title, err: false,status_code: status_code })
      })
    })
  },
  getProxyX(){
    // if(proxy_root.length > 0){
    //     return (proxy_root[Math.floor((Math.random() * proxy_root.length))]).trim();
    // }else{
    //     return '';
    // }
      // return 'http://bupmat.ddns.net:45403';
      var domain = 'http://xproxysever15.hopto.org:';
    //var domain = 'http://171.240.246.161:';
    var port_start = 4000;
    var port1 = Math.floor(Math.random() * 3) + 1;
    var port2 = Math.floor(Math.random() * 5) + 0;
    //return domain+(port_start+port2*100+port1)
      var domain = 'http://bupview.ddns.net:';
    var port_start = 5000;
    var port1 = Math.floor(Math.random() * 10) + 1;
    var port2 = Math.floor(Math.random() * 0) + 0;
    //return domain+(port_start+port2*100+port1)
      
    var domain = 'http://bupmat.ddns.net:';
    //var domain = 'http://171.240.246.161:';
    var port_start = 4000;
    var port1 = Math.floor(Math.random() * 10) + 1;
    var port2 = Math.floor(Math.random() * 5) + 0;
    return domain+(port_start+port2*100+port1)
  },
  splice(array, max) {
    var splitCookies = [].concat.apply([],
      array.map(function (elem, i) {
        return i % max ? [] : [array.slice(i, i + max)];
      })
    );
    return splitCookies
  },
  getProxyShopTM: async function (tk){
    var tm_proxy = (await helper.getTmProxy(tk)).split(':');
    if(tm_proxy.length == 2){
      var tm_proxy_json = {'protocol':'http','host': tm_proxy[0],'port': tm_proxy[1]}
    }else{
      var tm_proxy_json = false
    }
    return tm_proxy_json;
    // async function getNewPorxy(tk) {
    //   return (false)
    //   setTimeout(function(){
    //     SoneLoginMain.postJsonRequestForce(0, 2, `https://tmproxy.com/api/proxy/get-new-proxy`,{

    // "api_key": tk,
    // "id_location": 1

    //     }, function(data){
    //       // try{
    //       //  data = JSON.parse(data)
    //       // }catch(e){}
    //       // if(data.data && data.data.proxy){
    //       //  callbackGet(data.data.proxy)
    //       // }else{
    //       //  callbackGet(false)
    //       // }
    //       console.log(data)
    //       // callbackGet(false)
    //     })
    //   },(id*500*1))
      
    // }
    
  },
  getTmProxy: async function(tk) {
    return new Promise(r => {
      var headers = {
            'User-Agent': '',
            'Cookie': '',
            'Content-Type': 'application/json',
            // sec-fetch-dest: empty
            // sec-fetch-mode: cors
            'sec-fetch-site': 'same-origin',
            'Authorization': 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6IjkxZDhkZWQ3LWIzNzctNDgzNi1iYzI4LWY5NzJjM2ZkMjZmYyIsImV4cCI6MTY4MDM5NjU5NCwiaWF0IjoxNjgwMzUzMzk0LCJpc3MiOiJ0bS1wcm94eS5jb20iLCJuYmYiOjE2ODAzNTMzOTR9.jZtsyuNN1ySnfx13TDmXcKlPNuFwqtCcGxe-mGcU7HopLdEKY99-cZJke7t5-5-lPI2FxaEohEuSiGEz4hRDqVp91Q6iiui8ktCsaa1cw1jWqPjyNTCAoiObbfLHrm8u66Uwzc19R8cNrcJHjVuODox2C__AxAGElS1YOVONHYIXPciqeryZ-X1l7HPwbR3GNgmoCPeVTS6uGKJMLQWbn0WGdC6AXNWrygYhoNkqNkP5iSPJnbky1lswiOQ-hYGKRWHtERpI-zcaGDu9QS8AJjxKHDZSo0ixjixSoBpFiejRoDcxatWf4wmAGAKwxVut8kJVVluyEKNkL5KMZxlqIOR0VbgQIukCYsqXTxnBAXo30oB08Z8TcJ_FZDgHtcisRSDhPKjJBqesKN8GqE8JclUnGchny4VUk4TOWzEwDHxUYvyPEgzC3UOfNv6vbz2Bsfq4_IPpXrjSn-ClYzbl1LgTykB1qs4Xx3q1UagKGzbJyxzRwYJNi1eWypAv6ODXaKiDVQlRQtSvqh3XC8U-ofQkhAb6ra-b1EtS8S6ZjSLGITrbLq4_H1xPJMx9FrxIilBMcCOFQpkG2T4Qx5kiN4AYQdmSqEhcKXaOs6tlChyeCkHgpgpvT8FoJ_kumTfzPm6k3QIdpkW3Af1_kCf2hcT_-VhwJNVjuOdkUa4uqwk',
        };
        request.post({
            headers: headers,
            url: `https://tmproxy.com/api/proxy/get-current-proxy`,
            // formData: field,
            json: {"api_key": tk},
        }, function(error, response, data){
          if(data.data && data.data.https){
            return r(data.data.https)
          }else{
            return r('')
          }
        })
    })
  },
  getTmProxyNew: async function(tk) {
    return new Promise(r => {
      var headers = {
            'User-Agent': '',
            'Cookie': '',
            'Content-Type': 'application/json',
            // sec-fetch-dest: empty
            // sec-fetch-mode: cors
            'sec-fetch-site': 'same-origin',
            'Authorization': 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6IjkxZDhkZWQ3LWIzNzctNDgzNi1iYzI4LWY5NzJjM2ZkMjZmYyIsImV4cCI6MTY4MDM5NjU5NCwiaWF0IjoxNjgwMzUzMzk0LCJpc3MiOiJ0bS1wcm94eS5jb20iLCJuYmYiOjE2ODAzNTMzOTR9.jZtsyuNN1ySnfx13TDmXcKlPNuFwqtCcGxe-mGcU7HopLdEKY99-cZJke7t5-5-lPI2FxaEohEuSiGEz4hRDqVp91Q6iiui8ktCsaa1cw1jWqPjyNTCAoiObbfLHrm8u66Uwzc19R8cNrcJHjVuODox2C__AxAGElS1YOVONHYIXPciqeryZ-X1l7HPwbR3GNgmoCPeVTS6uGKJMLQWbn0WGdC6AXNWrygYhoNkqNkP5iSPJnbky1lswiOQ-hYGKRWHtERpI-zcaGDu9QS8AJjxKHDZSo0ixjixSoBpFiejRoDcxatWf4wmAGAKwxVut8kJVVluyEKNkL5KMZxlqIOR0VbgQIukCYsqXTxnBAXo30oB08Z8TcJ_FZDgHtcisRSDhPKjJBqesKN8GqE8JclUnGchny4VUk4TOWzEwDHxUYvyPEgzC3UOfNv6vbz2Bsfq4_IPpXrjSn-ClYzbl1LgTykB1qs4Xx3q1UagKGzbJyxzRwYJNi1eWypAv6ODXaKiDVQlRQtSvqh3XC8U-ofQkhAb6ra-b1EtS8S6ZjSLGITrbLq4_H1xPJMx9FrxIilBMcCOFQpkG2T4Qx5kiN4AYQdmSqEhcKXaOs6tlChyeCkHgpgpvT8FoJ_kumTfzPm6k3QIdpkW3Af1_kCf2hcT_-VhwJNVjuOdkUa4uqwk',
        };
        request.post({
            headers: headers,
            url: `https://tmproxy.com/api/proxy/get-new-proxy`,
            // formData: field,
            json: {"api_key": tk,"id_location": 5},
        }, function(error, response, data){
          console.log(data)
          return r(true)
        })
    })
  },
  clearCacheForFile(filePath){
    try{
      delete require.cache[path.resolve(filePath)];
    }catch(e){}
    
  },
  generateRandomHex(length) {
    let result = '';
    const characters = 'abcdef0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  },
  async getandcheckproxy(number){
    let list_proxy = []
    let promises = []
    let number_complete = 0
    for (var i = 0; i < number; i++) {
        promises.push(helper.getcheckproxy(i,0))
    }

    let result = await Promise.all(promises)
    return result
  },
  async getcheckproxy(id, max){
    let proxy = helper.getproxypy();
    if(max > 3){
      return proxy;
    }
    await helper.delay(id*10)
    let retry = 1
    let list = ["https://api.ipify.org?format=json",
    "https://api.myip.com",
    "https://api.seeip.org/jsonip",  
    // 'http://amazingcpanel.com/api/cron/myip?authensone=mysonetrend', 
    "https://jsonip.com"]
    let random =  (max, min)=> {
        return   Math.floor(Math.random() * (max - min) ) + min;
    }
    let link = list[random(list.length-1, 0)] || "https://jsonip.com"
    var url = link
    let options = {
        url: decodeURI(url),
        timeout: 10000,
        retryTime: 2,
        proxy
    }
    let result = await helper.makeRequest(options)
    try{
        if(result && result.bodyJson && result.bodyJson.ip){
            return proxy;
        }
    }catch(e){

    }
    max++
    return await helper.getcheckproxy(id, max);
  },
  getproxybyslpit(total, per_ip){
    let number = Math.floor(total/per_ip)+10;
    let list_proxy = [];
    for (var i = 0; i < number; i++) {
        list_proxy.push("http://amazing129-zone-adam-region-north_america-session-"+helper.generateRandomHex(12)+"-sessTime-120:Amazingcpanel129@pybpm-ins-ei89n3g0.pyproxy.io:2510")
    }
    return list_proxy;
  },
  getproxypy(){
    return "http://amazing129-zone-adam-region-north_america-session-"+helper.generateRandomHex(12)+"-sessTime-120:Amazingcpanel129@pybpm-ins-ei89n3g0.pyproxy.io:2510";
  },
  getAccountProxy: function(id){
    var file_cookie_content = fs.readFileSync(path.resolve("./data/_acc.txt"),
    { encoding: 'utf8', flag: 'r' });
    var file_cookie_content2 = fs.readFileSync(path.resolve("./data/_acc2.txt"),
    { encoding: 'utf8', flag: 'r' });
    file_cookie_content += '\n'+file_cookie_content2
    var file_proxy_content = fs.readFileSync(path.resolve("./data/_proxy2.txt"),
    { encoding: 'utf8', flag: 'r' });
    var acc_cookie = file_cookie_content.trim().split('\n');
    var proxy_key = file_proxy_content.trim().split('\n');
    var number_acc_per_line = 200;
    var number_acc_per_proxy = 3*number_acc_per_line;
    var number_id = id;
    var list_acc = [];
    var number_acc = 25;
    var max_account = acc_cookie.length
    // max_account = 20;
    for (var i = (number_id-1)*number_acc_per_line; i < (number_id)*number_acc_per_line && i < acc_cookie.length; i++) {
      var session_id = helper.getString(acc_cookie[i],'sessionid=',';')
      var device_id = helper.getString(acc_cookie[i],'multi_sids=','%')
      if(device_id == ''){
        device_id = helper.getString(acc_cookie[i],'install_id=',';')
      }

      if(device_id == ''){
        device_id = session_id;
      }
      var proxy_key_id = -1;
      proxy_key_id = Math.floor((number_id-1)*number_acc_per_line/number_acc_per_proxy);
      if(session_id != '' && proxy_key[proxy_key_id]){
        var proxy_details = proxy_key[proxy_key_id].split(':')
        var proxy_detail = [proxy_details[0],proxy_details[1],proxy_details[2],proxy_details[3]]
        if(proxy_details.length == 6){
          proxy_detail[2] = proxy_details[4]
          proxy_detail[3] = proxy_details[5]
        }
        list_acc.push({
              "array_cookie": [
                  {
                  "domain": ".tiktok.com",
                  "expirationDate": 1705293286.184521,
                  "hostOnly": false,
                  "httpOnly": true,
                  "name": "sessionid",
                  "path": "/",
                  "sameSite": "unspecified",
                  "secure": true,
                  "session": false,
                  "storeId": "0",
                  "value": session_id,
                  "id": 8
              }
                  ],
              "device_id": device_id,
              "name": `acc_${i+1}`,
              "proxy": {'protocol':'http','username' : proxy_detail[2],'password' : proxy_detail[3],'host': proxy_detail[0],'port': proxy_detail[1]},
              "proxy_key": "none"
            })
      }
    }
    return list_acc;
  },
  getAccountTMProxy: function(id){
    var file_cookie_content = fs.readFileSync(path.resolve("./data/_acc.txt"),
    { encoding: 'utf8', flag: 'r' });
    var acc_cookie = file_cookie_content.trim().split('\n');
    var proxy_key = `
    283a8646d84b2e80d9db19bd8126a69b
    78c0a2424880f1d3139c7d354f343c4e
    `.trim().split('\n');
    var number_acc_per_proxy = 800;
    var number_acc_per_line = 200;
    var number_id = 5;
    var list_acc = [];
    var number_acc = 25;
    var max_account = acc_cookie.length
    // max_account = 20;
    for (var i = (number_id-1)*number_acc_per_line; i < (number_id)*number_acc_per_line && i < acc_cookie.length; i++) {
      var session_id = helper.getString(acc_cookie[i],'sessionid=',';')
      var device_id = helper.getString(acc_cookie[i],'multi_sids=','%')
      if(device_id == ''){
        device_id = helper.getString(acc_cookie[i],'install_id=',';')
      }

      if(device_id == ''){
        device_id = session_id;
      }
      var proxy_key_id = -1;
      proxy_key_id = Math.floor((number_id-1)*number_acc_per_line/number_acc_per_proxy);
      // console.log(proxy_key[proxy_key_id])
      if(session_id != '' && proxy_key[proxy_key_id]){
        list_acc.push({
              "array_cookie": [
                  {
                  "domain": ".tiktok.com",
                  "expirationDate": 1705293286.184521,
                  "hostOnly": false,
                  "httpOnly": true,
                  "name": "sessionid",
                  "path": "/",
                  "sameSite": "unspecified",
                  "secure": true,
                  "session": false,
                  "storeId": "0",
                  "value": session_id,
                  "id": 8
              }
                  ],
              "device_id": device_id,
              "name": `acc_${i+1}`,
              "proxy": {'protocol':'http','username' : 'root','password' : 'nD?E7z6c','host': '102.102.102.102','port': '102'},
              "proxy_key": proxy_key[proxy_key_id]
            })
      }
    }
  },
  sendMessageTeleConfig: async function(config){
    var data_tele = {
      token: config.token,
      chat_id: config.chat_id,
      message: config.message,
    }
    var url = ('https://api.telegram.org/bot'+data_tele.token+'/sendMessage?chat_id='+data_tele.chat_id+'&text='+encodeURIComponent(data_tele.message))
    return new Promise(r => {
        request.get({
            url: url
        }, function(error, response, data){
          if(data){
            return r(data)
          }else{
            return r('')
          }
        })
    })  
  },
  sendMessageTele: async function(message){
    var data_tele = {
      token: '6631966433:AAGG5p7KX8JKusJPGsw2itg3Ano2xVrYzfU',
      chat_id: '@amactiktoklive',
      message: message,
    }
    var url = ('https://api.telegram.org/bot'+data_tele.token+'/sendMessage?chat_id='+data_tele.chat_id+'&text='+encodeURIComponent(data_tele.message))
    return new Promise(r => {
        request.get({
            url: url
        }, function(error, response, data){
          if(data){
            return r(data)
          }else{
            return r('')
          }
        })
    })  
  },
  sendMessageTele403: async function(message){
    var data_tele = {
      token: '6631966433:AAGG5p7KX8JKusJPGsw2itg3Ano2xVrYzfU',
      chat_id: '@amactiktoklive403',
      message: message,
    }
    var url = ('https://api.telegram.org/bot'+data_tele.token+'/sendMessage?chat_id='+data_tele.chat_id+'&text='+encodeURIComponent(data_tele.message))
    return new Promise(r => {
        request.get({
            url: url
        }, function(error, response, data){
          if(data){
            return r(data)
          }else{
            return r('')
          }
        })
    })  
  },
  sendMessageTeleDie: async function(message){
    var data_tele = {
      token: '6631966433:AAGG5p7KX8JKusJPGsw2itg3Ano2xVrYzfU',
      chat_id: '@amactiktokaccountdie',
      message: message,
    }
    var url = ('https://api.telegram.org/bot'+data_tele.token+'/sendMessage?chat_id='+data_tele.chat_id+'&text='+encodeURIComponent(data_tele.message))
    return new Promise(r => {
        request.get({
            url: url
        }, function(error, response, data){
          if(data){
            return r(data)
          }else{
            return r('')
          }
        })
    })  
  },
  getDataProxyCron: async function(server_ip){
    var url = `${'https://'+'tt1.'+'fbvideoview'+'.com/'+'api/'+'tiktok'+'/proxydata'}?server_ip=${server_ip}`
    return new Promise(r => {
        request.get({
            url: url
        }, function(error, response, data){
          return r(data)
        })
    })  
  },
  getDataCron: async function(server_ip, server_id = "tt1"){

    var url = `${'https://'+server_id+'.'+'fbvideoview'+'.com/'+'api/'+'tiktok'+'/cusdata'}?server_ip=${server_ip}`
    return new Promise(r => {
        request.get({
            url: url
        }, function(error, response, data){
          return r(data)
        })
    })  
  },
  getDataCron2: async function(proxy_string, status){
    var url = `${'https://'+'tt1.'+'fbvideoview'+'.com/'+'api/'+'tiktok'+'/setproxy'}?proxy_string=${proxy_string}&status=${status}`
    return new Promise(r => {
        request.get({
            url: url
        }, function(error, response, data){
          try{
            return r(JSON.parse(data))
          }catch(e){
            return r(false)
          }
          
        })
    })  
  },
  getDataSite: async function(server_ip){
    var url = `${'https://'+'tt1.'+'fbvideoview'+'.com/'+'api/'+'tiktok'+'/cusdata'}?server_ip=${server_ip}`
    return new Promise(r => {
        request.get({
            url: url
        }, function(error, response, data){
          if(data){
            try{
              data = JSON.parse(data);
            }catch(e){}
            var data_return = {
              proxy: data.proxy,
              cookie: []
            }
            if (fs.existsSync(path.resolve("./data/acc_die_sessionids.txt"))){
              var file_cookie_die_content = fs.readFileSync(
              path.resolve("./data/acc_die_sessionids.txt"),
                { encoding: 'utf8', flag: 'r' });
              var acc_cookie_die = file_cookie_die_content.trim().split('|');
            }else{
              var acc_cookie_die = [];
            }
            data.accounts.forEach(function(doc){
              // console.log(`${doc.facebook_id}|${doc.cookie}`)
              var sessionid = helper.getString(doc.cookie,'sessionid=',';');
              if(acc_cookie_die.indexOf(sessionid) == -1){
                data_return.cookie.push(doc.cookie)
              }
              
            })
            // console.log(data_return.cookie.length)
            // process.exit(1)
            return r(data_return)
          }else{
            return r(false)
          }
        })
    })  
  },
  changeProxyIp: async function(proxy){
    helper.clearCacheForFile(path.resolve("./data/key.js"))
    let key_data = require(path.resolve("./data/key.js"));
    let key = key_data[proxy.trim()];
    if(key){
      var url = `https://app.proxyno1.com/api/change-key-ip/${key}`;
      if(proxy.indexOf('proxyxoay.net') > -1){
        url = `https://proxyxoay.net/api/rotating-proxy/change-key-ip/${key}`;
      }
      return new Promise(r => {
        var headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15',
            'sec-fetch-site': 'same-origin',
            'Authorization': 'Bearer 1938|N1jYGbPNm4XyHnOtakG1gFbPHjF0Y62MSYrnV3Yy',
        };
        request.get({
            headers: headers,
            url: url,
        }, function(error, response, data){
          if(data){
            try{
              data = JSON.parse(data)
            }catch(e){
              data = false
            }
            console.log(key,data)
            return r(data)
            // callback(id, data)
          }else{
            console.log('ok',key,error)
            // callback(id, false)
            return r(false)
          }
        })
      })
    }else{
      return false
    }
  
  },
  changeIp: async function(id){
    var data = await helper.changeIpProcess(list_id[id_current]);
    if(data.indexOf('Đổi IP thành công') > -1 || data.indexOf('giây cho lần đổi ip tiếp theo.') > -1){
      console.log('success',id)
      return true;
      
    }else{
      console.log('failed',id)
      await helper.delay(5000)
      return await helper.changeIp(id);
    }
  },
  changeIpProcess: async function(id){
  return new Promise(r => {
      var config = helper.getDomainProxy();
    var cookie_string = request.cookie(config.cookie)
     var headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
            'Cookie': cookie_string,
            'sec-fetch-site': 'same-origin',
            'Authorization': config.Authorization,
        };
        request.post({
            headers: headers,
            url: `${config.url}/detail/${id}`,
            form: {"action":"createIP"}
        }, function(error, response, data){
          if(data){
            // console.log(data)
            return r(data)
          }else{
            console.log('error',error)
            return r(false)
          }
        })
    })
  },
  updateInfo: async function(id){
    var data = await helper.updateInfoProcess(list_id[id_current]);
    if(data.indexOf('Cập nhật thành công thông tin') > -1){
      console.log('success',id)
      return true;
      
    }else{
      console.log('failed',id)
      await helper.delay(5000)
      return await helper.updateInfo(id);
    }
  },
  updateInfoProcess: async function (id){
    return new Promise(r => {
      var config = helper.getDomainProxy();
      var cookie_string = request.cookie(config.cookie)
       var headers = {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
              'Cookie': cookie_string,
              'sec-fetch-site': 'same-origin',
              'Authorization': config.Authorization,
          };
          request.post({
              headers: headers,
              url: `${config.url}/detail/${id}`,
              form: {"action":"updateProxy"}
          }, function(error, response, data){
            if(data){
              // console.log(data)
              return r(data)
            }else{
              console.log('error',error)
              return r(false)
            }
          })
      })
  },
  getProxy: async function (id){
    return new Promise(r => {
      var config = helper.getDomainProxy();
      var cookie_string = request.cookie(config.cookie)
       var headers = {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
              'Cookie': cookie_string,
              'sec-fetch-site': 'same-origin',
              'Authorization': config.Authorization,
          };
          request.get({
              headers: headers,
              url: `${config.url}/detail/${id}`,
          }, function(error, response, data){
            if(data){
              var proxy_id = helper.getString(data, 'HTTP IPv4 Proxy:</span>','</span>');
              proxy_id = helper.getString(proxy_id+'<', '>','<').trim();
              return r(proxy_id+':'+id)
            }else{
              console.log('error',error)
              return r(false)
            }
          })
      })
  },
  getDomainProxy: function(){
    return {
      url: 'h'+'t'+'t'+'p'+'s'+':'+'/'+'/'+'a'+'p'+'p'+'.'+'p'+'r'+'o'+'x'+'y'+'d'+'a'+'n'+'c'+'u'+'.'+'c'+'o'+'m'+'/'+'p'+'r'+'o'+'x'+'y'+'/'+'residential/vietnam',
      Authorization: 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6IjkxZDhkZWQ3LWIzNzctNDgzNi1iYzI4LWY5NzJjM2ZkMjZmYyIsImV4cCI6MTY4MDM5NjU5NCwiaWF0IjoxNjgwMzUzMzk0LCJpc3MiOiJ0bS1wcm94eS5jb20iLCJuYmYiOjE2ODAzNTMzOTR9.jZtsyuNN1ySnfx13TDmXcKlPNuFwqtCcGxe-mGcU7HopLdEKY99-cZJke7t5-5-lPI2FxaEohEuSiGEz4hRDqVp91Q6iiui8ktCsaa1cw1jWqPjyNTCAoiObbfLHrm8u66Uwzc19R8cNrcJHjVuODox2C__AxAGElS1YOVONHYIXPciqeryZ-X1l7HPwbR3GNgmoCPeVTS6uGKJMLQWbn0WGdC6AXNWrygYhoNkqNkP5iSPJnbky1lswiOQ-hYGKRWHtERpI-zcaGDu9QS8AJjxKHDZSo0ixjixSoBpFiejRoDcxatWf4wmAGAKwxVut8kJVVluyEKNkL5KMZxlqIOR0VbgQIukCYsqXTxnBAXo30oB08Z8TcJ_FZDgHtcisRSDhPKjJBqesKN8GqE8JclUnGchny4VUk4TOWzEwDHxUYvyPEgzC3UOfNv6vbz2Bsfq4_IPpXrjSn-ClYzbl1LgTykB1qs4Xx3q1UagKGzbJyxzRwYJNi1eWypAv6ODXaKiDVQlRQtSvqh3XC8U-ofQkhAb6ra-b1EtS8S6ZjSLGITrbLq4_H1xPJMx9FrxIilBMcCOFQpkG2T4Qx5kiN4AYQdmSqEhcKXaOs6tlChyeCkHgpgpvT8FoJ_kumTfzPm6k3QIdpkW3Af1_kCf2hcT_-VhwJNVjuOdkUa4uqwk',
      cookie: 'auth=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NGQ1ZTA5NDY0ZDQ4NjRiMTQ2NDg3MDMiLCJpYXQiOjE2OTE3NTgxODIsImV4cCI6MjAwMDAxNjkxNzU4MTgyfQ.TptlUZz9y0KCBU5UFCingkUA3BOA2dKoPsYncgITGq8',

  };
  },
  getConFigCPUDefalt: function (){
    return {
        is_full: false,
        cpu_max: 83,
        time_max: 10,
        time_current: 0,
    }
  },
  getCpuUsage: function () {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }

    return {
      idle: totalIdle / cpus.length,
      total: totalTick / cpus.length
    };
  },

  calculateCpuUsage: function () {
    const startMeasure = helper.getCpuUsage();
    return new Promise((resolve) => {
      setTimeout(() => {
        const endMeasure = helper.getCpuUsage();

        const idleDifference = endMeasure.idle - startMeasure.idle;
        const totalDifference = endMeasure.total - startMeasure.total;

        const cpuUsage = 100 - (100 * idleDifference) / totalDifference;
        // resolve(cpuUsage.toFixed(2));
        resolve(parseInt(cpuUsage));
      }, 100);
    });
  },
  subArray :function(array, length){
    return [(helper.splice(array, length))[0], array.slice(length)]
  },
  parserCookieString: function (string){
 
    let array = [
      {
          "domain": ".tiktok.com",
          "hostOnly": false,
          "httpOnly": true,
          "name": "cmpl_token",
          "path": "/",
          "sameSite": "unspecified",
          "secure": true,
          "session": false,
          "storeId": "0",
          "value": "AgQQAPOFF-RO0rSNM89JeJ08_tTE3iYMf4UOYM4hxg",
          "id": 1
      },
      {
          "domain": ".tiktok.com",
          "hostOnly": false,
          "httpOnly": false,
          "name": "msToken",
          "path": "/",
          "sameSite": "no_restriction",
          "secure": true,
          "session": false,
          "storeId": "0",
          "value": "ZrmrlCOXaPIsJPAAgnhkyYPI54Kh0TAS0z7hTdDE2GuXp4rrxhCc94EKDE3oN0-QJu2tLAaeRdruxwas227-xiHxJJJJ-pCdV7v-3PTJ79S8h_QwwRztW1mFXZi7jnihubLIxKc=",
          "id": 2
      },
      {
          "domain": ".tiktok.com",
          "hostOnly": false,
          "httpOnly": true,
          "name": "odin_tt",
          "path": "/",
          "sameSite": "unspecified",
          "secure": false,
          "session": false,
          "storeId": "0",
          "value": "c0d19f2b161b916d6da355bd7f1f88145e123c17af81e155ae7478fe734de73c4e4c7f185119408308bb33245768d27f1e127553f07dc64b8aa60659376dfd954e376b1116cc77c861ba98e09101fe0d",
          "id": 3
      },
      {
          "domain": ".tiktok.com",
          "hostOnly": false,
          "httpOnly": true,
          "name": "passport_auth_status",
          "path": "/",
          "sameSite": "unspecified",
          "secure": false,
          "session": false,
          "storeId": "0",
          "value": "c769e1989f8a526be4320cc7d6150828%2C76c18c9ea61bc03228aebe967af7db83",
          "id": 4
      },
      {
          "domain": ".tiktok.com",
          "hostOnly": false,
          "httpOnly": true,
          "name": "passport_auth_status_ss",
          "path": "/",
          "sameSite": "no_restriction",
          "secure": true,
          "session": false,
          "storeId": "0",
          "value": "c769e1989f8a526be4320cc7d6150828%2C76c18c9ea61bc03228aebe967af7db83",
          "id": 5
      },
      {
          "domain": ".tiktok.com",
          "hostOnly": false,
          "httpOnly": false,
          "name": "passport_csrf_token",
          "path": "/",
          "sameSite": "no_restriction",
          "secure": true,
          "session": false,
          "storeId": "0",
          "value": "f6adbbf41da4349e1d95e0ff2361f78a",
          "id": 6
      },
      {
          "domain": ".tiktok.com",
          "hostOnly": false,
          "httpOnly": false,
          "name": "passport_csrf_token_default",
          "path": "/",
          "sameSite": "unspecified",
          "secure": false,
          "session": false,
          "storeId": "0",
          "value": "f6adbbf41da4349e1d95e0ff2361f78a",
          "id": 7
      },
      {
          "domain": ".tiktok.com",
          "hostOnly": false,
          "httpOnly": true,
          "name": "sessionid",
          "path": "/",
          "sameSite": "unspecified",
          "secure": true,
          "session": false,
          "storeId": "0",
          "value": "118adf4b4f42221cdf948dd6bcfa21b3",
          "id": 8
      },
      {
          "domain": ".tiktok.com",
          "hostOnly": false,
          "httpOnly": true,
          "name": "sessionid_ss",
          "path": "/",
          "sameSite": "no_restriction",
          "secure": true,
          "session": false,
          "storeId": "0",
          "value": "118adf4b4f42221cdf948dd6bcfa21b3",
          "id": 9
      },
      {
          "domain": ".tiktok.com",
          "hostOnly": false,
          "httpOnly": true,
          "name": "sid_guard",
          "path": "/",
          "sameSite": "unspecified",
          "secure": true,
          "session": false,
          "storeId": "0",
          "value": "118adf4b4f42221cdf948dd6bcfa21b3%7C1689741287%7C15551999%7CMon%2C+15-Jan-2024+04%3A34%3A46+GMT",
          "id": 10
      },
      {
          "domain": ".tiktok.com",
          "hostOnly": false,
          "httpOnly": true,
          "name": "sid_tt",
          "path": "/",
          "sameSite": "unspecified",
          "secure": true,
          "session": false,
          "storeId": "0",
          "value": "118adf4b4f42221cdf948dd6bcfa21b3",
          "id": 11
      },
      {
          "domain": ".tiktok.com",
          "hostOnly": false,
          "httpOnly": true,
          "name": "sid_ucp_v1",
          "path": "/",
          "sameSite": "unspecified",
          "secure": true,
          "session": false,
          "storeId": "0",
          "value": "1.0.0-KDc2ZjEyZGEwOTFhYzIwOTE0MjEyMjFiMDVjOTNmMDI5NDAxYTAyODQKHwiFiKmKjK332WQQ58_dpQYYswsgDDCMu8-lBjgIQBIQAxoGbWFsaXZhIiAxMThhZGY0YjRmNDIyMjFjZGY5NDhkZDZiY2ZhMjFiMw",
          "id": 12
      },
      {
          "domain": ".tiktok.com",
          "hostOnly": false,
          "httpOnly": true,
          "name": "ssid_ucp_v1",
          "path": "/",
          "sameSite": "no_restriction",
          "secure": true,
          "session": false,
          "storeId": "0",
          "value": "1.0.0-KDc2ZjEyZGEwOTFhYzIwOTE0MjEyMjFiMDVjOTNmMDI5NDAxYTAyODQKHwiFiKmKjK332WQQ58_dpQYYswsgDDCMu8-lBjgIQBIQAxoGbWFsaXZhIiAxMThhZGY0YjRmNDIyMjFjZGY5NDhkZDZiY2ZhMjFiMw",
          "id": 13
      },
      {
          "domain": ".tiktok.com",
          "hostOnly": false,
          "httpOnly": true,
          "name": "store-country-code",
          "path": "/",
          "sameSite": "unspecified",
          "secure": false,
          "session": false,
          "storeId": "0",
          "value": "vn",
          "id": 14
      },
      {
          "domain": ".tiktok.com",
          "hostOnly": false,
          "httpOnly": true,
          "name": "store-country-code-src",
          "path": "/",
          "sameSite": "unspecified",
          "secure": false,
          "session": false,
          "storeId": "0",
          "value": "uid",
          "id": 15
      },
      {
          "domain": ".tiktok.com",
          "hostOnly": false,
          "httpOnly": true,
          "name": "store-idc",
          "path": "/",
          "sameSite": "unspecified",
          "secure": false,
          "session": false,
          "storeId": "0",
          "value": "alisg",
          "id": 16
      },
      {
          "domain": ".tiktok.com",
          "hostOnly": false,
          "httpOnly": true,
          "name": "tt_chain_token",
          "path": "/",
          "sameSite": "unspecified",
          "secure": true,
          "session": false,
          "storeId": "0",
          "value": "Whz3fV/uffg2X3rFI2jDwA==",
          "id": 17
      },
      {
          "domain": ".tiktok.com",
          "hostOnly": false,
          "httpOnly": true,
          "name": "tt_csrf_token",
          "path": "/",
          "sameSite": "lax",
          "secure": true,
          "session": true,
          "storeId": "0",
          "value": "LcrwQjqk-fbeiBqQQm_yApX92ZX4znDxqhug",
          "id": 18
      },
      {
          "domain": ".tiktok.com",
          "hostOnly": false,
          "httpOnly": true,
          "name": "tt-target-idc",
          "path": "/",
          "sameSite": "unspecified",
          "secure": false,
          "session": false,
          "storeId": "0",
          "value": "alisg",
          "id": 19
      },
      {
          "domain": ".tiktok.com",
          "hostOnly": false,
          "httpOnly": true,
          "name": "tt-target-idc-sign",
          "path": "/",
          "sameSite": "unspecified",
          "secure": false,
          "session": false,
          "storeId": "0",
          "value": "WFpDkj4jovvU0oiahNJfMdjh2TGF15_K7cFJ4zM8cK0M3KYtkD6sE86i7_7LIb8G6R7tX3T-_1-xonpFwS5Q_wPk6f6xiPRXCaDsYEdrOkXrmKPiOXwqClUtXedo_r2V9sDmxiazAjH39J1E8X73xjPBnDNb1RZ1OEimlYv86BteD_FNGlHcf1Dku5BLy5jBReyMpoav7oRggBQLxV6_N-rKbHPDbX_2IMzaYm5Tf7w_woYDtvavO03G-0JkTL5xIthw9NE22hg6F-z2aI4m6pO-4P50rjaZO8T9bFr5WSIxMYRKpRYrQpceIZY-nNzxZyj9YVbozc_pPfdH1NuPBi7sHMM_P0TB4yU8rN7j1QjJ9KUPNARo8rETFH_8r3VayU7jlivdFxZDbDXWql6aVZheMYoYqKZYjpuaEdU-kciZJu0pwOQfgu2v7q1uAOnRMZEpG6KE0vGNFuxLEH4SBEw5wmXSSMMVW2nGlIWpOdyO0d8-rC_oM_V_rvhgFTn6",
          "id": 20
      },
      {
          "domain": ".tiktok.com",
          "hostOnly": false,
          "httpOnly": true,
          "name": "ttwid",
          "path": "/",
          "sameSite": "no_restriction",
          "secure": true,
          "session": false,
          "storeId": "0",
          "value": "1%7CcQahXXK1a5BOFLsJFF3vybReES7y-dREXvLhf4dFZ-0%7C1690858929%7C135da0f55ee0113f4ac2424c6d31a72953920a0845e9dec18009f2350c89738b",
          "id": 21
      },
      {
          "domain": ".tiktok.com",
          "hostOnly": false,
          "httpOnly": true,
          "name": "uid_tt",
          "path": "/",
          "sameSite": "unspecified",
          "secure": true,
          "session": false,
          "storeId": "0",
          "value": "6659faeffde75c6b04d5303ec7499115d60186fa016cc70a0769ea5d83c7caff",
          "id": 22
      },
      {
          "domain": ".tiktok.com",
          "hostOnly": false,
          "httpOnly": true,
          "name": "uid_tt_ss",
          "path": "/",
          "sameSite": "no_restriction",
          "secure": true,
          "session": false,
          "storeId": "0",
          "value": "6659faeffde75c6b04d5303ec7499115d60186fa016cc70a0769ea5d83c7caff",
          "id": 23
      },
      {
          "domain": ".www.tiktok.com",
          "hostOnly": false,
          "httpOnly": false,
          "name": "__tea_cache_tokens_1988",
          "path": "/",
          "sameSite": "unspecified",
          "secure": false,
          "session": false,
          "storeId": "0",
          "value": "{%22_type_%22:%22default%22%2C%22user_unique_id%22:%227256809649374184967%22%2C%22timestamp%22:1689607678276}",
          "id": 24
      },
      {
          "domain": ".www.tiktok.com",
          "hostOnly": false,
          "httpOnly": false,
          "name": "passport_fe_beating_status",
          "path": "/",
          "sameSite": "unspecified",
          "secure": false,
          "session": true,
          "storeId": "0",
          "value": "true",
          "id": 25
      },
      {
          "domain": ".www.tiktok.com",
          "hostOnly": false,
          "httpOnly": false,
          "name": "tiktok_webapp_theme",
          "path": "/",
          "sameSite": "unspecified",
          "secure": true,
          "session": false,
          "storeId": "0",
          "value": "light",
          "id": 26
      },
      {
          "domain": "www.tiktok.com",
          "hostOnly": true,
          "httpOnly": false,
          "name": "living_user_id",
          "path": "/",
          "sameSite": "unspecified",
          "secure": false,
          "session": false,
          "storeId": "0",
          "value": "98610993253",
          "id": 27
      },
      {
          "domain": "www.tiktok.com",
          "hostOnly": true,
          "httpOnly": false,
          "name": "msToken",
          "path": "/",
          "sameSite": "unspecified",
          "secure": false,
          "session": false,
          "storeId": "0",
          "value": "L8KMHEgRCEs1LGufwSdLNFlGS6q4zyImq0mAyRXmdh-lqcJdHbBSsl_2d4egmql_IiuEoXTwUK-tnhla_-9GTHozKgUSphWxb9AhyzIlGaF1FTnzcq47NVKOMHJ7WUksEHxeryU=",
          "id": 28
      }
      ]
    let list = [];
      let new_arr = [];
      let strs = string.split(";");
      let sid = ""
      strs.forEach(item => {
        let is = item.trim().split("=");
        let value = helper.getString(item.trim(),`${is[0]}=`,";")
        let index = array.findIndex(i => i.name == is[0]);
        if (is[0] == "sessionid") {
          sid = value
        }
        if (index !== -1) {
          let new_i = array[index];
          new_i.value = value
          new_arr.push(new_i)
        }
      })
    return new_arr
  },
  getTime: function() {
  // Thiết lập đối tượng Date theo múi giờ Việt Nam
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  
  // Định dạng giờ, phút, giây
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  // Trả về chuỗi thời gian đã định dạng
  return (`[${hours}:${minutes}:${seconds}]`);
},
  parserProxyString : function (proxystring) {
    proxystring = proxystring || ""
    let authInfoI = ""
    let proxyAddressI = proxystring
    proxystring = proxystring.replace("https://","").replace("http://","")
    if((proxystring||"").includes("@")) {
      const [authInfo, proxyAddress] = proxystring.split('@');
      proxyAddressI = proxyAddress;
      authInfoI = authInfo
    }
    const [username, password] = authInfoI.split(':');
    const [host, port] = proxyAddressI.split(':');
    if(port && host)
    return  {"protocol":"http",username,password,host,port}
  },
       /**
   * makeRequest
   * @param {options: {url, headers, method, proxy,retryCount, body, timeout, proxy_list, form, isRetry, isGetBody, preCheckRetry, retryTime }}  options
   * @return {{ body, stautus, bodyJson, headers}}
   */
  makeRequestNew: async function (options) {
    // console.log(options)
  let { url, headers, method, proxy, retryCount, body, timeout, retryTime, proxy_list, form, preCheckRetry, name, retryAfter } = options;
  method = method || "get";
  retryTime = retryTime || 2;
  retryAfter = retryAfter || 1000;
  let isGetBody = true;
  if (options.hasOwnProperty("isGetBody")) {
    isGetBody = options.isGetBody;
  }
  let isRetry = true;
  if (options.hasOwnProperty("isRetry")) {
    isRetry = options.isRetry;
  }
  let retry = retryCount || 0;

  let head = await new Promise(r => {
    const reqOptions = {
      url,
      method: method.toUpperCase(),
      headers,
      timeout: timeout || 10000
    };
    if (body) reqOptions.body = body;
    if (form) reqOptions.form = form;

    if (proxy) {
      let proxystr = "";
      if (typeof proxy == "string") {
        proxystr = proxy;
        if (!proxy.includes("https") && !proxy.includes("http")) {
          let { protocol, host, port, username, password } = helper.parserProxyString(proxy);
          proxystr = `${protocol || "http"}://${username && password ? `${username}:${password}@` : ''}${host}:${port}`;
        }
      } else {
        let { protocol, host, port, username, password } = proxy;
        proxystr = `${protocol || "http"}://${username && password ? `${username}:${password}@` : ''}${host}:${port}`;
      }
      reqOptions.proxy = proxystr;
    }

    let done = false;

    const req = request(reqOptions, (error, response, body) => {
      if (!done) {
        log('body')
        log(helper.getTime(),"done")
        done = true;
        return r({ error, body, headers: response ? response.headers : {}, status: response ? response.statusCode : null });
      }
    });
    req.on('response', res => {
      log(helper.getTime(),"destroy", reqOptions.proxy,res.statusCode);
      done = true;
      res.destroy(); // huỷ nhận dữ liệu từ server
      return r({ error:null,body: (res && res.body) ? res.body : "ok", headers: res ? res.headers : {}, status: res ? res.statusCode : null });
    });
    req.on('data', res => {
      // console.log(helper.getTime(),"data started");
      res.abort(); // huỷ nhận dữ liệu từ server
      done = true;
      return r({ error: "Request aborted after send", body: "", headers: {}, status: null });
    });
    req.on('socket', socket => {
      socket.on('connect', () => {
        log("cancel")
        setTimeout(() => {
          if (!done) {
            req.abort();
            done = true;
            return r({ error: "Request aborted after send", body: "", headers: {}, status: null });
          }
        }, 20);
      });
    });
    req.on('error', err => {
      log("Error or aborted:", err.message);
    });

    setTimeout(() => {
      if (!done) {
        done = true;

        log("cancel timeout")
        return r({ error: "Request timeout", body: "", headers: {}, status: null });
      }
    }, timeout || 10000);
  });
  // console.log("head",head)
  let isRetryPreCheck = false;
  if (typeof preCheckRetry === "function") {
    try {
      isRetryPreCheck = await preCheckRetry(head.body || "", head);
    } catch (e) {
      log("err pre", e);
    }
  }

  let bodyJson = {};
  try { bodyJson = JSON.parse(head.body); } catch (e) { }
  head.bodyJson = bodyJson;

  if (isRetryPreCheck || head.error || (!head.body && isGetBody)) {
    if (retry < retryTime && isRetry) {
      if (proxy_list && proxy_list.length > 0) {
        options.proxy = proxy_list[Math.floor(Math.random() * proxy_list.length)];
      }
      retry++;
      options.retryCount = retry;
      await helper.delay(retryAfter || 1000);
      log("get again")
      return await helper.makeRequestNew(options);
    }
    return head;
  }
  // console.log("done")
  return head;
},
  makeRequest: async function (options) {
    
    let {url, headers, method, proxy,retryCount, body, timeout, retryTime, proxy_list, form, preCheckRetry, name, retryAfter} = options
    method = method || "get"
    retryTime = retryTime || 2;
    retryAfter =retryAfter || 1000
    let isGetBody = true;
    if(options.hasOwnProperty("isGetBody")) {
      isGetBody = options.isGetBody
    }
    let isRetry = true;
    if(options.hasOwnProperty("isRetry")) {
      isRetry = options.isRetry
    }
    let retry = retryCount || 0;
    let head = await  new Promise(r => {
      const options = {
        url,
        method: method.toUpperCase(),
        headers: headers,
        body,
        timeout: timeout  || 10000
      }
      if(body) options.body = body;
      if(form) options.form = form;
      let done = false;
      setTimeout(()=>{
        if(!done){
          done = true;
          return  r({error:"Request timeout", body: "", headers:  {}, status:  null })
        }
      },timeout  || 10000)

      if (proxy) {
        let proxystr = ""
        if( typeof proxy == "string") {
          proxystr = proxy
          if(!proxy.includes("https" || !proxy.includes("http"))){
            let { protocol, host, port, username, password } = helper.parserProxyString(proxy);
            proxystr = `${protocol || "http"}://${username && password ? `${username}:${password}@` : ''}${host}:${port}`
          }
        } else {
          let { protocol, host, port, username, password } = proxy;
          proxystr = `${protocol || "http"}://${username && password ? `${username}:${password}@` : ''}${host}:${port}`
        }
        options.proxy = proxystr
      }
      options.encoding = null
      request(options,(error, response, body) => {
          if(!done){
            done = true;

            return  r({error, body: body ? body.toString("utf8"): "", bodyBinary: body, headers: response ? response.headers : {}, status: response ?response.statusCode : null })
          }
      })
    })
    let isRetryPreCheck =false
    if( "function" ==  typeof preCheckRetry) 
      {
        try {
          isRetryPreCheck = await preCheckRetry(head.body || "", head)
          isRetryPreCheck 
        } catch(e){
          error("err pre", e)
        }
      }

      let bodyJson = {};
      try { bodyJson= JSON.parse(head.body)} catch(e){}
      head.bodyJson = bodyJson
    if(isRetryPreCheck || head.error || (!head.body && isGetBody) ) {
      if(retry < retryTime && isRetry){
        // console.log("retry request:",name)
        if(proxy_list && proxy_list.length > 0){
          options.proxy = proxy_list[Math.floor((Math.random() * proxy_list.length))]
        }
        retry++
        options.retryCount = retry
        await helper.delay(retryAfter || 1000)
        return await helper.makeRequest(options)
      }
      return head
  
    }

    return head
  },
  makeRequestCC: async function (options) {
    let {url, headers, method, proxy,retryCount, body, timeout, retryTime, proxy_list } = options
    method = method || "get"
    retryTime = retryTime || 3;
    headers.cookie = request.cookie(headers.cookie)
    let isGetBody = true;
    if(options.hasOwnProperty("isGetBody")) {
      isGetBody = options.isGetBody
    }
    let isRetry = true;
    if(options.hasOwnProperty("isRetry")) {
      isRetry = options.isRetry
    }
    let retry = retryCount || 0;
    let head = await  new Promise(r => {
      const options = {
        url,
        method: method.toUpperCase(),
        headers: headers,
        body,
        timeout: timeout  || 10000
      }
      let done = false;
      setTimeout(()=>{
        if(!done){
          done = true;
          return  r({error:"Request timeout", body: "", headers:  {}, status:  null })
        }
      },timeout  || 10000)

      if (proxy) {
        let proxystr = ""
        if( typeof proxy == "string") {
          proxystr = proxy
        } else {
          let { protocol, host, port, username, password } = proxy;
          proxystr = `${protocol || "http"}://${username && password ? `${username}:${password}@` : ''}${host}:${port}`
        }
        options.proxy = proxystr
      }
      request(options,(error, response, body) => {
          if(!done){
            done = true;
            return  r({error, body, headers: response ? response.headers : {}, status: response ?response.statusCode : null })
          }
      })
    })
    if(head.error || (!head.body && isGetBody) ) {
      if(retry < retryTime && isRetry){
        if(proxy_list && proxy_list.length > 0){
          options.proxy = proxy_list[Math.floor((Math.random() * proxy_list.length))]
        }
        retry++
        options.retryCount = retry
        return await helper.makeRequestCC(options)
      }
      return head
  
    }
    let bodyJson = {};
    try { bodyJson= JSON.parse(head.body)} catch(e){}
    head.bodyJson = bodyJson
    return head
  },
   getRandomInt: (min, max) =>{
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); 
  },
  generateRandomName: (length) =>{
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  },
    /**
   * parserAccounts
   * @param {{acc_string:string| [string],number_slice, getIndex, number_ignore,key,format,key_format, item_return_type}} options 
   * @return [Account]
   * @description 
   *  item_return_type: +obejct then return obejct Account, + key_in_format then return value of key
   */
  parserAccounts :  ({acc_string,number_slice, getIndex, number_ignore ,key, format, key_format, item_return_type, preReturn}) =>{
    format =  format || "username|temp1|temp2|temp3|cookie_string"
    key_format = key_format || "|"
    item_return_type = item_return_type || "object"
    let accounts = typeof acc_string == "string" ? (acc_string.split(key || "\n")):  acc_string;
    if(number_ignore) {
      let [ sub, remain ]  = helper.subArray(accounts, number_ignore)
      accounts = remain
    }
    let spliced_array = [accounts] ;
    if(number_slice || number_slice>0){
      spliced_array = helper.splice(accounts,number_slice) 
      getIndex = 0
    }
  

    if(!spliced_array || !spliced_array.length) return [];
    if(getIndex > (spliced_array.length  - 1)) return []
    let array_return = []

    for(let index = 0; index <  spliced_array[getIndex].length ; index ++){
      let i =   spliced_array[getIndex][index]
      let item = {};
      if( typeof i == "string") {
        let  arr = i.split(key_format);
        let keys  = format.split(key_format);
        
        
        for(let i = 0; i < keys.length; i ++){
          item[keys[i]] = arr[i]
        }
      } else {
        item = i;
      }
     
      let is_pass = true;
      if(preReturn){
        try {
           is_pass =  preReturn(item,item[item_return_type])

        } catch(e){
          error("error", e)
        }
      }
      if(is_pass)
       array_return.push(item_return_type == "object" ? item : item[item_return_type])  

    }

    return array_return
  },
  saveAccStatus: (status_viewer_data) =>{
    let folder_account_no_login = "./data_test/111_no_login.json"
    let folder_account_403 = "./data_test/111_403.json"
    let folder_account_ok = "./data_test/111_ok.json"
    let folder_account_no_data = "./data_test/111_no_data.json"
    let folder_account_timeout = "./data_test/111_timeout.json"
    //3 - no login, 1 viewed, 2 - error,4 - 403
    helper.saveAccItem(status_viewer_data, folder_account_ok, 1)
    helper.saveAccItem(status_viewer_data, folder_account_no_data, 2)
    helper.saveAccItem(status_viewer_data, folder_account_no_login, 3)
    helper.saveAccItem(status_viewer_data, folder_account_403, 4)
    helper.saveAccItem(status_viewer_data, folder_account_timeout, -1)
  },
  getAccFile : (value_check)=>{
    let folder_account_no_login = "./data_test/111_no_login.json"
    let folder_account_403 = "./data_test/111_403.json"
    let folder_account_ok = "./data_test/111_ok.json"
    let folder_account_no_data = "./data_test/111_no_data.json"
    let folder_account_timeout = "./data_test/111_timeout.json"
    let folder_account_good = "./data_test/111_good.json"
    let data = []
    switch(value_check){
      case -1:
        file_path = folder_account_timeout
        break;
      case 1:
        file_path = folder_account_ok
        break;
      case 2:
        file_path = folder_account_no_data
        break;
      case 3:
        file_path = folder_account_no_login
        break;
      case 4:
        file_path = folder_account_403
        break;
      case 0:
        file_path = folder_account_good
        break;
    }
    if (fs.existsSync(file_path)) {
      data = require(path.resolve(file_path));
    }
    return data
  },
  saveAccItem : (status_viewer_data, file_path, value_check)=>{

    // Đọc file nếu có, nếu không thì tạo mảng rỗng
    let existingKeys = [];
    if (fs.existsSync(file_path)) {
      try {
        existingKeys = require(path.resolve(file_path));
        if (!Array.isArray(existingKeys)) existingKeys = [];
      } catch (e) {
        existingKeys = [];
      }
    }

    // Dùng Set để tăng tốc độ tìm kiếm
    const existingSet = new Set(existingKeys);
    let updated = false;

    for (const [key, value] of Object.entries(status_viewer_data)) {
      if (value === value_check && !existingSet.has(key)) {
        existingSet.add(key);
        updated = true;
      }
    }

    // Nếu có update thì lưu lại file
    if (updated) {
      const updatedArray = Array.from(existingSet);
      fs.writeFileSync(file_path, JSON.stringify(updatedArray, null, 2), 'utf-8');
      log("Đã cập nhật file với key mới.");
    } else {
      log("Không có gì thay đổi.");
    }
  },
  genheaderenter: function({s_sdk_crypt_sdk, s_sdk_sign_data_key,path}) {
    s_sdk_crypt_sdk = Buffer.from(s_sdk_crypt_sdk, 'base64');
    s_sdk_sign_data_key = Buffer.from(s_sdk_sign_data_key, 'base64');
    let s_sdk_crypt_sdk_json = JSON.parse(JSON.parse(s_sdk_crypt_sdk).data);
    let s_sdk_sign_data_key_json = JSON.parse(JSON.parse(s_sdk_sign_data_key).data);
    const privateKey = s_sdk_crypt_sdk_json.ec_privateKey;
    const publicKey = s_sdk_crypt_sdk_json.ec_publicKey;
    const ts_sign = s_sdk_sign_data_key_json.ts_sign;
    const ticket = s_sdk_sign_data_key_json.ticket;
    let time_now = Math.floor(Date.now()/1000)
    const result = signDataECDSA(privateKey, `ticket=${ticket}&path=${path}&timestamp=${time_now}`);
  
    const publicKeyObject = crypto.createPublicKey(publicKey);
    
    // Xuất dưới dạng `raw` key (đúng là Q = 04 || X || Y)
    const publicKeyRaw = publicKeyObject.export({ format: 'der', type: 'spki' });
    
    // Tách đúng phần Q (raw EC point)
    const rawQ = publicKeyRaw.slice(-65); // EC P-256 raw public key always 65 bytes
    
    const publicRawKeyBase64 = rawQ.toString('base64');
  
    // console.log('HEX Signature:', result.hex);
    // console.log('Base64 Signature:', result.base64);
    let client_data = {
        "ts_sign":ts_sign,
        "req_content":"ticket,path,timestamp",
        "req_sign":result.base64,
        "timestamp":time_now
    }
    let client_data_encode = Buffer.from(JSON.stringify(client_data), 'utf8').toString('base64')
    return {
        "tt-ticket-guard-public-key": publicRawKeyBase64,
        "tt-ticket-guard-client-data": client_data_encode
    };
      // Convert raw R||S to DER format (like rawSigToDER)
    function rawSigToDER(sig) {
      const halfLen = sig.length / 2;
      const r = sig.slice(0, halfLen);
      const s = sig.slice(halfLen);
  
      function encodeInt(val) {
        let i = 0;
        while (i < val.length && val[i] === 0) i++;
        let v = val.slice(i);
        if (v[0] & 0x80) v = Buffer.concat([Buffer.from([0]), v]);
        return Buffer.concat([Buffer.from([0x02, v.length]), v]);
      }
  
      const encodedR = encodeInt(r);
      const encodedS = encodeInt(s);
      const totalLength = encodedR.length + encodedS.length;
      return Buffer.concat([Buffer.from([0x30, totalLength]), encodedR, encodedS]);
    }
  
    // Main sign function
    function signDataECDSA(privateKeyPem, sign_str) {
      const privateKey = crypto.createPrivateKey(privateKeyPem);
      const data = Buffer.from(sign_str, 'utf8');
  
      // Create raw signature (64 bytes, R||S)
      const rawSignature = crypto.sign('sha256', data, {
        key: privateKey,
        dsaEncoding: 'ieee-p1363'
      });
  
      // Convert raw to DER (ASN.1)
      const derSignature = rawSigToDER(rawSignature);
  
      // Convert to hex
      const hexSignature = derSignature.toString('hex');
  
      return {
        hex: hexSignature,
        base64: Buffer.from(derSignature).toString('base64')
      };
    }
  },
  requestCURL:async  function ({cookie_string,proxyUrl, useragent, url}){
    let cmd 
    let file = path. resolve(Date.now()+ "_" +helper.getRandomInt(100000, 900000)+".txt")
  // cmd = `curl -i ${proxyUrl? ("-x '"+ (proxyUrl.replace("http://","")))+"'" :""} "${url}" \
  // -H 'accept: */*' \
  // -H 'accept-language: vi,en-US;q=0.9,en;q=0.8,vi-VN;q=0.7' \
  // -H 'cache-control: no-cache' \
  // -H 'content-type: application/x-www-form-urlencoded; charset=UTF-8' \
  // -H 'Cookie: ${cookie_string}' \
  // -b '${cookie_string}' \
  // -H 'dnt: 1' \
  // -H 'origin: https://www.tiktok.com' \
  // -H 'pragma: no-cache' \
  // -H 'priority: u=1, i' \
  // -H 'referer: https://www.tiktok.com/' \
  // -H 'sec-ch-ua: "Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"' \
  // -H 'sec-ch-ua-mobile: ?0' \
  // -H 'sec-ch-ua-platform: "macOS"' \
  // -H 'sec-fetch-dest: empty' \
  // -H 'sec-fetch-mode: cors' \
  // -H 'sec-fetch-site: same-site' \
  // -H 'user-agent: ${useragent}'`
  const proxy = proxyUrl ? ['-x', proxyUrl.replace('http://', '')] : [];

const headers = [
  '-H', 'accept: */*',
  '-H', 'accept-language: vi,en-US;q=0.9,en;q=0.8,vi-VN;q=0.7',
  '-H', 'cache-control: no-cache',
  '-H', 'content-type: application/x-www-form-urlencoded; charset=UTF-8',
  '-H', `Cookie: ${cookie_string}`,
  '-b', cookie_string,
  '-H', 'dnt: 1',
  '-H', 'origin: https://www.tiktok.com',
  '-H', 'pragma: no-cache',
  '-H', 'priority: u=1, i',
  '-H', 'referer: https://www.tiktok.com/',
  '-H', 'sec-ch-ua: "Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
  '-H', 'sec-ch-ua-mobile: ?0',
  '-H', 'sec-ch-ua-platform: "macOS"',
  '-H', 'sec-fetch-dest: empty',
  '-H', 'sec-fetch-mode: cors',
  '-H', 'sec-fetch-site: same-site',
  '-H', `user-agent: ${useragent}`,
];
const args = [
  '-i',
  ...proxy,
  ...headers,
  url
];

  let { stdout, stdoutString} = await helper.runCmdSpawn("curl", args , ({error, stdout, stderr})=>{
    // console.log(error, stdout, stderr)
  })
  stdoutString = stdoutString || ""
  let spl_array = stdoutString.split("\n")
  let set_cookie = "";
  let location =""
  spl_array.forEach((item)=>{
    let [ name, value] = item.split(":");
    value = (value||"").trim()
    name = (name||"").trim()
    if(name=="set-cookie"){
        set_cookie+=value+","
    }
    if(name=="location"){
        location= item.replace("location:","").trim()
    }
  })
  return { location, set_cookie,stdout:stdoutString, cmd,file,body: stdoutString, bodyBinary: stdout}

},
runCmd: (cmd) => {
  return new Promise((r) => {
    const child = exec(cmd, (error, stdout, stderr) => {
      return r({ error, success: error ? false : true, stdout, stderr });
    });
    const cleanup = () => {
      if (child) {
        log('Killing child process...');
        child.kill(); // Sends SIGTERM to the child process
      }
    };

    // Handle parent process exit
    process.on('exit', cleanup);

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      cleanup();
      process.exit();
    });

    // Handle SIGTERM
    process.on('SIGTERM', () => {
      cleanup();
      process.exit();
    });

    // Optionally handle other termination signals if needed
    process.on('SIGUSR1', () => {
      cleanup();
      process.exit();
    });

    process.on('SIGUSR2', () => {
      cleanup();
      process.exit();
    });

    // Handle uncaught exceptions to ensure cleanup
    process.on('uncaughtException', (err) => {
      log('Uncaught exception:', err);
      cleanup();
      process.exit(1);
    });
  });
},
 runCmdSpawn :(cmd, args = [], callback) => {
  return new Promise((resolve) => {
    const child = spawn(cmd, args);

    const stdoutChunks = [];
    const stderrChunks = [];

    child.stdout.on('data', (chunk) => stdoutChunks.push(chunk));
    child.stderr.on('data', (chunk) => stderrChunks.push(chunk));

    child.on('close', (code) => {
      let rs = {
        error: code !== 0 ? new Error(`Exited with code ${code}`) : null,
        success: code === 0,
        stdout: Buffer.concat(stdoutChunks),
        stdoutString: Buffer.concat(stdoutChunks).toString(),

        stderr: Buffer.concat(stderrChunks).toString()
      }
      callback(rs)
      resolve(rs);
    });

    const cleanup = () => {
      if (child) {
        log('Killing child process...');
        child.kill();
      }
    };

    process.on('exit', cleanup);
    process.on('SIGINT', () => { cleanup(); process.exit(); });
    process.on('SIGTERM', () => { cleanup(); process.exit(); });
    process.on('SIGUSR1', () => { cleanup(); process.exit(); });
    process.on('SIGUSR2', () => { cleanup(); process.exit(); });
    process.on('uncaughtException', (err) => {
      error('Uncaught exception:', err);
      cleanup();
      process.exit(1);
    });
  });
}

}

module.exports = helper
