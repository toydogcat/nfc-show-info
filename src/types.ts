export interface NfcCard {
  id: string;
  name: string;
  type: string;
  uid: string;
  standard: string;
  capacity: number;
  manufacturer: string;
  description: string;
  payloadString: string;
  color: string;
  logoType: 'easycard' | 'access' | 'machine' | 'amiibo' | 'phone' | 'hotel' | 'generic';
  createdAt: string;
  note?: string;
  sectors?: Array<{
    sectorIndex: number;
    blocks: Array<{
      blockIndex: number;
      dataHex: string;
      desc?: string;
    }>;
  }>;
}

export const EX_DEFAULT_CARDS: NfcCard[] = [
  {
    id: 'tpl-1',
    name: '捷運乘車聯名卡 (悠遊卡)',
    type: 'NXP MIFARE DESFire EV2 (MF3D22)',
    uid: '04:A5:8C:1A:3C:66:80',
    standard: 'ISO/IEC 14443-4 (Type A)',
    capacity: 2048,
    manufacturer: 'NXP Semiconductors',
    description: '台灣最普遍的非接觸式智慧交通票卡。晶片具備 ISO 14443-4 高階防破譯 CPU 架構，內部錢包 Purse 扣款區使用大眾運輸專用安全金鑰加密，擁有數位防偽電子簽章、不可手機重寫與偽造複製。',
    payloadString: 'Select AID: [0xA0, 0x00, 0x00, 0x03, 0x08, 0x00, 0x01] (EasyCard Transit Application ID), Sector Key Mode: 3DES/AES dynamic Auth',
    color: 'from-blue-600 to-emerald-500',
    logoType: 'easycard',
    createdAt: '2026-05-25T03:00:00Z',
    note: '悠遊卡在 2012 年後便全面更換為具備微控制器 (MCU) 的 CPU 卡。由於涉及硬體信任錨點與 AES 雙向金鑰配對，目前無任何手機軟體可對悠遊卡進行物理層扣款餘額的修改與複製。',
    sectors: [
      {
        sectorIndex: 0,
        blocks: [
          { blockIndex: 0, dataHex: '04 A5 8C 1A 3C 66 80 80 D1 03 E1 04 AA FE BB CC', desc: 'UID 與製造商硬體代碼（獨家唯讀）' },
          { blockIndex: 1, dataHex: '00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00', desc: '系統參數區 1' },
          { blockIndex: 2, dataHex: 'A2 C3 E1 D4 FF 00 11 22 33 44 55 66 77 88 99 AA', desc: '安全通道控制位元（CPU 加密通道）' }
        ]
      },
      {
        sectorIndex: 1,
        blocks: [
          { blockIndex: 4, dataHex: '52 49 54 41 20 4 C 49 4D 49 54 45 44 20 A0 A1 A2', desc: '大眾路網票價路由安全資訊' },
          { blockIndex: 5, dataHex: '05 E2 BF D3 00 00 00 00 45 FF AB CD EF 12 34 56', desc: '離線交易額度特許控制' }
        ]
      }
    ]
  },
  {
    id: 'tpl-2',
    name: '社區大樓感應門禁卡',
    type: 'MIFARE Classic 1K (S50)',
    uid: '4F:2E:82:11',
    standard: 'ISO/IEC 14443-3 (Type A)',
    capacity: 1024,
    manufacturer: 'NXP Semiconductors / Fudan Micro',
    description: '一般物業與電梯所使用的主流感應卡。使用 Crypto1 專利加密演算法。由於演算法已被研究出結構瑕疵，目前可透過 Proxmark3 破譯 Key A/B，再寫入 UID 白卡進行整卡完美複製。',
    payloadString: 'Sector 0: Manufacturer block info. Sector 1-15: Static Crypto1 Keys [Key A: FF FF FF FF FF FF / Key B: FF FF FF FF FF FF]',
    color: 'from-amber-500 to-red-600',
    logoType: 'access',
    createdAt: '2026-05-25T02:30:00Z',
    note: '此類卡片極易受到 Nested 或 Darkside 漏洞攻擊，進而竊取全扇區金鑰。建議大樓門禁改採聯網動態滾碼或提升至 DESFire CPU 安全晶片。',
    sectors: Array.from({ length: 4 }).map((_, sIdx) => ({
      sectorIndex: sIdx,
      blocks: [
        { blockIndex: sIdx * 4, dataHex: sIdx === 0 ? '4F 2E 82 11 32 08 04 00 62 63 64 65 66 67 68 69' : '00 11 22 33 44 55 66 77 88 99 AA BB CC DD EE FF', desc: sIdx === 0 ? 'UID 物理卡號與廠商韌體碼' : '資料儲存區' },
        { blockIndex: sIdx * 4 + 1, dataHex: '00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00', desc: '門格特許記錄數據' },
        { blockIndex: sIdx * 4 + 2, dataHex: '00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00', desc: '時效判定暫存' },
        { blockIndex: sIdx * 4 + 3, dataHex: 'A0 A1 A2 A3 A4 A5 78 77 88 C1 B0 B1 B2 B3 B4 B5', desc: '扇區金鑰 A (A0..A5) / 權限控制 / 金鑰 B' }
      ]
    }))
  },
  {
    id: 'tpl-3',
    name: '廠務 CNC 設備保養巡檢 Tag',
    type: 'NXP NTAG213',
    uid: '04:E2:B3:98:4B:2B:80',
    standard: 'NFC Forum Type 2 / ISO 14443-A',
    capacity: 144,
    manufacturer: 'NXP Semiconductors',
    description: '智慧工廠機台點檢專用標籤，內嵌 NDEF URI 標準格式。點檢人員使用配發之工業平板或手機靠近，即可直接開啟該設備之在線點檢表與歷程記錄。',
    payloadString: 'NDEF Record type: URI, Payload: "https://factory-iot.internal/machine/CNC-402-AX"',
    color: 'from-sky-500 to-indigo-600',
    logoType: 'machine',
    createdAt: '2026-05-25T01:45:00Z',
    note: '點檢標籤內建有 32-bit PWD 口令。如果需要防止設備人員自行篡改巡檢紀錄，可以下發 Write Lock 密碼鎖，使其僅可唯讀。',
    sectors: [
      {
        sectorIndex: 0,
        blocks: [
          { blockIndex: 0, dataHex: '04 E2 B3 98 4B 2B 80 CC', desc: 'UID 7 位元組序號區' },
          { blockIndex: 1, dataHex: 'A1 B2 C3 04 EE FF 12 34', desc: '動態靜態鎖定鎖控制 (Lock Bytes)' },
          { blockIndex: 2, dataHex: 'E1 10 12 00 03 00 FE AC', desc: 'NDEF 外掛頭資訊 (Capability Container)' }
        ]
      },
      {
        sectorIndex: 1,
        blocks: [
          { blockIndex: 3, dataHex: '03 34 D1 01 30 55 04 66', desc: 'NDEF URI 標頭: "https://..."' },
          { blockIndex: 4, dataHex: '61 63 74 6F 72 79 2D 69', desc: '字節資料: "actory-i"' },
          { blockIndex: 5, dataHex: '6F 74 2E 69 6E 74 65 72', desc: '字節資料: "ot.inter"' },
          { blockIndex: 6, dataHex: '6E 61 6C 2F 63 6E 63 2D', desc: '字節資料: "nal/cnc-"' },
          { blockIndex: 7, dataHex: '34 30 32 2D 61 78 FE 00', desc: '字節資料: "402-ax"' }
        ]
      }
    ]
  },
  {
    id: 'tpl-4',
    name: '魔物獵人 Amiibo 遊戲公仔',
    type: 'NXP NTAG215',
    uid: '04:1C:2F:EB:31:AA:80',
    standard: 'NFC Forum Type 2 / ISO 14443-A',
    capacity: 504,
    manufacturer: 'NXP Semiconductors',
    description: '任天堂主機專用感應玩具。利用 NTAG215 大儲存記憶體。內嵌經 SHA-256 私鑰雜湊加密的任天堂正版憑證、主機帳號識別與公仔能力值進度。',
    payloadString: 'Encrypted Nintendo Signature BIN Blob. Region Locked. Pages 0xF0-0xFF encrypted custom values',
    color: 'from-purple-600 to-pink-500',
    logoType: 'amiibo',
    createdAt: '2026-05-25T01:10:00Z',
    note: 'Amiibo 卡片包含動態記錄。若修改 NTAG215 的唯讀配置，該公仔將無法寫入新進度。多款主機使用 Flipper 或是手機寫入 Amiibo 卡可正常調用。',
    sectors: [
      {
        sectorIndex: 0,
        blocks: [
          { blockIndex: 0, dataHex: '04 1C 2F EB 31 AA 80 84', desc: 'UID 與公仔身分辨識別碼' },
          { blockIndex: 1, dataHex: '00 00 FF F0 CC DD AA 11', desc: '遊戲安全鎖與靜態保護字節' }
        ]
      }
    ]
  },
  {
    id: 'tpl-5',
    name: 'iPhone Mobile NFC Token (Apple Pay)',
    type: 'Dynamic Host Card Emulation (HCE)',
    uid: '08:E5:A2:3B',
    standard: 'ISO/IEC 14443-4 (Type A)',
    capacity: 4096,
    manufacturer: 'Apple Inc. / Secure Element',
    description: '行動支付、手機進場虛擬卡。為了用戶隱私，每次靠近感應器都會自動生成一個以 0x08 開頭的「動態隨機 4-Byte UID」，拒絕對外透露真實卡號，同時透過專屬加密處理器進行安全感應。',
    payloadString: 'Select Selectable AID [0x32, 0x50, 0x41, 0x59, 0x2E, 0x53, 0x59, 0x53, 0x2E, 0x44, 0x44, 0x46, 0x30, 0x31] (EMV Card Selection Panel)',
    color: 'from-neutral-700 to-neutral-900',
    logoType: 'phone',
    createdAt: '2026-05-24T23:40:00Z',
    note: '這也就是為什麼一般社區門禁試圖「感應 iPhone 將其當作鑰匙」時，每次感應卡號都會變動而無法刷過的原因：因為 UID 根本不是固定的！',
  },
  {
    id: 'tpl-6',
    name: 'W 萬豪酒店 302 感應房卡',
    type: 'MIFARE Ultralight EV1 (MF0UL11)',
    uid: 'A2:4C:E3:44:11:AB:F5',
    standard: 'ISO/IEC 14443-3 (Type A)',
    capacity: 64,
    manufacturer: 'NXP Semiconductors',
    description: '典型磁鎖飯店房卡。其不要求多重金鑰驗證，只依賴晶片的唯讀第 4 頁至第 8 頁在客房內建聯網系統比對房號、失效時間。安全性較低，亦可用於測試大眾 NDEF 接收。',
    payloadString: '04 02 AA FE 10 33 26 05 25 00 23 (Hotel Booking Sector Block Info)',
    color: 'from-teal-600 to-cyan-500',
    logoType: 'hotel',
    createdAt: '2026-05-24T18:15:00Z',
    note: '此類房卡通常極為便宜，成本低廉。由於可以被輕易抹除，許多大專院校與酒店會反覆磁吸覆寫利用。'
  }
];

export const RAW_COMMON_KEYS = [
  { key: 'FF FF FF FF FF FF', usage: '大部分 Mifare Classic 1K 出廠預設金鑰 A/B' },
  { key: 'A0 A1 A2 A3 A4 A5', usage: '常見的門禁、卡片或特定早期系統常用金鑰' },
  { key: 'D3 F7 D3 F7 D3 F7', usage: 'NFC Forum 專用預設規格 NDEF 密鑰' },
  { key: 'B0 B1 B2 B3 B4 B5', usage: '中國福特、部分地鐵早期專屬金鑰' },
  { key: '4D 3A 99 C3 51 02', usage: '台灣部分大樓與停車場感應加密金鑰 A' },
  { key: '00 00 00 00 00 00', usage: '少部分工業機器與舊款點檢卡預設值' },
];
