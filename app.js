import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    doc, 
    updateDoc, 
    deleteDoc,
    onSnapshot,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// 1. FIREBASE ARCHITECTURE REFERENCE DOCK
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyCkDkK86iyNwWmdeY-GZHMVS8MwMZOBKIU",
    authDomain: "jkmms-79fb1.firebaseapp.com",
    projectId: "jkmms-79fb1",
    storageBucket: "jkmms-79fb1.firebasestorage.app",
    messagingSenderId: "701759230780",
    appId: "1:701759230780:web:5c2fc4a13d8bf11ab58439",
    measurementId: "G-P7N1FMX5D0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==========================================
// 2. RUNTIME APPLICATION STATE MATRIX
// ==========================================
let currentUserId = null;
let currentTabFilter = "all";
let todayFilterActive = false;
let globalDataArray = [];
let unsubscribeStream = null;
let selectedToolId = "subnet"; // Defaults tool engine frame container active module

// ==========================================
// FUN FEATURE & UI ENHANCEMENT 7: SYSTEMS
// ==========================================
function triggerToast(message, type = "info") {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `dynamic-glass px-4 py-3 rounded-xl border shadow-xl flex items-center gap-3 text-xs font-mono transition-all duration-300 transform translate-y-4 opacity-0 pointer-events-auto border-theme`;
    
    const icons = {
        success: '<i data-lucide="check-circle" class="w-4 h-4 text-emerald-400"></i>',
        error: '<i data-lucide="alert-triangle" class="w-4 h-4 text-rose-400"></i>',
        info: '<i data-lucide="info" class="w-4 h-4 text-theme"></i>',
        xp: '<i data-lucide="award" class="w-4 h-4 text-amber-400 animate-bounce"></i>'
    };
    
    toast.innerHTML = `${icons[type] || icons.info} <span class="text-slate-200 flex-1">${message}</span>`;
    container.appendChild(toast);
    lucide.createIcons();
    
    setTimeout(() => { toast.classList.remove('translate-y-4', 'opacity-0'); }, 10);
    setTimeout(() => {
        toast.classList.add('translate-y-[-20px]', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function calculateUserXP() {
    let xp = 0;
    globalDataArray.forEach(item => {
        if (item.completed) {
            if (item.priority === "High") xp += 25;
            else if (item.priority === "Medium") xp += 15;
            else xp += 10;
        }
    });

    const xpPerLevel = 100;
    const currentLevel = Math.floor(xp / xpPerLevel) + 1;
    const remainingXP = xp % xpPerLevel;

    document.getElementById('user-level').textContent = `LVL ${currentLevel}`;
    document.getElementById('user-xp-bar').style.width = `${remainingXP}%`;
}

// Localization Matrix Dictionaries
const locales = {
    en: {
        total: "Total Items", completed: "Completed", efficiency: "Efficiency", today: "Due Today",
        matrixTitle: "New Entry Matrix", fieldDesc: "Description / Title", fieldCat: "Category",
        fieldPriority: "Priority", fieldDate: "Target Date", btnSubmit: "Commit Entry",
        streamHead: "Everything Stream", filterAll: "Unfiltered", filterActive: "Active", filterComp: "Completed"
    },
    ar: {
        total: "إجمالي العناصر", completed: "المكتملة", efficiency: "الكفاءة", today: "المستحق اليوم",
        matrixTitle: "مصفوفة إدخال جديدة", fieldDesc: "الوصف / العنوان", fieldCat: "الفئة",
        fieldPriority: "الأولوية", fieldDate: "تاريخ الاستحقاق", btnSubmit: "تسجيل البيانات",
        streamHead: "تدفق البيانات العام", filterAll: "بدون تصفية", filterActive: "النشطة", filterComp: "المكتملة"
    },
    ku: {
        total: "گشتی بڕگەکان", completed: "تەواوکراو", efficiency: "کارایی", today: "بۆ ئەمڕۆ",
        matrixTitle: "ماتریسی تۆمارکردنی نوێ", fieldDesc: "وەسف / ناونیشان", fieldCat: "پۆلێن",
        fieldPriority: "لەپێشینەیی", fieldDate: "ڕێکەوتی مەبەست", btnSubmit: "جێگیرکردنی تۆمار",
        streamHead: "ڕەوتی گشتی زانیارییەکان", filterAll: "بێ پاڵاوتن", filterActive: "چالاکەکان", filterComp: "تەواوکراوەکان"
    }
};

// Core Theme Dynamic Layer Engine
function applyTheme(themeClassName) {
    const body = document.getElementById('main-body');
    body.className = body.className.replace(/theme-\w+/g, '').trim();
    const targetedTheme = themeClassName || 'theme-slate';
    body.classList.add(targetedTheme);
    body.style.backgroundColor = "var(--theme-bg)";
    localStorage.setItem('lifeos-theme', targetedTheme);
    renderToolsPanel(); // Refresh tool color contexts
}

// Auth Observer Pipeline Router
onAuthStateChanged(auth, (user) => {
    const authScreen = document.getElementById('auth-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const userDisplay = document.getElementById('user-display');

    if (user) {
        currentUserId = user.uid;
        userDisplay.textContent = user.email.split('@')[0];
        
        const savedTheme = localStorage.getItem('lifeos-theme') || 'theme-slate';
        document.getElementById('global-theme-select').value = savedTheme;
        applyTheme(savedTheme);

        const savedLang = localStorage.getItem('lifeos-lang') || 'en';
        document.getElementById('global-lang-select').value = savedLang;
        applyLocalization(savedLang);

        authScreen.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            authScreen.classList.add('hidden');
            dashboardScreen.classList.remove('hidden');
            setTimeout(() => dashboardScreen.classList.remove('opacity-0', 'translate-y-2'), 50);
        }, 400);

        fetchDataStream();
        buildToolsMenu();
        renderToolsPanel();
    } else {
        currentUserId = null;
        if (unsubscribeStream) unsubscribeStream();
        dashboardScreen.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => {
            dashboardScreen.classList.add('hidden');
            authScreen.classList.remove('hidden');
            setTimeout(() => authScreen.classList.remove('opacity-0', 'pointer-events-none'), 50);
        }, 400);
    }
});

// Authentication Shell Action Handlers
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-username').value;
    const pass = document.getElementById('login-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        triggerToast("Workspace authentication layer mounted successfully.", "success");
    } catch (err) {
        triggerToast("Access Denied: Invalid Security Token Keys.", "error");
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    if (unsubscribeStream) unsubscribeStream();
    signOut(auth);
    triggerToast("Workspace framework successfully unmounted.", "info");
});

// Real-Time Secure Stream Pipe
async function fetchDataStream() {
    if (!currentUserId) return;
    if (unsubscribeStream) unsubscribeStream();

    try {
        const q = query(collection(db, `users/${currentUserId}/items`), orderBy("createdAt", "desc"));
        unsubscribeStream = onSnapshot(q, (snapshot) => {
            globalDataArray = [];
            snapshot.forEach(doc => { globalDataArray.push({ id: doc.id, ...doc.data() }); });
            renderStreamContainer();
            calculateUserXP();
        }, (err) => {
            console.error("Critical Interruption Error Mapping Core Stream Pipeline:", err);
        });
    } catch (err) {
        triggerToast("Dynamic Pipeline Connection Failure.", "error");
    }
}

document.getElementById('item-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUserId) return;

    const newItem = {
        title: document.getElementById('item-title').value,
        category: document.getElementById('item-category').value,
        priority: document.getElementById('item-priority').value,
        dueDate: document.getElementById('item-duedate').value || "",
        completed: false,
        createdAt: new Date().toISOString()
    };

    try {
        await addDoc(collection(db, `users/${currentUserId}/items`), newItem);
        document.getElementById('item-form').reset();
        triggerToast("Data segment successfully committed to pipeline.", "success");
    } catch (err) {
        triggerToast("Pipeline write process failed.", "error");
    }
});

window.toggleItemComplete = async (id, currentStatus) => {
    try {
        const docRef = doc(db, `users/${currentUserId}/items`, id);
        await updateDoc(docRef, { completed: !currentStatus });
        if(!currentStatus) {
            triggerToast("Node Resolved! Gained System Architecture XP.", "xp");
        }
    } catch (err) {
        console.error("Mutation Sync Failure:", err);
    }
};

window.deleteItemRecord = async (id) => {
    if (!confirm("Confirm immediate absolute array disposal?")) return;
    try {
        await deleteDoc(doc(db, `users/${currentUserId}/items`, id));
        triggerToast("Data node securely dropped and purged.", "info");
    } catch (err) {
        console.error("Disposal Error Execution Tree:", err);
    }
};

// UI Render Engine Matrix Formatting
function renderStreamContainer() {
    const stream = document.getElementById('data-stream');
    const searchTerm = document.getElementById('search-bar').value.toLowerCase();
    const completionFilter = document.getElementById('completion-filter').value;
    const todayStr = new Date().toISOString().split('T')[0];

    let total = globalDataArray.length;
    let completed = globalDataArray.filter(i => i.completed).length;
    let efficiency = total > 0 ? Math.round((completed / total) * 100) : 0;
    let dueTodayCount = globalDataArray.filter(i => i.dueDate === todayStr && !i.completed).length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-completed').textContent = completed;
    document.getElementById('stat-efficiency').textContent = `${efficiency}%`;
    document.getElementById('stat-today').textContent = dueTodayCount;

    const todayCard = document.getElementById('stat-today-card');
    const todayIconBg = document.getElementById('stat-today-icon-bg');
    if (todayFilterActive) {
        todayCard.classList.add('border-theme-active', 'bg-theme-opacity');
        todayIconBg.classList.add('text-theme');
    } else {
        todayCard.classList.remove('border-theme-active', 'bg-theme-opacity');
        todayIconBg.classList.remove('text-theme');
    }

    let filtered = globalDataArray.filter(item => {
        const matchesTab = currentTabFilter === "all" || item.category === currentTabFilter;
        const matchesSearch = item.title.toLowerCase().includes(searchTerm);
        const matchesToday = !todayFilterActive || item.dueDate === todayStr;
        
        let matchesComp = true;
        if (completionFilter === "active") matchesComp = !item.completed;
        if (completionFilter === "completed") matchesComp = item.completed;

        return matchesTab && matchesSearch && matchesComp && matchesToday;
    });

    document.getElementById('counter-badge').textContent = `${filtered.length} Arrays`;
    stream.innerHTML = "";

    if (filtered.length === 0) {
        // UI Enhancement 8: Creative Empty State Layout
        stream.innerHTML = `
            <div class="col-span-full dynamic-glass p-12 rounded-xl border border-dashed border-slate-800/80 flex flex-col items-center justify-center text-center">
                <div class="p-3 bg-slate-950/80 text-slate-700 rounded-2xl border border-slate-900 mb-3 skeleton-pulse">
                    <i data-lucide="binary" class="w-6 h-6"></i>
                </div>
                <p class="text-xs text-slate-400 font-mono tracking-wide">Null Vector Return</p>
                <p class="text-[10px] text-slate-600 font-mono mt-1">No execution strings fall within the active query filter bounds.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    filtered.forEach(item => {
        const priorityStyles = {
            High: { colors: "text-rose-400 bg-rose-500/10 border-rose-500/20", border: "border-l-4 border-l-rose-500" },
            Medium: { colors: "text-amber-400 bg-amber-500/10 border-amber-500/20", border: "border-l-4 border-l-amber-500" },
            Low: { colors: "text-slate-400 bg-slate-500/10 border-slate-500/20", border: "border-l-4 border-l-slate-600" }
        }[item.priority || "Medium"];

        const isOverdue = item.dueDate && item.dueDate < todayStr && !item.completed;
        const isDueToday = item.dueDate === todayStr && !item.completed;
        
        // UI Enhancement 10: Structural Pulse Date Rules
        let datePulseClass = "text-slate-500 border-slate-800 bg-slate-950/40";
        if (isOverdue) datePulseClass = "text-rose-400 border-rose-500/20 bg-rose-500/5 animate-pulse";
        if (isDueToday) datePulseClass = "text-theme border-theme bg-theme-opacity animate-pulse";

        const card = document.createElement('div');
        card.className = `dynamic-glass p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between gap-3 shadow-sm hover:translate-y-[-2px] ${priorityStyles.border} ${item.completed ? 'border-slate-950/40 opacity-40' : 'border-slate-800/60 hover:border-slate-700'}`;
        
        card.innerHTML = `
            <div class="flex items-start gap-3">
                <button onclick="window.toggleItemComplete('${item.id}', ${item.completed})" class="mt-0.5 shrink-0 transition-colors interactive-btn ${item.completed ? 'text-emerald-400' : 'text-slate-600 hover:text-theme'}">
                    <i data-lucide="${item.completed ? 'shield-check' : 'square'}" class="w-4 h-4"></i>
                </button>
                <div class="min-w-0 flex-1">
                    <p class="text-xs font-medium text-slate-200 break-words leading-relaxed tracking-wide ${item.completed ? 'line-through text-slate-500' : ''}">${item.title}</p>
                    <div class="flex flex-wrap gap-1.5 mt-2.5 items-center">
                        <span class="text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-900 bg-slate-950/80 text-slate-400 tracking-tight">${item.category}</span>
                        <span class="text-[9px] font-mono px-1.5 py-0.5 rounded border ${priorityStyles.colors} tracking-tight">${item.priority}</span>
                        ${item.dueDate ? `
                            <span class="text-[9px] font-mono px-1.5 py-0.5 rounded border flex items-center gap-1 tracking-tight ${datePulseClass}">
                                <i data-lucide="clock" class="w-2.5 h-2.5"></i>${item.dueDate}
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
            <div class="flex items-center justify-end border-t border-slate-900/60 pt-2 mt-1">
                <button onclick="window.deleteItemRecord('${item.id}')" class="text-slate-600 hover:text-rose-400 p-1 transition-colors rounded interactive-btn">
                    <i data-lucide="trash" class="w-3.5 h-3.5"></i>
                </button>
            </div>
        `;
        stream.appendChild(card);
    });

    lucide.createIcons();
}

// Multi-Language Architecture Realignment Mapping Engine
function applyLocalization(langCode) {
    const dict = locales[langCode] || locales.en;
    localStorage.setItem('lifeos-lang', langCode);

    document.getElementById('lbl-stat-total').textContent = dict.total;
    document.getElementById('lbl-stat-completed').textContent = dict.completed;
    document.getElementById('lbl-stat-efficiency').textContent = dict.efficiency;
    document.getElementById('stat-today-label').textContent = dict.today;
    document.getElementById('lbl-matrix-title').textContent = dict.matrixTitle;
    document.getElementById('lbl-field-desc').textContent = dict.fieldDesc;
    document.getElementById('lbl-field-cat').textContent = dict.fieldCat;
    document.getElementById('lbl-field-priority').textContent = dict.fieldPriority;
    document.getElementById('lbl-field-date').textContent = dict.fieldDate;
    document.getElementById('lbl-btn-submit').textContent = dict.btnSubmit;
    document.getElementById('stream-heading').textContent = dict.streamHead;
    
    document.getElementById('opt-filter-all').textContent = dict.filterAll;
    document.getElementById('opt-filter-active').textContent = dict.filterActive;
    document.getElementById('opt-filter-comp').textContent = dict.filterComp;

    const dashboard = document.getElementById('dashboard-screen');
    
    // UI Enhancement 1: Clean Dynamic Directional Layout Scaling Rules
    if (langCode === 'ar' || langCode === 'ku') {
        dashboard.dir = "rtl";
        dashboard.classList.add('font-ibm-plex');
        dashboard.style.fontSize = "15px"; 
    } else {
        dashboard.dir = "ltr";
        dashboard.classList.remove('font-ibm-plex');
        dashboard.style.fontSize = "14px"; 
    }
}

window.switchTab = (tabName) => {
    currentTabFilter = tabName;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.className = "tab-btn text-xs font-medium px-3 py-1.5 rounded-lg transition-all shrink-0 text-slate-400 hover:text-slate-200 border border-transparent font-mono";
    });
    const activeBtn = document.getElementById(`tab-${tabName}`);
    if (activeBtn) {
        activeBtn.className = "tab-btn text-xs font-medium px-3 py-1.5 rounded-lg transition-all shrink-0 bg-theme-opacity text-theme border border-theme font-mono";
    }
    renderStreamContainer();
};

window.toggleTodayFilter = () => {
    todayFilterActive = !todayFilterActive;
    renderStreamContainer();
};

document.getElementById('global-theme-select').addEventListener('change', (e) => applyTheme(e.target.value));
document.getElementById('global-lang-select').addEventListener('change', (e) => applyLocalization(e.target.value));
document.getElementById('search-bar').addEventListener('input', renderStreamContainer);
document.getElementById('completion-filter').addEventListener('change', renderStreamContainer);

// ========================================================
// 4. CLIENT WORKBENCH MODULE IMPLEMENTATIONS (20 TOOLS)
// ========================================================
const toolsRegistry = {
    subnet: {
        title: "Subnet Calculator", icon: "network",
        render: () => `
            <div class="space-y-3">
                <div class="grid grid-cols-2 gap-2">
                    <input type="text" id="tool-ip" class="bg-slate-950 p-2 border border-slate-800 rounded text-xs focus:outline-none focus:border-theme" placeholder="IP (e.g. 192.168.1.1)">
                    <input type="number" id="tool-cidr" class="bg-slate-950 p-2 border border-slate-800 rounded text-xs focus:outline-none focus:border-theme" placeholder="CIDR (e.g. 24)">
                </div>
                <button id="run-subnet" class="bg-slate-900 border border-slate-800 hover:border-theme text-xs font-mono px-3 py-2 rounded text-slate-300">Compute Mask</button>
                <pre id="subnet-out" class="bg-slate-950 p-3 rounded text-xs border border-slate-900 text-emerald-400 overflow-x-auto min-h-[80px] mt-2">Outputs will compute here...</pre>
            </div>
        `,
        action: () => {
            document.getElementById('run-subnet').addEventListener('click', () => {
                const ip = document.getElementById('tool-ip').value.trim();
                const cidr = parseInt(document.getElementById('tool-cidr').value);
                if(!ip || isNaN(cidr)) return;
                const mask = Array(4).fill(0).map((_, i) => {
                    const bits = Math.min(Math.max(cidr - i * 8, 0), 8);
                    return 256 - Math.pow(2, 8 - bits);
                }).join('.');
                document.getElementById('subnet-out').textContent = `IP Range Node: ${ip}\nCalculated Subnet Mask Network Target: ${mask}\nMax Valid Partition Nodes: ${Math.pow(2, 32 - cidr) - 2}`;
            });
        }
    },
    base64: {
        title: "Base64 Encoder", icon: "binary",
        render: () => `
            <div class="space-y-3">
                <textarea id="tool-b64-in" class="w-full h-24 bg-slate-950 p-2 border border-slate-800 rounded text-xs" placeholder="Input string data..."></textarea>
                <div class="flex gap-2">
                    <button id="run-b64-enc" class="bg-slate-900 border border-slate-800 hover:border-theme text-xs p-2 rounded">Encode</button>
                    <button id="run-b64-dec" class="bg-slate-900 border border-slate-800 hover:border-theme text-xs p-2 rounded">Decode</button>
                </div>
                <textarea id="tool-b64-out" readonly class="w-full h-24 bg-slate-950 p-2 border border-slate-900 text-theme rounded text-xs" placeholder="Result output..."></textarea>
            </div>
        `,
        action: () => {
            document.getElementById('run-b64-enc').addEventListener('click', () => {
                document.getElementById('tool-b64-out').value = btoa(document.getElementById('tool-b64-in').value);
            });
            document.getElementById('run-b64-dec').addEventListener('click', () => {
                try { document.getElementById('tool-b64-out').value = atob(document.getElementById('tool-b64-in').value); }
                catch(e) { document.getElementById('tool-b64-out').value = "Error decoding string target data."; }
            });
        }
    },
    url: {
        title: "URL Parser Engine", icon: "link-2",
        render: () => `
            <div class="space-y-3">
                <input type="text" id="tool-url-in" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs" placeholder="Target URL string...">
                <div class="flex gap-2">
                    <button id="run-url-enc" class="bg-slate-900 border border-slate-800 text-xs p-2 rounded">Sanitize Encode</button>
                    <button id="run-url-dec" class="bg-slate-900 border border-slate-800 text-xs p-2 rounded">Extract Decode</button>
                </div>
                <input type="text" id="tool-url-out" readonly class="w-full bg-slate-950 p-2 border border-slate-900 text-theme text-xs rounded">
            </div>
        `,
        action: () => {
            document.getElementById('run-url-enc').addEventListener('click', () => { document.getElementById('tool-url-out').value = encodeURIComponent(document.getElementById('tool-url-in').value); });
            document.getElementById('run-url-dec').addEventListener('click', () => { document.getElementById('tool-url-out').value = decodeURIComponent(document.getElementById('tool-url-in').value); });
        }
    },
    password: {
        title: "Token / Key Gen", icon: "key-round",
        render: () => `
            <div class="space-y-3">
                <div class="flex items-center gap-2">
                    <label class="text-xs text-slate-400">Len:</label>
                    <input type="number" id="tool-pass-len" value="16" class="w-16 bg-slate-950 p-1 border border-slate-800 text-xs rounded">
                </div>
                <button id="run-pass" class="bg-slate-900 border border-slate-800 text-xs p-2 rounded">Generate Architecture Key</button>
                <input type="text" id="tool-pass-out" readonly class="w-full bg-slate-950 p-2 border border-slate-900 text-emerald-400 text-xs rounded font-mono">
            </div>
        `,
        action: () => {
            document.getElementById('run-pass').addEventListener('click', () => {
                const len = parseInt(document.getElementById('tool-pass-len').value) || 16;
                const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~";
                let pass = "";
                for(let i=0; i<len; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
                document.getElementById('tool-pass-out').value = pass;
            });
        }
    },
    json: {
        title: "JSON Validator", icon: "braces",
        render: () => `
            <div class="space-y-3">
                <textarea id="tool-json-in" class="w-full h-32 bg-slate-950 p-2 border border-slate-800 rounded text-xs font-mono" placeholder="Paste minified raw JSON structural string..."></textarea>
                <button id="run-json" class="bg-slate-900 border border-slate-800 text-xs p-2 rounded">Lint & Format</button>
                <pre id="tool-json-out" class="bg-slate-950 p-2 rounded text-xs border border-slate-900 max-h-32 overflow-y-auto text-slate-300"></pre>
            </div>
        `,
        action: () => {
            document.getElementById('run-json').addEventListener('click', () => {
                try {
                    const parsed = JSON.parse(document.getElementById('tool-json-in').value);
                    document.getElementById('tool-json-out').textContent = JSON.stringify(parsed, null, 2);
                    document.getElementById('tool-json-out').style.color = "#10b981";
                } catch(e) {
                    document.getElementById('tool-json-out').textContent = "Invalid Syntax Structure Mapping Error Matrix:\n" + e.message;
                    document.getElementById('tool-json-out').style.color = "#f43f5e";
                }
            });
        }
    },
    jwt: {
        title: "JWT Decoder Payload", icon: "shield-alert",
        render: () => `
            <div class="space-y-3">
                <input type="text" id="tool-jwt-in" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs font-mono" placeholder="Bearer eyJhbGci...">
                <button id="run-jwt" class="bg-slate-900 border border-slate-800 text-xs p-2 rounded">Extract Segments</button>
                <pre id="tool-jwt-out" class="bg-slate-950 p-2 border border-slate-900 rounded text-xs max-h-32 overflow-y-auto text-amber-400"></pre>
            </div>
        `,
        action: () => {
            document.getElementById('run-jwt').addEventListener('click', () => {
                const parts = document.getElementById('tool-jwt-in').value.split('.');
                if(parts.length < 2) { document.getElementById('tool-jwt-out').textContent = "Invalid token shape structure configuration rules."; return; }
                try {
                    const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
                    document.getElementById('tool-jwt-out').textContent = JSON.stringify(JSON.parse(payload), null, 2);
                } catch(e) { document.getElementById('tool-jwt-out').textContent = "Signature or Payload read conversion fault error."; }
            });
        }
    },
    epoch: {
        title: "Epoch Time Converter", icon: "calendar-clock",
        render: () => `
            <div class="space-y-2">
                <input type="text" id="tool-epoch-in" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs" placeholder="Unix Epoch Target Stamp (e.g. 1715783200)">
                <button id="run-epoch" class="bg-slate-900 border border-slate-800 text-xs p-2 rounded">Translate Epoch</button>
                <div id="tool-epoch-out" class="text-xs text-theme font-mono p-1"></div>
            </div>
        `,
        action: () => {
            document.getElementById('run-epoch').addEventListener('click', () => {
                const val = parseInt(document.getElementById('tool-epoch-in').value);
                if(isNaN(val)) return;
                document.getElementById('tool-epoch-out').textContent = new Date(val * 1000).toUTCString();
            });
        }
    },
    hash: {
        title: "Crypto Mock Hasher", icon: "fingerprint",
        render: () => `
            <div class="space-y-3">
                <input type="text" id="tool-hash-in" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs" placeholder="Source data line input string...">
                <button id="run-hash" class="bg-slate-900 border border-slate-800 text-xs p-2 rounded">Compute Hashing Blocks</button>
                <div class="text-[11px] text-slate-400 space-y-1 bg-slate-950 p-2 border border-slate-900 rounded">
                    <p>SHA-256 Checksum Segment Mock Buffer: <span id="hash-out-256" class="text-theme break-all"></span></p>
                </div>
            </div>
        `,
        action: () => {
            document.getElementById('run-hash').addEventListener('click', () => {
                const str = document.getElementById('tool-hash-in').value;
                // Client calculation string conversion representation maps
                let mockHash = Array.from(str).reduce((acc, char) => acc + char.charCodeAt(0), 0).toString(16).padEnd(64, 'a');
                document.getElementById('hash-out-256').textContent = "0x" + mockHash.slice(0,62);
            });
        }
    },
    uuid: {
        title: "UUID v4 Compiler", icon: "fingerprint",
        render: () => `
            <div class="space-y-2">
                <button id="run-uuid" class="bg-slate-900 border border-slate-800 text-xs p-2 rounded">Generate System Guid Block</button>
                <input type="text" id="tool-uuid-out" readonly class="w-full bg-slate-950 p-2 border border-slate-900 text-xs text-emerald-400 rounded">
            </div>
        `,
        action: () => {
            document.getElementById('run-uuid').addEventListener('click', () => {
                const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
                document.getElementById('tool-uuid-out').value = uuid;
            });
        }
    },
    cron: {
        title: "Cron Descriptor", icon: "clock-3",
        render: () => `
            <div class="space-y-2">
                <input type="text" id="tool-cron" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs" value="*/5 * * * *">
                <button id="run-cron" class="bg-slate-900 border border-slate-800 text-xs p-2 rounded">Decode Matrix Routine</button>
                <div id="tool-cron-out" class="text-xs text-amber-400 font-mono mt-1"></div>
            </div>
        `,
        action: () => {
            document.getElementById('run-cron').addEventListener('click', () => {
                const val = document.getElementById('tool-cron').value;
                document.getElementById('tool-cron-out').textContent = `Execution Rule: Triggers automatically at intervals matched by index segment [${val}]. Runs locally within scheduling microtasks.`;
            });
        }
    },
    case: {
        title: "Case Swapper Layout", icon: "type",
        render: () => `
            <div class="space-y-2">
                <input type="text" id="tool-case-in" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs" placeholder="Text string processing...">
                <div class="flex gap-2">
                    <button id="run-camel" class="bg-slate-900 border border-slate-800 text-xs p-1.5 rounded">camelCase</button>
                    <button id="run-snake" class="bg-slate-900 border border-slate-800 text-xs p-1.5 rounded">snake_case</button>
                </div>
                <input type="text" id="tool-case-out" readonly class="w-full bg-slate-950 p-2 border border-slate-900 text-theme text-xs rounded">
            </div>
        `,
        action: () => {
            document.getElementById('run-camel').addEventListener('click', () => {
                const str = document.getElementById('tool-case-in').value;
                document.getElementById('tool-case-out').value = str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => index === 0 ? match.toLowerCase() : match.toUpperCase()).replace(/\s+/g, '');
            });
            document.getElementById('run-snake').addEventListener('click', () => {
                document.getElementById('tool-case-out').value = document.getElementById('tool-case-in').value.toLowerCase().replace(/\s+/g, '_');
            });
        }
    },
    metrics: {
        title: "Text Analytics Engine", icon: "text-cursor-input",
        render: () => `
            <div class="space-y-2">
                <textarea id="tool-metric-in" class="w-full h-20 bg-slate-950 p-2 border border-slate-800 rounded text-xs" placeholder="Type array lines to evaluate..."></textarea>
                <pre id="tool-metric-out" class="text-[11px] text-emerald-400 bg-slate-950 p-2 border border-slate-900 rounded font-mono">Lines: 0 | Words: 0 | Chars: 0</pre>
            </div>
        `,
        action: () => {
            document.getElementById('tool-metric-in').addEventListener('input', (e) => {
                const text = e.target.value;
                const lines = text.split('\n').filter(Boolean).length;
                const words = text.trim().split(/\s+/).filter(Boolean).length;
                document.getElementById('tool-metric-out').textContent = `Lines Array Count: ${lines} | Word Extraction Size: ${words} | Absolute String Length: ${text.length}`;
            });
        }
    },
    regex: {
        title: "Regex Diagnostic Monitor", icon: "code",
        render: () => `
            <div class="space-y-2">
                <div class="grid grid-cols-2 gap-2">
                    <input type="text" id="tool-reg-exp" class="bg-slate-950 p-2 border border-slate-800 text-xs rounded" placeholder="Expression (e.g. [a-z]+)">
                    <input type="text" id="tool-reg-str" class="bg-slate-950 p-2 border border-slate-800 text-xs rounded" placeholder="Test Line String">
                </div>
                <button id="run-regex" class="bg-slate-900 border border-slate-800 text-xs p-2 rounded">Validate Evaluation Mapping</button>
                <div id="tool-regex-out" class="text-xs font-mono"></div>
            </div>
        `,
        action: () => {
            document.getElementById('run-regex').addEventListener('click', () => {
                try {
                    const rx = new RegExp(document.getElementById('tool-reg-exp').value);
                    const match = rx.test(document.getElementById('tool-reg-str').value);
                    document.getElementById('tool-regex-out').textContent = match ? "Verification Status: MATCH SECURED" : "Verification Status: NULL MISMATCH";
                    document.getElementById('tool-regex-out').style.color = match ? "#10b981" : "#f43f5e";
                } catch(e) { document.getElementById('tool-regex-out').textContent = "Pattern Evaluation Exception Fault Error."; }
            });
        }
    },
    html: {
        title: "HTML Character Entity Sanitizer", icon: "code-2",
        render: () => `
            <div class="space-y-2">
                <input type="text" id="tool-html-in" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs" placeholder="<div>Node Array Context</div>">
                <button id="run-html" class="bg-slate-900 border border-slate-800 text-xs p-2 rounded">Sanitize Special Entities</button>
                <input type="text" id="tool-html-out" readonly class="w-full bg-slate-950 p-2 border border-slate-900 text-theme text-xs rounded">
            </div>
        `,
        action: () => {
            document.getElementById('run-html').addEventListener('click', () => {
                const str = document.getElementById('tool-html-in').value;
                document.getElementById('tool-html-out').value = str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
            });
        }
    },
    dns: {
        title: "Zone Record Mock Sandbox", icon: "globe",
        render: () => `
            <div class="space-y-2">
                <input type="text" id="tool-dns-in" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs" value="jkmms.net">
                <button id="run-dns" class="bg-slate-900 border border-slate-800 text-xs p-2 rounded">Simulate DNS Extraction Queries</button>
                <pre id="tool-dns-out" class="text-xs font-mono text-slate-400 bg-slate-950 p-2 border border-slate-900 rounded">Click compile loop route...</pre>
            </div>
        `,
        action: () => {
            document.getElementById('run-dns').addEventListener('click', () => {
                const domain = document.getElementById('tool-dns-in').value;
                document.getElementById('tool-dns-out').textContent = `${domain}.  IN  A      104.24.42.12\n${domain}.  IN  AAAA   2606:4700:3030::6818:2a0c\n${domain}.  IN  MX 10  mail.protection.outlook.com.`;
            });
        }
    },
    color: {
        title: "Hex Coordinates Translator", icon: "palette",
        render: () => `
            <div class="space-y-2">
                <input type="text" id="tool-hex" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs" value="#6366f1">
                <button id="run-color" class="bg-slate-900 border border-slate-800 text-xs p-2 rounded">Deconstruct Vector Coordinates</button>
                <div id="tool-color-out" class="text-xs text-theme font-mono"></div>
            </div>
        `,
        action: () => {
            document.getElementById('run-color').addEventListener('click', () => {
                let hex = document.getElementById('tool-hex').value.replace('#','');
                if(hex.length === 3) hex = hex.split('').map(c => c+c).join('');
                const r = parseInt(hex.substring(0,2), 16), g = parseInt(hex.substring(2,4), 16), b = parseInt(hex.substring(4,6), 16);
                document.getElementById('tool-color-out').textContent = isNaN(r) ? "Invalid hexadecimal length format rule." : `Computed Coordinates Matrix values -> RGB(${r}, ${g}, ${b}) | Node opacity string vector maps: rgba(${r}, ${g}, ${b}, 0.15)`;
            });
        }
    },
    shadow: {
        title: "Box-Shadow Element Sandbox", icon: "layers",
        render: () => `
            <div class="space-y-2">
                <input type="range" id="tool-sh-blur" min="0" max="50" value="16" class="w-full accent-indigo-500">
                <button id="run-shadow" class="bg-slate-900 border border-slate-800 text-xs p-2 rounded">Compile Element Shadow Rule CSS</button>
                <input type="text" id="tool-shadow-out" readonly class="w-full bg-slate-950 p-2 border border-slate-900 text-xs text-amber-400 font-mono rounded">
            </div>
        `,
        action: () => {
            document.getElementById('run-shadow').addEventListener('click', () => {
                const b = document.getElementById('tool-sh-blur').value;
                document.getElementById('tool-shadow-out').value = `box-shadow: 0 4px ${b}px 0 rgba(0, 0, 0, 0.4);`;
            });
        }
    },
    markdown: {
        title: "Markdown Text Previewer Engine", icon: "file-text",
        render: () => `
            <div class="space-y-2">
                <textarea id="tool-md-in" class="w-full h-20 bg-slate-950 p-2 border border-slate-800 rounded text-xs font-mono" placeholder="## System Specs\n* Node core online..."></textarea>
                <button id="run-md" class="bg-slate-900 border border-slate-800 text-xs p-2 rounded">Render Strings</button>
                <div id="tool-md-out" class="bg-slate-950 p-2 border border-slate-900 rounded text-xs text-slate-300 max-h-24 overflow-y-auto"></div>
            </div>
        `,
        action: () => {
            document.getElementById('run-md').addEventListener('click', () => {
                const val = document.getElementById('tool-md-in').value;
                // Basic structural text compiler routing map logic
                let html = val.replace(/##\s+(.*)/g, '<h4 class="font-bold text-theme font-mono mt-1">$1</h4>').replace(/\*\s+(.*)/g, '<li class="ml-2 font-mono text-[11px] list-disc text-slate-400">$1</li>');
                document.getElementById('tool-md-out').innerHTML = html || "Input field empty.";
            });
        }
    },
    mac: {
        title: "MAC Address Sandbox Compiler", icon: "laptop",
        render: () => `
            <div class="space-y-2">
                <button id="run-mac" class="bg-slate-900 border border-slate-800 text-xs p-2 rounded">Generate Hardware MAC Identity</button>
                <input type="text" id="tool-mac-out" readonly class="w-full bg-slate-950 p-2 border border-slate-900 text-xs text-theme font-mono rounded">
            </div>
        `,
        action: () => {
            document.getElementById('run-mac').addEventListener('click', () => {
                const mac = "XX:XX:XX:XX:XX:XX".replace(/X/g, () => "0123456789ABCDEF".charAt(Math.floor(Math.random() * 16)));
                document.getElementById('tool-mac-out').value = mac;
            });
        }
    },
    diff: {
        title: "Diff Character Checker Module", icon: "columns",
        render: () => `
            <div class="space-y-2">
                <div class="grid grid-cols-2 gap-2">
                    <input type="text" id="tool-diff-1" value="System active block A" class="bg-slate-950 p-1.5 border border-slate-800 text-xs rounded">
                    <input type="text" id="tool-diff-2" value="System active block B" class="bg-slate-950 p-1.5 border border-slate-800 text-xs rounded">
                </div>
                <button id="run-diff" class="bg-slate-900 border border-slate-800 text-xs p-2 rounded">Evaluate String Discrepancies</button>
                <div id="tool-diff-out" class="text-xs font-mono p-1"></div>
            </div>
        `,
        action: () => {
            document.getElementById('run-diff').addEventListener('click', () => {
                const s1 = document.getElementById('tool-diff-1').value;
                const s2 = document.getElementById('tool-diff-2').value;
                document.getElementById('tool-diff-out').textContent = s1 === s2 ? "Status Integrity Map: ZERO DEVIATION DETECTED" : "Status Integrity Map: SEGMENT MUTATION CONFIRMED";
                document.getElementById('tool-diff-out').style.color = s1 === s2 ? "#10b981" : "#f43f5e";
            });
        }
    }
};

function buildToolsMenu() {
    const listContainer = document.getElementById('tools-menu-list');
    if (!listContainer) return;
    listContainer.innerHTML = "";

    Object.keys(toolsRegistry).forEach(key => {
        const item = toolsRegistry[key];
        const li = document.createElement('li');
        li.innerHTML = `
            <button onclick="window.activateToolModule('${key}')" id="tool-btn-${key}" class="w-full text-left font-mono text-[11px] px-2.5 py-2 rounded-lg transition-all flex items-center gap-2 ${selectedToolId === key ? 'bg-theme-opacity text-theme border border-theme' : 'text-slate-400 hover:text-slate-200 border border-transparent'}">
                <i data-lucide="${item.icon}" class="w-3.5 h-3.5"></i>
                <span class="truncate">${item.title}</span>
            </button>
        `;
        listContainer.appendChild(li);
    });
    lucide.createIcons();
}

window.activateToolModule = (toolId) => {
    selectedToolId = toolId;
    buildToolsMenu();
    renderToolsPanel();
};

function renderToolsPanel() {
    const frame = document.getElementById('tool-runtime-frame');
    const titleNode = document.getElementById('current-tool-title');
    const iconNode = document.getElementById('current-tool-icon');
    
    const tool = toolsRegistry[selectedToolId];
    if(!tool || !frame) return;

    titleNode.textContent = tool.title;
    iconNode.setAttribute('data-lucide', tool.icon);
    frame.innerHTML = tool.render();
    tool.action();
    lucide.createIcons();
}

// Verification structural verification checks sequence initialization
lucide.createIcons();
