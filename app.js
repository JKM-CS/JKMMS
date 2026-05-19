import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    collection, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    onSnapshot, 
    deleteDoc, 
    updateDoc,
    doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let currentCategoryFilter = 'all';
let globalUserRef = null;
let activeCachedItems = [];
let todayFilterActive = false; 

const authScreen = document.getElementById('auth-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const itemForm = document.getElementById('item-form');
const dataStreamContainer = document.getElementById('data-stream');
const searchBar = document.getElementById('search-bar');
const completionFilter = document.getElementById('completion-filter');

// --- AUTH HANDLING ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        globalUserRef = user;
        document.getElementById('user-display').innerText = user.email.split('@')[0].toUpperCase();
        
        authScreen.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
        setTimeout(() => {
            authScreen.classList.add('hidden');
            dashboardScreen.classList.remove('hidden');
            setTimeout(() => {
                dashboardScreen.classList.remove('opacity-0', 'translate-y-0');
            }, 50);
        }, 400);

        initializeLiveStream();
    } else {
        globalUserRef = null;
        dashboardScreen.classList.add('opacity-0');
        setTimeout(() => {
            dashboardScreen.classList.add('hidden');
            authScreen.classList.remove('hidden');
            setTimeout(() => {
                authScreen.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
            }, 50);
        }, 400);
    }
    lucide.createIcons();
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    try {
        await signInWithEmailAndPassword(auth, emailInput, password);
    } catch (error) {
        console.error("Auth Failure Detail:", error.code, error.message);
        alert(`Authentication Error: Access Denied. Check credentials.`);
    }
});

document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));

// --- PIPELINES ---
itemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!globalUserRef) return;

    const titleInput = document.getElementById('item-title');
    const categoryInput = document.getElementById('item-category');
    const dueDateInput = document.getElementById('item-duedate');
    const priorityInput = document.getElementById('item-priority');

    try {
        await addDoc(collection(db, "management_items"), {
            userId: globalUserRef.uid,
            title: titleInput.value,
            category: categoryInput.value,
            dueDate: dueDateInput.value || null,
            priority: priorityInput.value,
            completed: false, 
            timestamp: Date.now()
        });
        
        titleInput.value = '';
        dueDateInput.value = '';
        priorityInput.value = 'Medium';
    } catch (err) {
        console.error("Failed writing document entry: ", err);
    }
});

let unsubscribeStream = () => {};
function initializeLiveStream() {
    unsubscribeStream(); 

    const baseQuery = query(
        collection(db, "management_items"),
        where("userId", "==", globalUserRef.uid),
        orderBy("timestamp", "desc")
    );

    unsubscribeStream = onSnapshot(baseQuery, (snapshot) => {
        activeCachedItems = [];
        snapshot.forEach((doc) => {
            activeCachedItems.push({ id: doc.id, ...doc.data() });
        });
        calculateMetrics(); 
        processAndRenderStream();
    });
}

// --- ENGINE CORE ANALYTICS ---
function calculateMetrics() {
    const total = activeCachedItems.length;
    const completed = activeCachedItems.filter(i => i.completed).length;
    const efficiency = total > 0 ? Math.round((completed / total) * 100) : 0;

    const localTodayStr = new Date().toISOString().split('T')[0];
    const rawTodayTasks = activeCachedItems.filter(i => i.dueDate === localTodayStr);
    const activeTodayTasksCount = rawTodayTasks.filter(i => !i.completed).length;

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-completed').innerText = completed;
    document.getElementById('stat-efficiency').innerText = `${efficiency}%`;
    document.getElementById('stat-today').innerText = activeTodayTasksCount;

    const todayCard = document.getElementById('stat-today-card');
    
    if (!todayFilterActive) {
        if (activeTodayTasksCount > 0) {
            todayCard.className = "glass p-4 rounded-xl border border-rose-500/20 flex items-center justify-between shadow-sm cursor-pointer transition-all duration-200 hover:scale-[1.01]";
        } else {
            todayCard.className = "glass p-4 rounded-xl border border-slate-800/60 flex items-center justify-between shadow-sm cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:border-slate-700";
        }
    }
}

window.toggleTodayFilter = function() {
    todayFilterActive = !todayFilterActive;
    const todayCard = document.getElementById('stat-today-card');
    const todayLabel = document.getElementById('stat-today-label');

    if (todayFilterActive) {
        todayCard.className = "glass p-4 rounded-xl border border-amber-500 bg-amber-500/5 flex items-center justify-between shadow-sm cursor-pointer transition-all duration-200";
        todayLabel.innerHTML = "Today <span class='text-[9px] lowercase opacity-60'>(Clear)</span>";
    } else {
        todayLabel.innerText = "Due Today";
        calculateMetrics();
    }

    processAndRenderStream();
};

window.switchTab = function(category) {
    currentCategoryFilter = category;
    todayFilterActive = false; 
    
    document.getElementById('stat-today-label').innerText = "Due Today";
    calculateMetrics();

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.className = "tab-btn text-xs font-medium px-3 py-1.5 rounded-lg transition-all shrink-0 text-slate-400 hover:text-slate-200 border border-transparent";
    });

    const activeTabButton = document.getElementById(`tab-${category}`);
    activeTabButton.className = "tab-btn text-xs font-medium px-3 py-1.5 rounded-lg transition-all shrink-0 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20";

    document.getElementById('stream-heading').innerText = `${category === 'all' ? 'Everything' : category} Stream`;
    processAndRenderStream();
};

searchBar.addEventListener('input', processAndRenderStream);
completionFilter.addEventListener('change', processAndRenderStream);

function processAndRenderStream() {
    dataStreamContainer.innerHTML = '';
    
    const searchTerms = searchBar.value.toLowerCase().trim();
    const completionSelection = completionFilter.value;
    const localTodayStr = new Date().toISOString().split('T')[0];

    let filtered = activeCachedItems;

    if (todayFilterActive) {
        filtered = filtered.filter(item => item.dueDate === localTodayStr);
        document.getElementById('stream-heading').innerText = "Today's Agenda";
    } else if (currentCategoryFilter !== 'all') {
        filtered = filtered.filter(item => item.category === currentCategoryFilter);
    }

    if (searchTerms !== '') {
        filtered = filtered.filter(item => item.title.toLowerCase().includes(searchTerms));
    }

    if (completionSelection === 'active') {
        filtered = filtered.filter(item => !item.completed);
    } else if (completionSelection === 'completed') {
        filtered = filtered.filter(item => item.completed);
    }

    document.getElementById('counter-badge').innerText = `${filtered.length} Items`;

    if (filtered.length === 0) {
        dataStreamContainer.innerHTML = `
            <div class="col-span-full py-8 flex flex-col items-center justify-center text-slate-600 border border-dashed border-slate-800/80 rounded-xl w-full">
                <i data-lucide="help-circle" class="w-6 h-6 mb-1 opacity-60"></i>
                <p class="text-xs">No matching matrix nodes layout found.</p>
            </div>`;
        lucide.createIcons();
        return;
    }

    filtered.forEach((item, index) => {
        const itemCard = document.createElement('div');
        
        let categoryColorMap = 'from-indigo-400 to-cyan-400';
        if (item.category === 'University') categoryColorMap = 'from-amber-400 to-orange-400';
        if (item.category === 'Work') categoryColorMap = 'from-emerald-400 to-teal-400';
        if (item.category === 'Misc') categoryColorMap = 'from-pink-400 to-purple-400';

        let priorityBadge = `<span class="text-[9px] font-mono px-1.5 py-0.5 rounded border bg-slate-950 border-emerald-500/20 text-emerald-500/90">Low</span>`;
        if (item.priority === 'Medium') priorityBadge = `<span class="text-[9px] font-mono px-1.5 py-0.5 rounded border bg-slate-950 border-amber-500/20 text-amber-400/90">Medium</span>`;
        if (item.priority === 'High') priorityBadge = `<span class="text-[9px] font-mono px-1.5 py-0.5 rounded border bg-slate-950 border-rose-500/20 text-rose-400/90 font-bold">High</span>`;

        let dueDateElement = '';
        if (item.dueDate) {
            const isOverdue = item.dueDate < localTodayStr && !item.completed;
            const dateObj = new Date(item.dueDate);
            const formattingClasses = isOverdue 
                ? 'text-rose-400 bg-rose-500/5 border-rose-500/10' 
                : 'text-slate-400 bg-slate-900 border-slate-800/80';

            dueDateElement = `
                <div class="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded mt-2 w-max border ${formattingClasses}">
                    <i data-lucide="${isOverdue ? 'alert-triangle' : 'clock'}" class="w-3 h-3"></i> 
                    <span>${dateObj.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                </div>`;
        }

        const completionCardStyles = item.completed 
            ? 'opacity-40 bg-slate-950/40 line-through text-slate-500 border-slate-900' 
            : 'border-slate-800/60 hover:border-slate-700/80 shadow-sm';

        itemCard.className = `glass p-4 rounded-xl flex flex-col justify-between border transform transition-all duration-200 opacity-0 translate-y-2 ${completionCardStyles}`;
        itemCard.style.animation = `fadeInCard 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards ${index * 0.03}s`;
        
        itemCard.innerHTML = `
            <div>
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <button class="toggle-complete-btn text-slate-600 hover:text-emerald-400 transition-colors" data-id="${item.id}" data-status="${item.completed}">
                            <i data-lucide="${item.completed ? 'check-square' : 'square'}" class="w-4 h-4"></i>
                        </button>
                        <span class="text-[9px] font-bold uppercase tracking-wider bg-gradient-to-r ${categoryColorMap} bg-clip-text text-transparent px-2 py-0.5 rounded bg-slate-900 border border-slate-800/40 font-mono">
                            ${item.category}
                        </span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        ${priorityBadge}
                        <button class="delete-btn text-slate-600 hover:text-rose-400 transition-colors p-0.5" data-id="${item.id}">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                </div>
                <h3 class="text-slate-200 text-sm tracking-wide leading-tight px-0.5">${item.title}</h3>
                ${dueDateElement}
            </div>
            <div class="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-600 font-mono">
                <span>ID: ${item.id.substring(0, 4)}</span>
                <span>${new Date(item.timestamp).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
            </div>
        `;

        itemCard.querySelector('.toggle-complete-btn').addEventListener('click', async (e) => {
            e.stopPropagation();
            const targetId = e.currentTarget.getAttribute('data-id');
            const currentStatus = e.currentTarget.getAttribute('data-status') === 'true';
            try {
                await updateDoc(doc(db, "management_items", targetId), { completed: !currentStatus });
            } catch (err) { console.error(err); }
        });

        itemCard.querySelector('.delete-btn').addEventListener('click', async (e) => {
            e.stopPropagation();
            const targetId = e.currentTarget.getAttribute('data-id');
            itemCard.classList.add('scale-95', 'opacity-0');
            setTimeout(async () => {
                try {
                    await deleteDoc(doc(db, "management_items", targetId));
                } catch (err) { console.error(err); }
            }, 150);
        });

        dataStreamContainer.appendChild(itemCard);
    });

    if (!document.getElementById('card-animations')) {
        const styleSheet = document.createElement("style");
        styleSheet.id = "card-animations";
        styleSheet.innerText = `@keyframes fadeInCard { to { opacity: 1; transform: translateY(0); } }`;
        document.head.appendChild(styleSheet);
    }

    lucide.createIcons();
}
