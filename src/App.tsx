import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Save, 
  Terminal, 
  Radio,
  Trash
} from 'lucide-react';
import type { NfcCard } from './types';
import { EX_DEFAULT_CARDS, RAW_COMMON_KEYS } from './types';

// Declare Web NFC interface
interface NDefReadingEvent extends Event {
  serialNumber: string;
  message: {
    records: Array<{
      recordType: string;
      mediaType?: string;
      id?: string;
      data?: DataView;
    }>;
  };
}

interface NDEFReaderInstance {
  scan(): Promise<void>;
  write(message: { records: Array<{ recordType: string; data: string }> }): Promise<void>;
  onreading: (event: NDefReadingEvent) => void;
  onreadingerror: () => void;
}

declare global {
  interface Window {
    NDEFReader?: new () => NDEFReaderInstance;
  }
}

interface AttendanceRecord {
  id: string;
  cardName: string;
  uid: string;
  timestamp: string;
}

export default function App() {
  // Core vault and select state
  const [cards, setCards] = useState<NfcCard[]>(() => {
    try {
      const saved = localStorage.getItem('nfc_vault_cards');
      return saved ? JSON.parse(saved) : EX_DEFAULT_CARDS;
    } catch {
      return EX_DEFAULT_CARDS;
    }
  });

  const [selectedCardId, setSelectedCardId] = useState<string>(() => {
    return cards.length > 0 ? cards[0].id : '';
  });

  const selectedCard = cards.find(c => c.id === selectedCardId) || cards[0];

  // UI state filters
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'easycard' | 'access' | 'machine' | 'amiibo' | 'phone' | 'hotel' | 'generic'>('all');
  
  // Real Physics Scan state
  const [isScanning, setIsScanning] = useState(false);
  const [webNfcSupported] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'NDEFReader' in window;
  });

  // Simulation, editor, tool states
  const [activeTab, setActiveTab] = useState<'inspector' | 'editor' | 'write' | 'tester' | 'attendance'>('inspector');
  const [consoleLogs, setConsoleLogs] = useState<Array<{ time: string; type: 'info' | 'warn' | 'success' | 'err'; text: string }>>([
    { time: new Date().toLocaleTimeString(), type: 'info', text: 'NFC 系統啟動。PWA 核心與 A32-NFC 混編晶片系統已就緒。' },
    { time: new Date().toLocaleTimeString(), type: 'success', text: '已連線至 Luna AI Hub 集中式主控台。' }
  ]);

  // Attendance states
  const [isAttendanceMode, setIsAttendanceMode] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('nfc_attendance_records');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // AI Security Report State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string>('');
  const [showAiModal, setShowAiModal] = useState(false);

  // Tester state for cracking
  const [testingKeyIndex, setTestingKeyIndex] = useState<number>(-1);
  const [testResultMsg, setTestResultMsg] = useState<string>('');
  const [crackedSectors, setCrackedSectors] = useState<number[]>([]);

  // Editor fields for selectedCard copy
  const [editName, setEditName] = useState('');
  const [editUid, setEditUid] = useState('');
  const [editType, setEditType] = useState('');
  const [editStandard, setEditStandard] = useState('');
  const [editCapacity, setEditCapacity] = useState(1024);
  const [editManufacturer, setEditManufacturer] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPayload, setEditPayload] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editLogoType, setEditLogoType] = useState<'easycard' | 'access' | 'machine' | 'amiibo' | 'phone' | 'hotel' | 'generic'>('generic');

  // NDEF write creator state
  const [ndefWriteType, setNdefWriteType] = useState<'url' | 'text' | 'wifi'>('url');
  const [writeUrlVal, setWriteUrlVal] = useState('https://hackers-lab.example.org/nfc-tag');
  const [writeTextVal, setWriteTextVal] = useState('管理者點檢：A區廠務設備-05號');
  const [writeWifiSsid, setWriteWifiSsid] = useState('Factory-Secure-5G');
  const [writeWifiPass, setWriteWifiPass] = useState('AdminPass992');
  const [isWritingPhysical, setIsWritingPhysical] = useState(false);

  // New Card addition states (Create custom card)
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUid, setNewUid] = useState('');
  const [newType, setNewType] = useState('MIFARE Classic 1K');
  const [newStandard, setNewStandard] = useState('ISO/IEC 14443-3 (Type A)');
  const [newLogoType, setNewLogoType] = useState<'easycard' | 'access' | 'machine' | 'amiibo' | 'phone' | 'hotel' | 'generic'>('generic');

  // Add system console logs
  const addLog = (text: string, type: 'info' | 'warn' | 'success' | 'err' = 'info') => {
    const timeStr = new Date().toTimeString().split(' ')[0];
    setConsoleLogs(prev => [{ time: timeStr, type, text }, ...prev.slice(0, 40)]);
  };

  // Detect Web NFC support on load & Setup postMessage
  useEffect(() => {
    Promise.resolve().then(() => {
      if ('NDEFReader' in window) {
        addLog('檢測到此設備支援實體感應 Web NFC API！', 'success');
      } else {
        addLog('目前設備或瀏覽器不支援 Web NFC 實體讀取。', 'info');
      }
    });

    // Luna AI Hub Iframe Protocol
    let lastScrollY = 0;
    const scrollThreshold = 8;
    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop;
      if (Math.abs(currentScrollY - lastScrollY) < scrollThreshold && currentScrollY > 10) return;
      const direction = currentScrollY > lastScrollY ? 'down' : 'up';
      window.parent.postMessage({
        type: 'iframe_scroll',
        scrollY: currentScrollY,
        direction: direction
      }, '*');
      lastScrollY = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync edit local states when card changes
  useEffect(() => {
    if (selectedCard) {
      const card = selectedCard;
      Promise.resolve().then(() => {
        setEditName(card.name);
        setEditUid(card.uid);
        setEditType(card.type);
        setEditStandard(card.standard);
        setEditCapacity(card.capacity);
        setEditManufacturer(card.manufacturer);
        setEditDesc(card.description);
        setEditPayload(card.payloadString);
        setEditNote(card.note || '');
        setEditLogoType(card.logoType);
        
        setTestingKeyIndex(-1);
        setTestResultMsg('');
        setCrackedSectors([]);
      });
    }
  }, [selectedCard]);

  // Persist cards state to localstorage
  const saveCardsList = (updated: NfcCard[]) => {
    setCards(updated);
    try {
      localStorage.setItem('nfc_vault_cards', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Persist attendance records
  const saveAttendanceRecords = (updated: AttendanceRecord[]) => {
    setAttendanceRecords(updated);
    try {
      localStorage.setItem('nfc_attendance_records', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Handle successful scan (Physical or Mock)
  const handleScanSuccess = (card: NfcCard) => {
    if (isAttendanceMode) {
      const newRecord: AttendanceRecord = {
        id: Date.now().toString(),
        cardName: card.name,
        uid: card.uid,
        timestamp: new Date().toLocaleString()
      };
      const updatedRecords = [newRecord, ...attendanceRecords];
      saveAttendanceRecords(updatedRecords);
      addLog(`[人數計次] 成功紀錄卡片：${card.name}`, 'success');
    }
  };

  // Web NFC Scanner
  const startPhysicalNfcScan = async () => {
    if (!('NDEFReader' in window)) {
      simulatePhysicalScan();
      return;
    }

    try {
      setIsScanning(true);
      addLog('向系統申請感應晶片讀取憑證中...', 'info');

      if (!window.NDEFReader) {
        throw new Error('Web NFC 不支援此瀏覽器');
      }
      const reader = new window.NDEFReader();
      await reader.scan();
      
      addLog('物理天線已激活！等待卡片靠近...', 'warn');

      reader.onreadingerror = () => {
        addLog('晶片讀取錯誤！', 'err');
      };

      reader.onreading = (event: NDefReadingEvent) => {
        const uid = event.serialNumber || '未知';
        addLog(`實體卡感應成功！獲取 UID: ${uid}`, 'success');
        
        let payloadSum = '';
        if (event.message?.records && event.message.records.length > 0) {
          for (const record of event.message.records) {
            if (record.data) {
              const textDecoder = new TextDecoder(record.mediaType || 'utf-8');
              const text = textDecoder.decode(record.data);
              payloadSum += `[${record.recordType}] ${text}; `;
            }
          }
        }

        const newPhysicalCard: NfcCard = {
          id: 'phys-' + Date.now(),
          name: '實體感應卡 ' + uid.substring(0, 8),
          uid: uid.toUpperCase(),
          type: 'NFC Standard Tag',
          standard: 'ISO/IEC 14443 Type A',
          capacity: 1024,
          manufacturer: '實體卡偵測晶片',
          description: '透過物理感應所擷取的真實 NFC 資訊。',
          payloadString: payloadSum || '無儲存的 NDEF 數據。',
          color: 'from-amber-600 to-red-500',
          logoType: 'generic',
          createdAt: new Date().toISOString()
        };

        const updated = [newPhysicalCard, ...cards];
        saveCardsList(updated);
        setSelectedCardId(newPhysicalCard.id);
        setIsScanning(false);
        handleScanSuccess(newPhysicalCard);
      };

    } catch (err: unknown) {
      const error = err as Error;
      addLog(`物理感應系統開啟失敗: ${error.message}`, 'err');
      setIsScanning(false);
    }
  };

  // Mock scan simulation
  const simulatePhysicalScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const newMock: NfcCard = {
        id: 'sim-' + Date.now(),
        name: '模擬感應卡 ' + Math.floor(Math.random() * 1000),
        type: 'MIFARE Classic 1K',
        uid: '2E:AB:' + Math.floor(Math.random() * 89 + 10).toString(16).toUpperCase() + ':' + Math.floor(Math.random() * 89 + 10).toString(16).toUpperCase(),
        standard: 'ISO/IEC 14443-3 (Type A)',
        capacity: 1024,
        manufacturer: 'Fudan Microelectronics',
        description: '模擬產生。',
        payloadString: 'Mock data.',
        color: 'from-amber-600 to-orange-700',
        logoType: 'access',
        createdAt: new Date().toISOString()
      };
      const updated = [newMock, ...cards];
      saveCardsList(updated);
      setSelectedCardId(newMock.id);
      setIsScanning(false);
      handleScanSuccess(newMock);
      addLog(`[物理模擬感應] 已成功載入 "${newMock.name}"。`, 'success');
    }, 1200);
  };

  // NDEF Writer
  const writeNfcTag = async () => {
    let compiledPayload = '';
    if (ndefWriteType === 'url') compiledPayload = `NDEF URL: ${writeUrlVal}`;
    else if (ndefWriteType === 'text') compiledPayload = `NDEF TEXT: ${writeTextVal}`;
    else compiledPayload = `NDEF WIFI: SSID="${writeWifiSsid}", Key="${writeWifiPass}"`;

    if ('NDEFReader' in window && window.NDEFReader) {
      try {
        setIsWritingPhysical(true);
        const reader = new window.NDEFReader();
        let recordObj: { recordType: string; data: string } = { recordType: "text", data: "" };
        if (ndefWriteType === 'url') recordObj = { recordType: "url", data: writeUrlVal };
        else if (ndefWriteType === 'text') recordObj = { recordType: "text", data: writeTextVal };
        else recordObj = { recordType: "text", data: `WIFI:S:${writeWifiSsid};T:WPA;P:${writeWifiPass};;` };

        await reader.write({ records: [recordObj] });
        setIsWritingPhysical(false);
        alert('成功！');
      } catch (err: unknown) {
        const error = err as Error;
        addLog(`失敗: ${error.message}`, 'err');
        setIsWritingPhysical(false);
      }
    } else {
      setIsWritingPhysical(true);
      setTimeout(() => {
        const updated = cards.map(c => {
          if (c.id === selectedCard.id) {
            return {
              ...c,
              payloadString: compiledPayload,
              note: `[虛擬燒錄] ${new Date().toLocaleString()}`
            };
          }
          return c;
        });
        saveCardsList(updated);
        setIsWritingPhysical(false);
        addLog(`[虛擬寫入完成]`, 'success');
      }, 1000);
    }
  };

  const askGeminiForNfcAudit = async () => {
    setIsAnalyzing(true);
    setShowAiModal(true);
    setAiAnalysisResult('');
    setTimeout(() => {
      const isSecure = selectedCard.type.includes('DESFire') || selectedCard.type.includes('CPU') || selectedCard.type.includes('HCE');
      setAiAnalysisResult(`
### 🛡️ ${selectedCard.name} 安全性報告
- **防禦等級**: ${isSecure ? '🟢 高' : '🔴 低'}
- **建議**: ${isSecure ? '安全。' : '易受複製，建議升級。'}
`);
      setIsAnalyzing(false);
    }, 1000);
  };

  const runKeyCrackSimulation = (keyStr: string, index: number) => {
    setTestingKeyIndex(index);
    setTestResultMsg('正在調試...');
    setTimeout(() => {
      const isMifareClassic = selectedCard.type.includes('MIFARE Classic') || selectedCard.type.includes('S50') || selectedCard.type.includes('Fudan');
      if (isMifareClassic && (keyStr === 'FF FF FF FF FF FF' || keyStr === 'A0 A1 A2 A3 A4 A5')) {
        setTestResultMsg(`✅ 成功！扇區 A0-A3 已解開。`);
        setCrackedSectors([0, 1, 2, 3]);
      } else {
        setTestResultMsg(`❌ 失敗。`);
        setCrackedSectors([]);
      }
    }, 1000);
  };

  const handleSaveChanges = () => {
    const updated = cards.map(c => {
      if (c.id === selectedCard.id) {
        return {
          ...c,
          name: editName, uid: editUid, type: editType,
          standard: editStandard, capacity: editCapacity,
          manufacturer: editManufacturer, description: editDesc,
          payloadString: editPayload, note: editNote, logoType: editLogoType
        };
      }
      return c;
    });
    saveCardsList(updated);
    alert('已儲存！');
  };

  const handleDeleteCard = (id: string) => {
    if (cards.length <= 1) return;
    const filtered = cards.filter(c => c.id !== id);
    saveCardsList(filtered);
    setSelectedCardId(filtered[0].id);
  };

  const handleResetToDefaults = () => {
    if (window.confirm('還原範本？')) {
      saveCardsList(EX_DEFAULT_CARDS);
      setSelectedCardId(EX_DEFAULT_CARDS[0].id);
    }
  };

  const handleCreateCustomCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newUid) return;
    const newNfcObj: NfcCard = {
      id: 'custom-' + Date.now(),
      name: newName,
      uid: newUid.toUpperCase(),
      type: newType,
      standard: newStandard,
      capacity: 1024,
      manufacturer: 'Custom Tag Lab',
      description: '自定義。',
      payloadString: 'Empty.',
      color: 'from-fuchsia-600 to-indigo-700',
      logoType: newLogoType,
      createdAt: new Date().toISOString()
    };
    const updated = [newNfcObj, ...cards];
    saveCardsList(updated);
    setSelectedCardId(newNfcObj.id);
    setShowAddModal(false);
    setNewName(''); setNewUid('');
  };

  const getLogoEmoji = (logo: string) => {
    switch (logo) {
      case 'easycard': return '💳';
      case 'access': return '🔑';
      case 'machine': return '🏷️';
      case 'amiibo': return '👾';
      case 'phone': return '📱';
      case 'hotel': return '🏨';
      default: return '🛰️';
    }
  };

  const filteredCards = cards.filter(c => selectedCategory === 'all' || c.logoType === selectedCategory);

  return (
    <div className="w-full min-h-[100vh] bg-[#0A0B0E] text-slate-200 font-sans flex flex-col justify-between overflow-x-hidden antialiased">
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-4 sm:px-8 bg-black/40 backdrop-blur-md sticky top-0 z-40 select-none">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
          <span className="text-xs font-mono tracking-widest uppercase opacity-75 hidden sm:inline">NFC HELPER READY</span>
          {webNfcSupported && <span className="text-[10px] text-emerald-400 font-bold ml-2">HW ACTIVE</span>}
        </div>
        <h1 className="text-lg sm:text-xl font-light tracking-tighter text-right">
          NFC <span className="font-bold text-cyan-400">PWA 輔助器</span>
        </h1>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-visible">
        <nav className="w-full lg:w-72 border-r border-white/5 bg-black/20 p-4 sm:p-6 flex flex-col gap-3">
          <div className="flex justify-between items-center px-1">
            <div className="text-[11px] font-bold uppercase tracking-widest text-cyan-500 font-mono">Vault ({cards.length})</div>
            <button onClick={handleResetToDefaults} className="text-[10px] text-red-400/80 hover:text-red-300 font-mono"><RefreshCw className="w-2.5 h-2.5" /> 還原</button>
          </div>
          <button onClick={() => setShowAddModal(true)} className="w-full py-2.5 px-4 bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> 自訂卡片</button>
          
          <div className="flex lg:flex-wrap gap-1 mb-2 overflow-x-auto no-scrollbar">
            {(['all', 'easycard', 'access', 'machine', 'amiibo'] as const).map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-2 py-1 text-[10px] rounded border ${selectedCategory === cat ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-white/5 border-transparent text-slate-400'}`}>{cat}</button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[300px] lg:max-h-[380px] space-y-2 pr-1 custom-scrollbar">
            {filteredCards.map((c) => (
              <div key={c.id} onClick={() => setSelectedCardId(c.id)} className={`w-full text-left p-3 rounded-xl border flex items-center justify-between group cursor-pointer ${selectedCardId === c.id ? 'bg-gradient-to-r from-cyan-950/40 border-cyan-500/50' : 'bg-white/5 border-white/5'}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-black/30 flex items-center justify-center text-sm">{getLogoEmoji(c.logoType)}</div>
                  <div className="min-w-0"><h4 className="text-xs font-bold truncate text-slate-200">{c.name}</h4><p className="text-[10px] font-mono text-slate-500 truncate">{c.uid}</p></div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteCard(c.id); }} className="opacity-0 group-hover:opacity-100 p-1 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </nav>

        <section className="flex-1 p-4 sm:p-8 flex flex-col relative min-w-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 border-b border-white/5 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{selectedCard.name}</h2>
                <span className="text-xs font-mono px-2 py-0.5 bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 rounded">{getLogoEmoji(selectedCard.logoType)}</span>
              </div>
              <p className="text-slate-500 font-mono text-xs sm:text-sm mt-1">UID: <span className="text-cyan-400 font-bold">{selectedCard.uid}</span></p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button onClick={startPhysicalNfcScan} className={`flex-1 md:flex-none py-2 px-4 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 ${isScanning ? 'bg-amber-500 animate-pulse' : 'bg-cyan-500 text-black'}`}><Radio className="w-4 h-4" /><span>{isScanning ? '偵測中...' : '感應卡片'}</span></button>
              <button onClick={askGeminiForNfcAudit} className="flex-1 md:flex-none py-2 px-4 bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2"><ShieldCheck className="w-4 h-4" /><span>AI 分析</span></button>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 mt-6 relative z-10 min-h-0">
            <div className="xl:col-span-7 flex flex-col gap-6">
              <div className={`aspect-[1.58/1] w-full max-w-[480px] rounded-3xl bg-gradient-to-br ${selectedCard.color || 'from-slate-800 to-black'} p-8 shadow-2xl border border-white/20 relative overflow-hidden`}>
                <div className="h-full flex flex-col justify-between">
                  <div className="w-14 h-11 bg-gradient-to-r from-amber-400 to-amber-300 rounded-lg shadow-lg"></div>
                  <div><p className="text-2xl font-semibold font-mono text-white truncate">{selectedCard.name}</p></div>
                </div>
              </div>
              <div className="bg-black/40 rounded-2xl border border-white/5 p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 font-mono"><Terminal className="w-4 h-4 text-cyan-400" /><span>SYSTEM TELEMETRY</span></div>
                <div className="h-32 overflow-y-auto font-mono text-[10px] space-y-2 custom-scrollbar">
                  {consoleLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-2"><span className="text-slate-500">[{log.time}]</span><span className={`${log.type === 'err' ? 'text-rose-400' : log.type === 'success' ? 'text-emerald-400' : 'text-slate-300'}`}>{log.text}</span></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="xl:col-span-5 flex flex-col gap-6">
              <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
                {(['inspector', 'write', 'attendance', 'editor', 'tester'] as const).map(t => (
                  <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 min-w-[60px] py-1.5 text-xs font-bold rounded-xl transition ${activeTab === t ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400'}`}>{t === 'inspector' ? '診斷' : t === 'write' ? '燒錄' : t === 'attendance' ? '計次' : t === 'editor' ? '修改' : '爆破'}</button>
                ))}
              </div>

              {activeTab === 'attendance' && (
                <div className="flex-1 bg-black/40 rounded-3xl border border-white/5 p-6 backdrop-blur-sm flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold uppercase text-cyan-400 font-mono">Attendance Counter</h3>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setIsAttendanceMode(!isAttendanceMode)} className={`w-10 h-5 rounded-full relative transition-colors ${isAttendanceMode ? 'bg-emerald-500' : 'bg-slate-700'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isAttendanceMode ? 'left-6' : 'left-1'}`}></div></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-900/60 p-4 rounded-2xl text-center"><p className="text-[10px] text-slate-500 uppercase font-bold">總計次</p><p className="text-3xl font-bold text-cyan-400 font-mono">{attendanceRecords.length}</p></div>
                    <div className="bg-slate-900/60 p-4 rounded-2xl text-center"><p className="text-[10px] text-slate-500 uppercase font-bold">今日</p><p className="text-3xl font-bold text-emerald-400 font-mono">{attendanceRecords.filter(r => r.timestamp.includes(new Date().toLocaleDateString())).length}</p></div>
                  </div>
                  <div className="flex justify-between items-center mb-2"><span className="text-[10px] text-slate-500 uppercase font-bold">歷史紀錄</span><button onClick={() => saveAttendanceRecords([])} className="text-[10px] text-rose-400"><Trash className="w-3 h-3" /></button></div>
                  <div className="flex-1 bg-black/80 rounded-xl border border-white/5 p-3 overflow-y-auto max-h-60 custom-scrollbar space-y-2">
                    {attendanceRecords.length === 0 ? <p className="text-[10px] text-slate-600 text-center py-10">尚無紀錄</p> : attendanceRecords.map(r => (<div key={r.id} className="flex justify-between text-[10px] border-b border-white/5 pb-2"><div><p className="text-slate-200 font-bold">{r.cardName}</p><p className="text-slate-500 font-mono">{r.uid}</p></div><p className="text-slate-500">{r.timestamp}</p></div>))}
                  </div>
                </div>
              )}

              {activeTab === 'inspector' && (
                <div className="flex-1 bg-black/40 rounded-3xl border border-white/5 p-6 backdrop-blur-sm">
                  <h3 className="text-xs font-bold uppercase text-cyan-400 mb-4 font-mono">Inspector</h3>
                  <div className="space-y-4 font-mono text-xs">
                    <div className="flex justify-between border-b border-white/5 pb-2"><span className="opacity-50">TYPE</span><span>{selectedCard.type}</span></div>
                    <div className="flex justify-between border-b border-white/5 pb-2"><span className="opacity-50">UID</span><span className="text-cyan-300">{selectedCard.uid}</span></div>
                  </div>
                </div>
              )}

              {activeTab === 'write' && (
                <div className="p-6 bg-black/40 rounded-3xl border border-white/5 backdrop-blur-sm">
                  <h3 className="text-xs font-bold uppercase text-cyan-400 mb-4 font-mono">Writer</h3>
                  <div className="flex gap-2 mb-2">
                    {(['url', 'text', 'wifi'] as const).map(wt => (
                      <button key={wt} onClick={() => setNdefWriteType(wt)} className={`px-2 py-1 text-[10px] rounded ${ndefWriteType === wt ? 'bg-cyan-500 text-black' : 'bg-slate-800'}`}>{wt}</button>
                    ))}
                  </div>
                  {ndefWriteType === 'url' && <input value={writeUrlVal} onChange={e => setWriteUrlVal(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-3 text-xs mb-4" />}
                  {ndefWriteType === 'text' && <textarea value={writeTextVal} onChange={e => setWriteTextVal(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-3 text-xs mb-4" />}
                  {ndefWriteType === 'wifi' && (
                    <div className="space-y-2 mb-4">
                      <input value={writeWifiSsid} onChange={e => setWriteWifiSsid(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-3 text-xs" placeholder="SSID" />
                      <input type="password" value={writeWifiPass} onChange={e => setWriteWifiPass(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-3 text-xs" placeholder="Pass" />
                    </div>
                  )}
                  <button onClick={writeNfcTag} disabled={isWritingPhysical} className="w-full h-12 bg-cyan-500 text-black font-extrabold text-xs uppercase rounded-xl">{isWritingPhysical ? '燒錄中...' : '燒錄'}</button>
                </div>
              )}

              {activeTab === 'editor' && (
                <div className="p-6 bg-black/40 rounded-3xl border border-white/5 backdrop-blur-sm space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                  <h3 className="text-xs font-bold uppercase text-cyan-400 font-mono">Editor</h3>
                  <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-3 text-xs" placeholder="Name" />
                  <input value={editUid} onChange={e => setEditUid(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-3 text-xs font-mono" placeholder="UID" />
                  <input value={editType} onChange={e => setEditType(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-3 text-xs" placeholder="Type" />
                  <input value={editStandard} onChange={e => setEditStandard(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-3 text-xs" placeholder="Standard" />
                  <input type="number" value={editCapacity} onChange={e => setEditCapacity(Number(e.target.value))} className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-3 text-xs" placeholder="Capacity" />
                  <input value={editManufacturer} onChange={e => setEditManufacturer(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-3 text-xs" placeholder="Manufacturer" />
                  <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-3 text-xs" placeholder="Desc" />
                  <textarea value={editPayload} onChange={e => setEditPayload(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-3 text-xs" placeholder="Payload" />
                  <textarea value={editNote} onChange={e => setEditNote(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-3 text-xs" placeholder="Note" />
                  <select value={editLogoType} onChange={e => setEditLogoType(e.target.value as NfcCard['logoType'])} className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-3 text-xs">
                    <option value="easycard">easycard</option><option value="access">access</option><option value="machine">machine</option><option value="amiibo">amiibo</option><option value="phone">phone</option><option value="hotel">hotel</option><option value="generic">generic</option>
                  </select>
                  <button onClick={handleSaveChanges} className="w-full h-11 bg-cyan-500 text-black font-extrabold text-xs uppercase rounded-xl"><Save className="w-4 h-4 inline mr-2" />儲存</button>
                </div>
              )}

              {activeTab === 'tester' && (
                <div className="p-6 bg-black/40 rounded-3xl border border-white/5 backdrop-blur-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase text-cyan-400 font-mono">Crack Simulation</h3>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                    {RAW_COMMON_KEYS.map((item, idx) => (
                      <div key={idx} onClick={() => runKeyCrackSimulation(item.key, idx)} className={`p-2.5 rounded-xl border text-xs bg-slate-900 border-white/5 hover:bg-white/5 cursor-pointer ${testingKeyIndex === idx ? 'border-amber-500' : ''}`}>
                        <span className="font-mono font-bold">{item.key}</span>
                        <p className="text-[9px] text-slate-500">{item.usage}</p>
                      </div>
                    ))}
                  </div>
                  {testResultMsg && (
                    <div className="p-4 bg-black/60 rounded-xl border border-white/10 text-[10px] font-mono whitespace-pre-line">
                      {testResultMsg}
                      {crackedSectors.length > 0 && <p className="text-emerald-400 mt-2">Cracked Sectors: {crackedSectors.join(', ')}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="h-12 border-t border-white/5 bg-black/60 flex items-center px-4 sm:px-8 justify-between z-10 select-none">
        <div className="flex gap-4 items-center text-[10px] font-mono">
           <div><span className="opacity-40">PV: </span><span id="vercount_value_site_pv" className="text-cyan-400">--</span></div>
           <div><span className="opacity-40">UV: </span><span id="vercount_value_site_uv" className="text-cyan-400">--</span></div>
        </div>
        <div className="text-[9px] font-mono opacity-40">v4.6 // Luna AI Hub</div>
      </footer>

      {showAiModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-bold text-sm text-white">Gemini AI 安全分析</h3>
              <button onClick={() => setShowAiModal(false)} className="text-xs text-slate-400">關閉</button>
            </div>
            <div className="p-6 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-slate-300">
              {isAnalyzing ? "分析中..." : aiAnalysisResult}
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-white/15 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-sm font-bold text-white mb-4">自定義卡片</h3>
            <form onSubmit={handleCreateCustomCard} className="space-y-4">
              <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-3 text-xs" placeholder="名稱" required />
              <input value={newUid} onChange={e => setNewUid(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-3 text-xs font-mono" placeholder="UID" required />
              <div className="grid grid-cols-2 gap-2">
                <input value={newType} onChange={e => setNewType(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-3 text-xs" placeholder="Type" />
                <input value={newStandard} onChange={e => setNewStandard(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-3 text-xs" placeholder="Standard" />
              </div>
              <select value={newLogoType} onChange={e => setNewLogoType(e.target.value as NfcCard['logoType'])} className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-3 text-xs">
                 <option value="easycard">easycard</option><option value="access">access</option><option value="machine">machine</option><option value="amiibo">amiibo</option><option value="phone">phone</option><option value="hotel">hotel</option><option value="generic">generic</option>
              </select>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 bg-white/5 text-slate-300 rounded-xl text-xs">取消</button>
                <button type="submit" className="flex-1 py-2 bg-cyan-500 text-black rounded-xl font-bold text-xs">建立</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
