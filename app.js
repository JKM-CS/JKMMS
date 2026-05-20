import { auth, db } from "./firebase-config.js";
import { 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
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
// 1. RUNTIME CORE STATES
// ==========================================
let currentUserId = null;
let currentTabFilter = "all";
let todayFilterActive = false;
let globalDataArray = [];
let unsubscribeStream = null;

// Tool Specific States
let userXP = parseInt(localStorage.getItem('jkmms-xp')) || 0;
let focusTimerInterval = null;
let focusTimerSecondsLeft = 25 * 60;
let isFocusTimerRunning = false;
let converterActiveFileBuffer = null;

// Localization Engine Multi-lingual Dictionary
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
        btnExport: "Compile Document", scratchpadTitle: "Workspace Scratchpad", milestoneTitle: "Project & Exam Milestones",
        savedStatus: "Saved", savingStatus: "Saving...", noMilestones: "No impending deadlines tracked.",
        converterTitle: "Media Format Converter", converterDroptext: "Select or Drop Image", converterTarget: "Target Extension",
        converterQuality: "Quality", converterBtn: "Process Transcoding",
        errSelectFile: "Please select a valid local image stream source first.",
        errProcess: "Error processing client transcoding vectors: "
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
        btnExport: "تجميع وطباعة المستند", scratchpadTitle: "مسودة الملاحظات السريعة", milestoneTitle: "مؤشرات المشاريع والامتحانات",
        savedStatus: "تم الحفظ", savingStatus: "جاري الحفظ...", noMilestones: "لا توجد مواعيد نهائية قريبة.",
        converterTitle: "محول صيغ الملفات والمرئيات", converterDroptext: "اختر صورة أو اسحبها هنا",
        converterTarget: "الصيغة المستهدفة", converterQuality: "جودة وضغط الصورة", converterBtn: "بدء معالجة وتحويل الصيغة",
        errSelectFile: "يرجى تحديد ملف صورة محلي صالح أولاً.",
        errProcess: "فشل نظام التحويل الداخلي في معالجة الملف: "
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
        btnExport: "کۆکردنەوە و دروستکردنی PDF", scratchpadTitle: "تێبینییە خێراکان", milestoneTitle: "قیبلەنما و وادەکانی تاقیکردنەوە",
        savedStatus: "پاشەکەوتکرا", savingStatus: "پاشەکەوت دەکرێت...", noMilestones: "هیچ وادەیەکی گرنگ دیاری نەکراوە.",
        converterTitle: "گۆڕەری جۆری پەڕگەکان", converterDroptext: "وێنەیەک لێرە دابنێ یان دیاریبکە",
        converterTarget: "جۆری مەبەست (فۆرمات)", converterQuality: "ئاستی پەستاندن و کوالێتی", converterBtn: "دەستپێکردنی گۆڕینی فۆرمات",
        errSelectFile: "تکایە سەرەتا پەڕگەیەکی وێنەی دروست دیاری بکە.",
        errProcess: "هەڵە لە سیستەمی گۆڕینی ناوخۆیی ڕوویدا: "
    }
};

// ==========================================
// 2. CORE PALETTE THEME VECTOR LAYERS
// ==========================================
function applyTheme(themeClassName) {
    const body = document.getElementById('main-body');
    if (!body) return;
    body.className = body.className.replace(/theme-\w+/g, '').trim();
    const targetedTheme = themeClassName || 'theme-slate';
    body.classList.add(targetedTheme);
    body.style.backgroundColor = "var(--theme-bg)";
    localStorage.setItem('lifeos-theme', targetedTheme);
}

// ==========================================
// 3. AUTH SECURITY PIPELINE
// ==========================================
onAuthStateChanged(auth, (user) => {
    const authScreen = document.getElementById('auth-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const userDisplay = document.getElementById('user-display');

    if (user) {
        currentUserId = user.uid;
        if (userDisplay) userDisplay.textContent = user.email.split('@')[0];
        
        const savedTheme = localStorage.getItem('lifeos-theme') || 'theme-slate';
        const themeSelector = document.getElementById('global-theme-select');
        if (themeSelector) themeSelector.value = savedTheme;
        applyTheme(savedTheme);

        const savedLang = localStorage.getItem('lifeos-lang') || 'en';
        const langSelector = document.getElementById('global-lang-select');
        if (langSelector) langSelector.value = savedLang;
        applyLocalization(savedLang);
        updateXPSystem(0);

        if (authScreen && dashboardScreen) {
            authScreen.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => {
                authScreen.classList.add('hidden');
                dashboardScreen.classList.remove('hidden');
                setTimeout(() => dashboardScreen.classList.remove('opacity-0', 'translate-y-2'), 50);
            }, 400);
        }
        fetchDataStream();
    } else {
        currentUserId = null;
        if (unsubscribeStream) unsubscribeStream();
        
        if (dashboardScreen && authScreen) {
            dashboardScreen.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => {
                dashboardScreen.classList.add('hidden');
                authScreen.classList.remove('hidden');
                setTimeout(() => authScreen.classList.remove('opacity-0', 'pointer-events-none'), 50);
            }, 400);
        }
    }
});

// ==========================================
// 4. FIRESTORE REAL-TIME DATA PROCESSING
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

// ==========================================
// 5. UI COMPILING MATRIX & MATHEMATICAL DELTAS
// ==========================================
function renderStreamContainer() {
    const stream = document.getElementById('data-stream');
    if (!stream) return;

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
        if (todayCard) todayCard.classList.add('border-theme-active', 'bg-theme-opacity');
        if (todayIconBg) todayIconBg.classList.add('text-theme');
    } else {
        if (todayCard) todayCard.classList.remove('border-theme-active', 'bg-theme-opacity');
        if (todayIconBg) todayIconBg.classList.remove('text-theme');
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
        renderMilestonesWidget();
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
                <button data-id="${item.id}" data-comp="${item.completed}" class="item-comp-toggle-btn mt-0.5 shrink-0 transition-colors ${item.completed ? 'text-emerald-400' : 'text-slate-600 hover:text-theme'}">
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
                <button data-id="${item.id}" class="item-delete-record-btn text-slate-600 hover:text-rose-400 p-1 transition-colors rounded">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
            </div>
        `;
        stream.appendChild(card);
    });

    stream.querySelectorAll('.item-comp-toggle-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const comp = btn.getAttribute('data-comp') === 'true';
            try {
                await updateDoc(doc(db, `users/${currentUserId}/items`, id), { completed: !comp });
                if (!comp) updateXPSystem(35);
            } catch (err) { console.error(err); }
        });
    });

    stream.querySelectorAll('.item-delete-record-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            if (!confirm("Confirm absolute disposal?")) return;
            try { await deleteDoc(doc(db, `users/${currentUserId}/items`, id)); } catch (err) { console.error(err); }
        });
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
    renderMilestonesWidget();
}

// ==========================================
// 6. MULTI-LINGUAL SYSTEM LOCALIZATION INTERACTION
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
    
    document.getElementById('opt-cat-personal').textContent = dict.catPersonal;
    document.getElementById('opt-cat-uni').textContent = dict.catUni;
    document.getElementById('opt-cat-work').textContent = dict.catWork;
    document.getElementById('opt-cat-misc').textContent = dict.catMisc;
    document.getElementById('opt-filter-all').textContent = dict.filterAll;
    document.getElementById('opt-filter-active').textContent = dict.filterActive;
    document.getElementById('opt-filter-comp').textContent = dict.filterComp;

    document.getElementById('lbl-xp-title').textContent = dict.xpTitle;
    document.getElementById('lbl-timer-title').textContent = dict.timerTitle;
    document.getElementById('lbl-nav-export').textContent = dict.exportNav;
    document.getElementById('lbl-modal-settings-title').textContent = dict.settingsTitle;
    document.getElementById('lbl-setting-lang').textContent = dict.langLabel;
    document.getElementById('lbl-setting-theme').textContent = dict.themeLabel;
    document.getElementById('lbl-modal-export-title').textContent = dict.exportTitle;
    document.getElementById('lbl-export-desc').textContent = dict.exportDesc;
    document.getElementById('trigger-export-action-btn').textContent = dict.btnExport;
    
    document.getElementById('lbl-exp-personal').textContent = dict.catPersonal;
    document.getElementById('lbl-exp-uni').textContent = dict.catUni;
    document.getElementById('lbl-exp-work').textContent = dict.catWork;
    document.getElementById('lbl-exp-misc').textContent = dict.catMisc;

    document.getElementById('lbl-scratchpad-title').textContent = dict.scratchpadTitle;
    document.getElementById('lbl-milestone-title').textContent = dict.milestoneTitle;

    document.getElementById('lbl-converter-title').textContent = dict.converterTitle;
    document.getElementById('lbl-converter-droptext').textContent = dict.converterDroptext;
    document.getElementById('lbl-converter-target').textContent = dict.converterTarget;
    document.getElementById('lbl-converter-quality').textContent = dict.converterQuality;
    document.getElementById('converter-trigger-btn').textContent = dict.converterBtn;

    const dashboard = document.getElementById('dashboard-screen');
    if (dashboard) {
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
    renderMilestonesWidget();
}

// ==========================================
// 7. SIDE PANEL WIDGET FUNCTIONS
// ==========================================
function updateXPSystem(pointsGained) {
    userXP += pointsGained;
    localStorage.setItem('jkmms-xp', userXP);
    
    const level = Math.floor(userXP / 100) + 1;
    const currentLevelXP = userXP % 100;

    const badge = document.getElementById('user-level-badge');
    const displayTxt = document.getElementById('xp-display-text');
    const bar = document.getElementById('xp-progress-bar');

    if (badge) badge.textContent = `LVL ${level}`;
    if (displayTxt) displayTxt.textContent = `${currentLevelXP} / 100 XP to next clearance level`;
    if (bar) bar.style.width = `${currentLevelXP}%`;
}

function renderMilestonesWidget() {
    const milestoneBox = document.getElementById('milestone-container');
    if (!milestoneBox) return;
    
    const currentLang = localStorage.getItem('lifeos-lang') || 'en';
    milestoneBox.innerHTML = "";

    const upcomingDeadlines = globalDataArray.filter(item => item.dueDate && !item.completed);

    if (upcomingDeadlines.length === 0) {
        milestoneBox.innerHTML = `<p class="text-[11px] font-mono text-slate-600 text-center py-2">${locales[currentLang]?.noMilestones || "No deadlines."}</p>`;
        return;
    }

    const todayNoon = new Date();
    todayNoon.setHours(0,0,0,0);

    upcomingDeadlines.slice(0, 4).forEach(item => {
        const targetDate = new Date(item.dueDate);
        targetDate.setHours(0,0,0,0);
        const daysRemaining = Math.ceil((targetDate.getTime() - todayNoon.getTime()) / (1000 * 60 * 60 * 24));
        
        let deltaString = "";
        let badgeColor = "text-slate-400 bg-slate-900";

        if (daysRemaining < 0) {
            deltaString = currentLang === 'en' ? "Overdue" : currentLang === 'ar' ? "متأخر" : "تێپەڕیوە";
            badgeColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";
        } else if (daysRemaining === 0) {
            deltaString = currentLang === 'en' ? "Today" : currentLang === 'ar' ? "اليوم" : "ئەمڕۆ";
            badgeColor = "text-amber-400 bg-amber-500/10 border-amber-500/20 animate-pulse";
        } else if (daysRemaining === 1) {
            deltaString = currentLang === 'en' ? "Tomorrow" : currentLang === 'ar' ? "غداً" : "بەیانی";
            badgeColor = "text-amber-300 bg-amber-500/5";
        } else {
            const weeks = Math.floor(daysRemaining / 7);
            const remainingDays = daysRemaining % 7;
            if (currentLang === 'en') {
                deltaString = weeks > 0 ? `${weeks}w ${remainingDays}d` : `${remainingDays}d`;
            } else if (currentLang === 'ar') {
                deltaString = weeks > 0 ? `${weeks}أسابيع ${remainingDays}يوم` : `${remainingDays} يوم`;
            } else {
                deltaString = weeks > 0 ? `${weeks}هەفتە ${remainingDays}ڕۆژ` : `${remainingDays} ڕۆژ`;
            }
            badgeColor = "text-cyan-400 bg-cyan-500/5";
        }

        const row = document.createElement('div');
        row.className = "flex items-center justify-between gap-2 p-2 bg-slate-950/40 rounded-xl border border-slate-900 text-xs";
        row.innerHTML = `
            <div class="min-w-0 flex-1">
                <p class="font-medium text-slate-300 truncate">${item.title}</p>
                <p class="text-[9px] font-mono text-slate-500">${item.category}</p>
            </div>
            <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded border whitespace-nowrap ${badgeColor}">${deltaString}</span>
        `;
        milestoneBox.appendChild(row);
    });
}

// ==========================================
// 8. ASYNCHRONOUS SECURE INITIALIZATION SEQUENCE
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    
    // Auth Form Logic - Sign In Pipeline
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            
            try {
                await signInWithEmailAndPassword(auth, email, password);
                loginForm.reset();
            } catch (err) {
                alert("Authentication Interrupted: " + err.message);
            }
        });
    }

    // Header Logout Binding
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
            } catch (err) {
                console.error("Signout Error: ", err);
            }
        });
    }

    // Header Panel Trigger Bindings
    document.getElementById('nav-settings-btn').addEventListener('click', () => document.getElementById('settings-modal').classList.remove('hidden'));
    document.getElementById('close-settings-btn').addEventListener('click', () => document.getElementById('settings-modal').classList.add('hidden'));
    document.getElementById('nav-export-btn').addEventListener('click', () => document.getElementById('export-modal').classList.remove('hidden'));
    document.getElementById('close-export-btn').addEventListener('click', () => document.getElementById('export-modal').classList.add('hidden'));

    // Config Control Mutation Sync Targets
    document.getElementById('global-theme-select').addEventListener('change', (e) => applyTheme(e.target.value));
    document.getElementById('global-lang-select').addEventListener('change', (e) => applyLocalization(e.target.value));
    document.getElementById('search-bar').addEventListener('input', renderStreamContainer);
    document.getElementById('completion-filter').addEventListener('change', renderStreamContainer);

    // Tab Grouping Click Listeners
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentTabFilter = btn.id.replace('tab-', '');
            document.querySelectorAll('.tab-btn').forEach(b => b.className = "tab-btn text-xs font-medium px-3 py-1.5 rounded-lg transition-all shrink-0 text-slate-400 hover:text-slate-200 border border-transparent");
            btn.className = "tab-btn text-xs font-medium px-3 py-1.5 rounded-lg transition-all shrink-0 bg-theme-opacity text-theme border border-theme";
            renderStreamContainer();
        });
    });

    // Due Today Dashboard Analytic Badge Filter Click Toggles
    document.getElementById('stat-today-card').addEventListener('click', () => {
        todayFilterActive = !todayFilterActive;
        renderStreamContainer);
    });

    // DB Commit Operations
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
            updateXPSystem(15);
        } catch (err) { alert("Commit Action Interrupted: " + err.message); }
    });

    // Scratchpad Auto-Save Operations
    const scratchpad = document.getElementById('scratchpad-area');
    const statusLabel = document.getElementById('scratchpad-save-status');
    scratchpad.value = localStorage.getItem('jkmms-scratchpad-data') || "";
    let saveTimeout;
    scratchpad.addEventListener('input', () => {
        const currentLang = localStorage.getItem('lifeos-lang') || 'en';
        statusLabel.textContent = locales[currentLang]?.savingStatus || "Saving...";
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            localStorage.setItem('jkmms-scratchpad-data', scratchpad.value);
            statusLabel.textContent = locales[currentLang]?.savedStatus || "Saved";
        }, 1000);
    });

    // Pomodoro Timer Management Click Routing
    const timerToggleBtn = document.getElementById('timer-toggle-btn');
    timerToggleBtn.addEventListener('click', () => {
        if (isFocusTimerRunning) {
            clearInterval(focusTimerInterval);
            isFocusTimerRunning = false;
            timerToggleBtn.textContent = "Start";
            timerToggleBtn.classList.replace('bg-rose-500/20', 'bg-theme-opacity');
        } else {
            isFocusTimerRunning = true;
            timerToggleBtn.textContent = "Pause";
            timerToggleBtn.classList.replace('bg-theme-opacity', 'bg-rose-500/20');
            focusTimerInterval = setInterval(() => {
                focusTimerSecondsLeft--;
                const mins = Math.floor(focusTimerSecondsLeft / 60).toString().padStart(2, '0');
                const secs = (focusTimerSecondsLeft % 60).toString().padStart(2, '0');
                document.getElementById('timer-display').textContent = `${mins}:${secs}`;
                if (focusTimerSecondsLeft <= 0) {
                    clearInterval(focusTimerInterval);
                    isFocusTimerRunning = false;
                    alert("Focus interval cycle complete! Reward outputs mapped.");
                    updateXPSystem(50);
                    resetTimer();
                }
            }, 1000);
        }
    });

    function resetTimer() {
        clearInterval(focusTimerInterval);
        isFocusTimerRunning = false;
        focusTimerSecondsLeft = 25 * 60;
        document.getElementById('timer-display').textContent = "25:00";
        timerToggleBtn.textContent = "Start";
        timerToggleBtn.className = "flex-1 bg-theme-opacity border border-theme text-theme rounded-xl py-1.5 text-xs font-mono uppercase font-bold hover:bg-theme hover:text-slate-950 transition-all";
    }
    document.getElementById('timer-reset-btn').addEventListener('click', resetTimer);

    // Media Processing Hardware Component Listeners
    const fileInput = document.getElementById('converter-file-input');
    const fileNameDisplay = document.getElementById('converter-file-name');
    const convertTriggerBtn = document.getElementById('converter-trigger-btn');

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            converterActiveFileBuffer = file;
            fileNameDisplay.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
            convertTriggerBtn.disabled = false;
            convertTriggerBtn.className = "w-full bg-theme-opacity border border-theme text-theme hover:bg-theme hover:text-slate-950 text-[11px] font-bold py-2 rounded-xl transition-all tracking-wider uppercase";
        } else {
            converterActiveFileBuffer = null;
            fileNameDisplay.textContent = "";
            convertTriggerBtn.disabled = true;
            convertTriggerBtn.className = "w-full bg-slate-900 border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-400 text-[11px] font-bold py-2 rounded-xl transition-all tracking-wider uppercase";
        }
    });

    convertTriggerBtn.addEventListener('click', () => {
        const currentLang = localStorage.getItem('lifeos-lang') || 'en';
        const dict = locales[currentLang] || locales.en;
        if (!converterActiveFileBuffer) return;

        const targetMimeType = document.getElementById('converter-target-format').value;
        const compressionQuality = parseFloat(document.getElementById('converter-target-quality').value);

        const reader = new FileReader();
        reader.onload = function (event) {
            const img = new Image();
            img.onload = function () {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    canvas.toBlob((blob) => {
                        if (!blob) { alert(dict.errProcess + "Null blob mapping."); return; }
                        const inputNameParsed = converterActiveFileBuffer.name.substring(0, converterActiveFileBuffer.name.lastIndexOf('.'));
                        const extensionsMap = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "image/bmp": "bmp" };
                        const outputExtension = extensionsMap[targetMimeType] || "bin";

                        const downloadUrl = URL.createObjectURL(blob);
                        const downloadAnchor = document.createElement('a');
                        downloadAnchor.href = downloadUrl;
                        downloadAnchor.download = `${inputNameParsed}_converted.${outputExtension}`;
                        document.body.appendChild(downloadAnchor);
                        downloadAnchor.click();
                        document.body.removeChild(downloadAnchor);
                        URL.revokeObjectURL(downloadUrl);
                        updateXPSystem(20);
                    }, targetMimeType, compressionQuality);
                } catch (err) { alert(dict.errProcess + err.message); }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(converterActiveFileBuffer);
    });

    // Vector PDF Exporter Engine Canvas Assembly Line
    document.getElementById('trigger-export-action-btn').addEventListener('click', () => {
        const selectedCheckboxes = document.querySelectorAll('#export-checkbox-matrix input[type="checkbox"]:checked');
        const categoriesToExport = Array.from(selectedCheckboxes).map(cb => cb.value);
        if (categoriesToExport.length === 0) { alert("Please select a valid filter parameter option category."); return; }

        const targetItems = globalDataArray.filter(item => categoriesToExport.includes(item.category));
        const canvasElement = document.getElementById('print-canvas');
        
        let htmlDocumentBuffer = `
            <div style="font-family: sans-serif; color: #111; padding: 20px;">
                <h1 style="font-size: 20px; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 4px;">JKMMS Manifest Data Document Report</h1>
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
            htmlDocumentBuffer += `<tr><td colspan="5" style="padding: 16px; text-align: center; color: #777;">No matching logs found inside target metrics profiles.</td></tr>`;
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
        canvasElement.innerHTML = htmlDocumentBuffer;
        document.getElementById('export-modal').classList.add('hidden');
        window.print();
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
});
