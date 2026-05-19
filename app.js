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
    getDocs, 
    query, 
    where, 
    orderBy, 
    doc, 
    updateDoc, 
    deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// 1. FIREBASE ARCHITECTURE CONFIGURATION
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyA1234567890-ExampleOnly",
    authDomain: "lifeos-central-app.firebaseapp.com",
    projectId: "lifeos-central-app",
    storageBucket: "lifeos-central-app.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef123456"
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

// Localization Engine Dictionaries
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

// ==========================================
// 3. CORE CORE THEME LAYER ENGINE (FIXED)
// ==========================================
function applyTheme(themeClassName) {
    const body = document.getElementById('main-body');
    
    // Completely clear previous color configurations to prevent white layout fallback
    body.className = body.className.replace(/theme-\w+/g, '').trim();
    
    // Default to your original deep-space slate tone
    const targetedTheme = themeClassName || 'theme-slate';
    body.classList.add(targetedTheme);
    
    // Explicitly lock the background properties
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
        
        // Load layout runtime preferences
        const savedTheme = localStorage.getItem('lifeos-theme') || 'theme-slate';
        document.getElementById('global-theme-select').value = savedTheme;
        applyTheme(savedTheme);

        const savedLang = localStorage.getItem('lifeos-lang') || 'en';
        document.getElementById('global-lang-select').value = savedLang;
        applyLocalization(savedLang);

        // UI Transition
        authScreen.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            authScreen.classList.add('hidden');
            dashboardScreen.classList.remove('hidden');
            setTimeout(() => dashboardScreen.classList.remove('opacity-0', 'translate-y-2'), 50);
        }, 400);

        fetchDataStream();
    } else {
        currentUserId = null;
        dashboardScreen.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => {
            dashboardScreen.classList.add('hidden');
            authScreen.classList.remove('hidden');
            setTimeout(() => authScreen.classList.remove('opacity-0', 'pointer-events-none'), 50);
        }, 400);
    }
});

// Authentication Listeners
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-username').value;
    const pass = document.getElementById('login-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
        alert("Authentication Engine Failed: " + err.message);
    }
});

document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));

// ==========================================
// 5. FIRESTORE DATABASE MUTATIONS & READS
// ==========================================
async function fetchDataStream() {
    if (!currentUserId) return;
    try {
        const q = query(
            collection(db, `users/${currentUserId}/items`),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        globalDataArray = [];
        snapshot.forEach(doc => {
            globalDataArray.push({ id: doc.id, ...doc.data() });
        });
        renderStreamContainer();
    } catch (err) {
        console.error("Critical Stream Interruption:", err);
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
        await fetchDataStream();
    } catch (err) {
        alert("Commit Action Interrupted: " + err.message);
    }
});

window.toggleItemComplete = async (id, currentStatus) => {
    try {
        const docRef = doc(db, `users/${currentUserId}/items`, id);
        await updateDoc(docRef, { completed: !currentStatus });
        await fetchDataStream();
    } catch (err) {
        console.error("Mutation Error:", err);
    }
};

window.deleteItemRecord = async (id) => {
    if (!confirm("Confirm immediate absolute disposal?")) return;
    try {
        await deleteDoc(doc(db, `users/${currentUserId}/items`, id));
        await fetchDataStream();
    } catch (err) {
        console.error("Disposal Error:", err);
    }
};

// ==========================================
// 6. UI RENDER ENGINE AND CALCULATION CORE
// ==========================================
function renderStreamContainer() {
    const stream = document.getElementById('data-stream');
    const searchTerm = document.getElementById('search-bar').value.toLowerCase();
    const completionFilter = document.getElementById('completion-filter').value;
    const todayStr = new Date().toISOString().split('T')[0];

    // Compute Global Matrix Analytics beforehand
    let total = globalDataArray.length;
    let completed = globalDataArray.filter(i => i.completed).length;
    let efficiency = total > 0 ? Math.round((completed / total) * 100) : 0;
    let dueTodayCount = globalDataArray.filter(i => i.dueDate === todayStr && !i.completed).length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-completed').textContent = completed;
    document.getElementById('stat-efficiency').textContent = `${efficiency}%`;
    document.getElementById('stat-today').textContent = dueTodayCount;

    // Toggle styling on Today Badge based on state
    const todayCard = document.getElementById('stat-today-card');
    const todayIconBg = document.getElementById('stat-today-icon-bg');
    if (todayFilterActive) {
        todayCard.classList.add('border-theme-active', 'bg-theme-opacity');
        todayIconBg.classList.add('text-theme');
    } else {
        todayCard.classList.remove('border-theme-active', 'bg-theme-opacity');
        todayIconBg.classList.remove('text-theme');
    }

    // Process Active Pipeline Filters
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
        lucide.createIcons();
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

    lucide.createIcons();
}

// ==========================================
// 7. MULTI-LANGUAGE UTILITY CONTROLS
// ==========================================
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

    // Toggle Right-to-Left writing flows cleanly
    const dashboard = document.getElementById('dashboard-screen');
    if (langCode === 'ar' || langCode === 'ku') {
        dashboard.dir = "rtl";
        dashboard.classList.add('font-serif');
    } else {
        dashboard.dir = "ltr";
        dashboard.classList.remove('font-serif');
    }
}

// ==========================================
// 8. INTERFACE WINDOW ACCESS EVENT LISTENERS
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

document.getElementById('global-theme-select').addEventListener('change', (e) => applyTheme(e.target.value));
document.getElementById('global-lang-select').addEventListener('change', (e) => applyLocalization(e.target.value));
document.getElementById('search-bar').addEventListener('input', renderStreamContainer);
document.getElementById('completion-filter').addEventListener('change', renderStreamContainer);

// Boot sequence verification
lucide.createIcons();
