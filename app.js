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
    query, 
    orderBy, 
    doc, 
    updateDoc, 
    deleteDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// 1. REAL FIREBASE ARCHITECTURE CONFIGURATION
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
// 2. RUNTIME APPLICATION STATE
// ==========================================
let currentUserId = null;
let currentTabFilter = "all";
let todayFilterActive = false;
let globalDataArray = [];
let unsubscribeStream = null;

// New Features Runtime States
let userXP = parseInt(localStorage.getItem('jkmms-xp')) || 0;
let focusTimerInterval = null;
let focusTimerSecondsLeft = 25 * 60;
let isFocusTimerRunning = false;

// Localization Engine Dictionaries
const locales = {
    en: {
        total: "Total Items", completed: "Completed", efficiency: "Efficiency", today: "Due Today",
        matrixTitle: "New Entry Matrix", fieldDesc: "Description / Title", fieldCat: "Category",
        fieldPriority: "Priority", fieldDate: "Target Date", btnSubmit: "Commit Entry",
        streamHead: "Everything Stream", filterAll: "Unfiltered", filterActive: "Active", filterComp: "Completed",
        catPersonal: "Personal", catUni: "University", catWork: "Work", catMisc: "Misc",
        xpTitle: "System Rank Matrix", timerTitle: "Focus Clock Sequence", settingsTitle: "System Preferences",
        langLabel: "Localization Interface", themeLabel: "Color Palette Core", exportNav: "Export PDF",
        exportTitle: "Export Parameters", exportDesc: "Select the categories you wish to include within your compiled target documentation report manifest.",
        btnExport: "Compile Document"
    },
    ar: {
        total: "إجمالي العناصر", completed: "المكتملة", efficiency: "الكفاءة", today: "المستحق اليوم",
        matrixTitle: "مصفوفة إدخال جديدة", fieldDesc: "الوصف / العنوان", fieldCat: "الفئة",
        fieldPriority: "الأولوية", fieldDate: "تاريخ الاستحقاق", btnSubmit: "تسجيل البيانات",
        streamHead: "تدفق البيانات العام", filterAll: "بدون تصفية", filterActive: "النشطة", filterComp: "المكتملة",
        catPersonal: "شخصي", catUni: "جامعة", catWork: "عمل", catMisc: "متنوع",
        xpTitle: "مصفوفة الرتبة والنظام", timerTitle: "تسلسل ساعة التركيز", settingsTitle: "تفضيلات النظام",
        langLabel: "واجهة اللغة والتوطين", themeLabel: "لوحة ألوان النظام الأساسية", exportNav: "تصدير PDF",
        exportTitle: "محددات تصدير البيانات", exportDesc: "اختر الفئات المحددة التي ترغب في تضمينها داخل تقرير البيانات العام المستخرج.",
        btnExport: "تجميع وطباعة المستند"
    },
    ku: {
        total: "گشتی بڕگەکان", completed: "تەواوکراو", efficiency: "کارایی", today: "بۆ ئەمڕۆ",
        matrixTitle: "ماتریسی تۆمارکردنی نوێ", fieldDesc: "وەسف / ناونیشان", fieldCat: "پۆلێن",
        fieldPriority: "لەپێشینەیی", fieldDate: "ڕێکەوتی مەبەست", btnSubmit: "جێگیرکردنی تۆمار",
        streamHead: "ڕەوتی گشتی زانیارییەکان", filterAll: "بێ پاڵاوتن", filterActive: "چالاکەکان", filterComp: "تەواوکراوەکان",
        catPersonal: "تایبەتی", catUni: "زانکۆ", catWork: "کار", catMisc: "هەمەجۆر",
        xpTitle: "ماتریسی پلەبەرزکردنەوە", timerTitle: "کاتی تەرخانکراو بۆ سەرنجدان", settingsTitle: "ڕێکخستنەکانی سیستم",
        langLabel: "زمانی سیستم", themeLabel: "ڕەنگەکانی سەرەکی سیستم", exportNav: "هەناردەی PDF",
        exportTitle: "دیاریکردنی هەناردەکردن", exportDesc: "ئەو هاوپۆلانە دەستنیشان بکە کە دەتەوێت لە ناو ڕاپۆرتی فەرمی کۆکراوەدا جێگیر بکرێن.",
        btnExport: "کۆکردنەوە و دروستکردنی PDF"
    }
};

// ==========================================
// 3. CORE THEME LAYER ENGINE
// ==========================================
function applyTheme(themeClassName) {
    const body = document.getElementById('main-body');
    body.className = body.className.replace(/theme-\w+/g, '').trim();
    const targetedTheme = themeClassName || 'theme-slate';
    body.classList.add(targetedTheme);
    body.style.backgroundColor = "var(--theme-bg)";
    localStorage.setItem('lifeos-theme', targetedTheme);
}

// ==========================================
// 4. AUTHENTICATION MONITOR & SECURE ROUTING
// ==========================================
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
        updateXPSystem(0); // Sync display graphics on initialization

        authScreen.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            authScreen.classList.add('hidden');
            dashboardScreen.classList.remove('hidden');
            setTimeout(() => dashboardScreen.classList.remove('opacity-0', 'translate-y-2'), 50);
        }, 400);

        fetchDataStream();
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

// Authentication Bindings
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-username').value;
        const pass = document.getElementById('login-password').value;
        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (err) {
            alert("Authentication Engine Failed: Access Denied.");
        }
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        if (unsubscribeStream) unsubscribeStream();
        signOut(auth);
    });
});

// ==========================================
// 5. FIRESTORE DATABASE MUTATIONS & READS
// ==========================================
async function fetchDataStream() {
    if (!currentUserId) return;
    if (unsubscribeStream) unsubscribeStream();

    try {
        const q = query(collection(db, `users/${currentUserId}/items`), orderBy("createdAt", "desc"));
        unsubscribeStream = onSnapshot(q, (snapshot) => {
            globalDataArray = [];
            snapshot.forEach(doc => { globalDataArray.push({ id: doc.id, ...doc.data() }); });
            renderStreamContainer();
        }, (err) => { console.error("Critical Stream Interruption:", err); });
    } catch (err) { console.error("Failed to establish stream pipeline:", err); }
}

document.addEventListener("DOMContentLoaded", () => {
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
            updateXPSystem(15); // Reward behavior loop on tracking action inputs
        } catch (err) { alert("Commit Action Interrupted: " + err.message); }
    });
});

window.toggleItemComplete = async (id, currentStatus) => {
    try {
        const docRef = doc(db, `users/${currentUserId}/items`, id);
        await updateDoc(docRef, { completed: !currentStatus });
        if (!currentStatus) {
            updateXPSystem(35); // Boost rewards output upon target objective clearance completions
        }
    } catch (err) { console.error("Mutation Error:", err); }
};

window.deleteItemRecord = async (id) => {
    if (!confirm("Confirm immediate absolute disposal?")) return;
    try {
        await deleteDoc(doc(db, `users/${currentUserId}/items`, id));
    } catch (err) { console.error("Disposal Error:", err); }
};

// ==========================================
// 6. UI RENDER ENGINE AND CALCULATION CORE
// ==========================================
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

    document.getElementById('counter-badge').textContent = `${filtered.length} Items`;
    stream.innerHTML = "";

    if (filtered.length === 0) {
        stream.innerHTML = `
            <div class="col-span-full dynamic-glass p-8 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-center">
                <i data-lucide="folder-open" class="w-8 h-8 text-slate-700 mb-2"></i>
                <p class="text-xs text-slate-500 font-mono">No arrays pass the active filter logic matrix.</p>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    filtered.forEach(item => {
        const priorityColors = {
            High: "text-rose-400 bg-rose-500/10 border-rose-500/20",
            Medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
            Low: "text-slate-400 bg-slate-500/10 border-slate-500/20"
        }[item.priority || "Medium"];

        const card = document.createElement('div');
        card.className = `dynamic-glass p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between gap-3 shadow-sm hover:translate-y-[-1px] ${item.completed ? 'border-slate-900/40 opacity-50' : 'border-slate-800/60 hover:border-slate-700'}`;
        
        card.innerHTML = `
            <div class="flex items-start gap-3">
                <button onclick="window.toggleItemComplete('${item.id}', ${item.completed})" class="mt-0.5 shrink-0 transition-colors ${item.completed ? 'text-emerald-400' : 'text-slate-600 hover:text-theme'}">
                    <i data-lucide="${item.completed ? 'check-square' : 'square'}" class="w-4 h-4"></i>
                </button>
                <div class="min-w-0 flex-1">
                    <p class="text-xs font-medium text-slate-200 break-words leading-relaxed ${item.completed ? 'line-through text-slate-500' : ''}">${item.title}</p>
                    <div class="flex flex-wrap gap-1.5 mt-2 items-center">
                        <span class="text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-800 bg-slate-950/60 text-slate-400">${item.category}</span>
                        <span class="text-[9px] font-mono px-1.5 py-0.5 rounded border ${priorityColors}">${item.priority}</span>
                        ${item.dueDate ? `
                            <span class="text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-800 bg-slate-950/40 flex items-center gap-1 ${item.dueDate === todayStr && !item.completed ? 'text-rose-400 border-rose-500/10' : 'text-slate-500'}">
                                <i data-lucide="clock" class="w-2.5 h-2.5"></i>${item.dueDate}
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
            <div class="flex items-center justify-end border-t border-slate-900/40 pt-2 mt-1">
                <button onclick="window.deleteItemRecord('${item.id}')" class="text-slate-600 hover:text-rose-400 p-1 transition-colors rounded">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
            </div>
        `;
        stream.appendChild(card);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ==========================================
// 7. MULTI-LANGUAGE UTILITY CONTROLS
// ==========================================
function applyLocalization(langCode) {
    const dict = locales[langCode] || locales.en;
    localStorage.setItem('lifeos-lang', langCode);

    // Main Core Metrics Text
    document.getElementById('lbl-stat-total').textContent = dict.total;
    document.getElementById('lbl-stat-completed').textContent = dict.completed;
    document.getElementById('lbl-stat-efficiency').textContent = dict.efficiency;
    document.getElementById('stat-today-label').textContent = dict.today;
    
    // Form Translation Nodes
    document.getElementById('lbl-matrix-title').textContent = dict.matrixTitle;
    document.getElementById('lbl-field-desc').textContent = dict.fieldDesc;
    document.getElementById('lbl-field-cat').textContent = dict.fieldCat;
    document.getElementById('lbl-field-priority').textContent = dict.fieldPriority;
    document.getElementById('lbl-field-date').textContent = dict.fieldDate;
    document.getElementById('lbl-btn-submit').textContent = dict.btnSubmit;
    document.getElementById('stream-heading').textContent = dict.streamHead;
    
    // Form Selection Options
    document.getElementById('opt-cat-personal').textContent = dict.catPersonal;
    document.getElementById('opt-cat-uni').textContent = dict.catUni;
    document.getElementById('opt-cat-work').textContent = dict.catWork;
    document.getElementById('opt-cat-misc').textContent = dict.catMisc;
    document.getElementById('opt-filter-all').textContent = dict.filterAll;
    document.getElementById('opt-filter-active').textContent = dict.filterActive;
    document.getElementById('opt-filter-comp').textContent = dict.filterComp;

    // Advanced Controls & Features Translation Nodes
    document.getElementById('lbl-xp-title').textContent = dict.xpTitle;
    document.getElementById('lbl-timer-title').textContent = dict.timerTitle;
    document.getElementById('lbl-nav-export').textContent = dict.exportNav;
    document.getElementById('lbl-modal-settings-title').textContent = dict.settingsTitle;
    document.getElementById('lbl-setting-lang').textContent = dict.langLabel;
    document.getElementById('lbl-setting-theme').textContent = dict.themeLabel;
    document.getElementById('lbl-modal-export-title').textContent = dict.exportTitle;
    document.getElementById('lbl-export-desc').textContent = dict.exportDesc;
    document.getElementById('lbl-btn-trigger-export').textContent = dict.btnExport;
    
    // Checkbox mapping lists translation
    document.getElementById('lbl-exp-personal').textContent = dict.catPersonal;
    document.getElementById('lbl-exp-uni').textContent = dict.catUni;
    document.getElementById('lbl-exp-work').textContent = dict.catWork;
    document.getElementById('lbl-exp-misc').textContent = dict.catMisc;

    const dashboard = document.getElementById('dashboard-screen');
    if (langCode === 'ar' || langCode === 'ku') {
        dashboard.dir = "rtl";
        dashboard.classList.add('font-ibm-plex');
        dashboard.style.fontSize = "15.5px"; 
    } else {
        dashboard.dir = "ltr";
        dashboard.classList.remove('font-ibm-plex');
        dashboard.style.fontSize = "14px"; 
    }
}

// ==========================================
// 8. INTERFACE MODAL & COMPLEX FEATURES CORE
// ==========================================

// Global Interface Modal System Toggles
window.toggleModal = (modalId, shouldOpen) => {
    const modalElement = document.getElementById(modalId);
    if (shouldOpen) {
        modalElement.classList.remove('hidden');
    } else {
        modalElement.classList.add('hidden');
    }
};

// FEATURE 1: XP Gamification Calculation Engine Processing Logic
function updateXPSystem(pointsGained) {
    userXP += pointsGained;
    localStorage.setItem('jkmms-xp', userXP);
    
    const level = Math.floor(userXP / 100) + 1;
    const currentLevelXP = userXP % 100;

    document.getElementById('user-level-badge').textContent = `LVL ${level}`;
    document.getElementById('xp-display-text').textContent = `${currentLevelXP} / 100 XP to next clearance level`;
    document.getElementById('xp-progress-bar').style.width = `${currentLevelXP}%`;
}

// FEATURE 2: Pomodoro Clock Sequence Focus Timers Core
window.toggleTimer = () => {
    const toggleBtn = document.getElementById('timer-toggle-btn');
    if (isFocusTimerRunning) {
        clearInterval(focusTimerInterval);
        isFocusTimerRunning = false;
        toggleBtn.textContent = "Start";
        toggleBtn.classList.replace('bg-rose-500/20', 'bg-theme-opacity');
    } else {
        isFocusTimerRunning = true;
        toggleBtn.textContent = "Pause";
        toggleBtn.classList.replace('bg-theme-opacity', 'bg-rose-500/20');
        
        focusTimerInterval = setInterval(() => {
            focusTimerSecondsLeft--;
            updateTimerDisplay();
            
            if (focusTimerSecondsLeft <= 0) {
                clearInterval(focusTimerInterval);
                isFocusTimerRunning = false;
                alert("Focus interval baseline cycle complete! Reward output points mapped.");
                updateXPSystem(50); // XP Burst Reward for passing Pomodoro clock intervals
                window.resetTimer();
            }
        }, 1000);
    }
};

window.resetTimer = () => {
    clearInterval(focusTimerInterval);
    isFocusTimerRunning = false;
    focusTimerSecondsLeft = 25 * 60;
    updateTimerDisplay();
    const toggleBtn = document.getElementById('timer-toggle-btn');
    toggleBtn.textContent = "Start";
    toggleBtn.className = "flex-1 bg-theme-opacity border border-theme text-theme rounded-xl py-1.5 text-xs font-mono uppercase font-bold hover:bg-theme hover:text-slate-950 transition-all";
};

function updateTimerDisplay() {
    const mins = Math.floor(focusTimerSecondsLeft / 60).toString().padStart(2, '0');
    const secs = (focusTimerSecondsLeft % 60).toString().padStart(2, '0');
    document.getElementById('timer-display').textContent = `${mins}:${secs}`;
}

// ADVANCED CORE MODULE: Native Vector PDF Export Processing Engine
window.executeExportSequence = () => {
    const selectedCheckboxes = document.querySelectorAll('#export-checkbox-matrix input[type="checkbox"]:checked');
    const categoriesToExport = Array.from(selectedCheckboxes).map(cb => cb.value);

    if (categoriesToExport.length === 0) {
        alert("Please select at least one active segment parameter option category.");
        return;
    }

    const targetItems = globalDataArray.filter(item => categoriesToExport.includes(item.category));
    const canvasElement = document.getElementById('print-canvas');
    
    let htmlDocumentBuffer = `
        <div style="font-family: sans-serif; color: #111; padding: 20px;">
            <h1 style="font-size: 20px; border-b: 2px solid #000; padding-bottom: 6px; margin-bottom: 4px;">JKMMS Data Manifest Report</h1>
            <p style="font-size: 11px; color: #555; margin-bottom: 24px;">Generated on: ${new Date().toLocaleString()}</p>
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 12px;">
                <thead>
                    <tr style="border-bottom: 1px solid #111; background-color: #f4f4f5;">
                        <th style="padding: 8px;">Status</th>
                        <th style="padding: 8px;">Description Title</th>
                        <th style="padding: 8px;">Category</th>
                        <th style="padding: 8px;">Priority</th>
                        <th style="padding: 8px;">Target Date</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if (targetItems.length === 0) {
        htmlDocumentBuffer += `<tr><td colspan="5" style="padding: 16px; text-align: center; color: #777;">No record tracks parsed inside target matrices segments.</td></tr>`;
    } else {
        targetItems.forEach(i => {
            htmlDocumentBuffer += `
                <tr style="border-bottom: 1px solid #e4e4e7;">
                    <td style="padding: 8px; font-weight: bold; color: ${i.completed ? 'green' : 'orange'}">${i.completed ? 'COMPLETED' : 'ACTIVE'}</td>
                    <td style="padding: 8px; ${i.completed ? 'text-decoration: line-through; color:#777;' : ''}">${i.title}</td>
                    <td style="padding: 8px;"><span style="background:#f4f4f5; border:1px solid #e4e4e7; padding:2px 6px; border-radius:4px; font-size:10px;">${i.category}</span></td>
                    <td style="padding: 8px;">${i.priority || 'Medium'}</td>
                    <td style="padding: 8px; color: #444;">${i.dueDate || '-'}</td>
                </tr>
            `;
        });
    }

    htmlDocumentBuffer += `</tbody></table></div>`;
    
    // Execute Native Print Window Routing System Swap Channel Pipeline
    canvasElement.innerHTML = htmlDocumentBuffer;
    window.toggleModal('export-modal', false);
    
    window.print();
};

// ==========================================
// 9. WINDOW INTERFACE ACCESS LISTENER ACTIONS
// ==========================================
window.switchTab = (tabName) => {
    currentTabFilter = tabName;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.className = "tab-btn text-xs font-medium px-3 py-1.5 rounded-lg transition-all shrink-0 text-slate-400 hover:text-slate-200 border border-transparent";
    });
    
    const activeBtn = document.getElementById(`tab-${tabName}`);
    if (activeBtn) {
        activeBtn.className = "tab-btn text-xs font-medium px-3 py-1.5 rounded-lg transition-all shrink-0 bg-theme-opacity text-theme border border-theme";
    }
    renderStreamContainer();
};

window.toggleTodayFilter = () => {
    todayFilterActive = !todayFilterActive;
    renderStreamContainer();
};

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('global-theme-select').addEventListener('change', (e) => applyTheme(e.target.value));
    document.getElementById('global-lang-select').addEventListener('change', (e) => applyLocalization(e.target.value));
    document.getElementById('search-bar').addEventListener('input', renderStreamContainer);
    document.getElementById('completion-filter').addEventListener('change', renderStreamContainer);

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});
