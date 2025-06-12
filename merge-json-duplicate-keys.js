const fs = require('fs');

// Hàm kiểm tra object thường
function isPlainObject(o) {
  return typeof o === 'object' && o !== null && !Array.isArray(o);
}

// Parser giữ track các key trùng
function parseAndMergePrioritizeObject(jsonStr) {
  let i = 0;
  function skipWs() {
    while (/\s/.test(jsonStr[i])) i++;
  }
  function parseValue() {
    skipWs();
    if (jsonStr[i] === '{') return parseObject();
    if (jsonStr[i] === '[') return parseArray();
    if (jsonStr[i] === '"') return parseString();
    if (/[\d\-]/.test(jsonStr[i])) return parseNumber();
    if (jsonStr.startsWith('true', i)) { i += 4; return true; }
    if (jsonStr.startsWith('false', i)) { i += 5; return false; }
    if (jsonStr.startsWith('null', i)) { i += 4; return null; }
    throw new Error('Unexpected char at ' + i);
  }
  function parseObject() {
    let objList = []; // Danh sách các object trùng key
    i++; skipWs();
    let obj = {};
    let keyOrder = [];
    while (jsonStr[i] !== '}') {
      skipWs();
      let key = parseString();
      skipWs();
      if (jsonStr[i] !== ':') throw new Error('Expect : at ' + i);
      i++; skipWs();
      let val = parseValue();
      // Track all duplicate key for this object
      if (obj.hasOwnProperty(key)) {
        if (!Array.isArray(obj[key + '__dup'])) {
          obj[key + '__dup'] = [obj[key]];
        }
        obj[key + '__dup'].push(val);
      } else {
        obj[key] = val;
        keyOrder.push(key);
      }
      skipWs();
      if (jsonStr[i] === ',') { i++; skipWs(); }
      else break;
    }
    if (jsonStr[i] !== '}') throw new Error('Expect } at ' + i);
    i++; skipWs();
    // Sau khi parse xong, merge duplicate key
    for (let key of keyOrder) {
      if (obj[key + '__dup']) {
        // Lấy theo quy tắc: Nếu bất kỳ value nào trong list là object, ưu tiên lấy object cuối cùng
        // Ngược lại lấy cái đầu
        let dupList = obj[key + '__dup'];
        let lastObj = null;
        for (let v of dupList) {
          if (isPlainObject(v)) lastObj = v;
        }
        if (isPlainObject(obj[key])) lastObj = obj[key];
        if (lastObj) {
          obj[key] = lastObj;
        } else {
          obj[key] = dupList[0]; // Không có object thì lấy cái đầu
        }
        delete obj[key + '__dup'];
      }
    }
    return obj;
  }
  function parseArray() {
    let arr = [];
    i++; skipWs();
    while (jsonStr[i] !== ']') {
      arr.push(parseValue());
      skipWs();
      if (jsonStr[i] === ',') { i++; skipWs(); }
      else break;
    }
    if (jsonStr[i] !== ']') throw new Error('Expect ] at ' + i);
    i++; skipWs();
    return arr;
  }
  function parseString() {
    if (jsonStr[i] !== '"') throw new Error('Expect " at ' + i);
    i++;
    let s = '';
    while (i < jsonStr.length) {
      if (jsonStr[i] === '"') { i++; break; }
      if (jsonStr[i] === '\\') {
        s += jsonStr[i++]; s += jsonStr[i++];
      } else {
        s += jsonStr[i++];
      }
    }
    return JSON.parse('"' + s + '"');
  }
  function parseNumber() {
    let start = i;
    while (/[0-9eE.\-+]/.test(jsonStr[i])) i++;
    return Number(jsonStr.slice(start, i));
  }

  let val = parseValue();
  skipWs();
  return val;
}

// ===== MAIN =====
const filename = process.argv[2] || 'lang.json';
const raw = fs.readFileSync(filename, 'utf8');
try {
  const merged = parseAndMergePrioritizeObject(raw);
  fs.writeFileSync('merged.json', JSON.stringify(merged, null, 2), 'utf8');
  console.log('✅ Đã merge xong! File output: merged.json');
} catch (e) {
  console.error('❌ Lỗi khi xử lý:', e.message);
}
