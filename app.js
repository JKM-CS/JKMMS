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

// Global Filter Configurations
let currentCategoryFilter = 'all';
let globalUserRef = null;
let activeCachedItems = [];
let todayFilterActive = false; // Toggle tracker for interactive dashboard metric card

const authScreen = document.getElementById('auth-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const itemForm = document.getElementById('item-form');
const dataStreamContainer = document.getElementById('data-stream');
const searchBar = document.getElementById('search-bar');
const completionFilter = document.getElementById('completion-filter');

// --- AUTH SYSTEM HANDLING ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        globalUserRef = user;
        document.getElementById('user-display').innerText = user.email.split('@')[0].toUpperCase();
        
        authScreen.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
        setTimeout(() => {
            authScreen.classList.add('hidden');
            dashboardScreen.classList.remove('hidden');
            setTimeout(() => {
                dashboardScreen.classList.remove('opacity-0', 'translate-y-4');
            }, 50);
        }, 400);

        initializeLiveStream();
    } else {
        globalUserRef = null;
        dashboardScreen.classList.add('opacity-0', 'translate-y-4');
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
    const usernameInput = document.getElementById('login-username').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    
    // SMART LOGIN CHECK: If you typed a full email, use it. Otherwise, fallback to the local system mapping.
    const finalEmail = usernameInput.includes('@') ? usernameInput : `${usernameInput}@lifeos.local`;
    
    try {
        await signInWithEmailAndPassword(auth, finalEmail, password);
    } catch (error) {
        console.error("Auth Failure Detail:", error.code, error.message);
        alert(`Authentication Error: Access Denied. Check credentials or Firebase console configurations.`);
    }
});

document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));

// --- REAL-TIME DATASET PIPELINES ---
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
        console.error("Failed writing dataset row entry: ", err);
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

// --- CORE ANALYTICS ENGINE ---
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
    const todayIconBg = document.getElementById('stat-today-icon-bg');
    
    if (!todayFilterActive) {
        if (activeTodayTasksCount > 0) {
            todayCard.className = "glass p-5 rounded-2xl border border-rose-500/30 flex items-center justify-between shadow-lg cursor-pointer group transition-all duration-300 hover:scale-[1.02]";
            todayIconBg.className = "p-3 bg-rose-500/10 text-rose-400 rounded-xl group-hover:rotate-12 transition-all duration-300";
        } else {
            todayCard.className = "glass p-5 rounded-2xl border border-slate-800/80 flex items-center justify-between shadow-lg cursor-pointer group transition-all duration-300 hover:scale-[1.02] hover:border-amber-500/30";
            todayIconBg.className = "p-3 bg-slate-800 text-slate-400 rounded-xl group-hover:rotate-12 transition-all duration-300";
        }
    }
}

window.toggleTodayFilter = function() {
    todayFilterActive = !todayFilterActive;
    const todayCard = document.getElementById('stat-today-card');
    const todayLabel = document.getElementById('stat-today-label');

    if (todayFilterActive) {
        todayCard.classList.remove('border-slate-800/80', 'border-rose-500/30');
        todayCard.classList.add('border-amber-500', 'bg-amber-500/5');
        todayLabel.innerHTML = "Filtering: Due Today <span class='text-[10px] lowercase'>(Click clear)</span>";
    } else {
        todayCard.classList.remove('border-amber-500', 'bg-amber-500/5');
        todayLabel.innerText = "Due Today";
    }

    processAndRenderStream();
};

window.switchTab = function(category) {
    currentCategoryFilter = category;
    todayFilterActive = false; 
    
    const todayCard = document.getElementById('stat-today-card');
    document.getElementById('stat-today-label').innerText = "Due Today";
    todayCard.classList.remove('border-amber-500', 'bg-amber-500/5');

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-indigo-600/10', 'text-indigo-400', 'border-indigo-500/20');
        btn.classList.add('text-slate-400', 'hover:text-slate-200');
    });

    const activeTabButton = document.getElementById(`tab-${category}`);
    activeTabButton.classList.remove('text-slate-400', 'hover:text-slate-200');
    activeTabButton.classList.add('bg-indigo-600/10', 'text-indigo-400', 'border-indigo-500/20');

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
        document.getElementById('stream-heading').innerText = "Today's Agenda Stream";
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

    document.getElementById('counter-badge').innerText = `${filtered.length} Items Evaluated`;

    if (filtered.length === 0) {
        dataStreamContainer.innerHTML = `
            <div class="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl w-full">
                <i data-lucide="help-circle" class="w-10 h-10 mb-2 stroke-[1.5]"></i>
                <p class="text-sm">No workspace parameters matched your layout criteria.</p>
            </div>`;
        lucide.createIcons();
        return;
    }

    filtered.forEach((item, index) => {
        const itemCard = document.createElement('div');
        
        let categoryColorMap = 'from-indigo-500 to-cyan-400';
        if (item.category === 'University') categoryColorMap = 'from-amber-400 to-orange-500';
        if (item.category === 'Work') categoryColorMap = 'from-emerald-400 to-teal-500';
        if (item.category === 'Misc') categoryColorMap = 'from-pink-400 to-purple-500';

        let priorityBadge = `<span class="text-[10px] px-2 py-0.5 rounded border bg-slate-900 border-emerald-500/30 text-emerald-400">Low</span>`;
        if (item.priority === 'Medium') priorityBadge = `<span class="text-[10px] px-2 py-0.5 rounded border bg-slate-900 border-amber-500/30 text-amber-400">Medium</span>`;
        if (item.priority === 'High') priorityBadge = `<span class="text-[10px] px-2 py-0.5 rounded border bg-slate-900 border-rose-500/30 text-rose-400 font-bold">High</span>`;

        let dueDateElement = '';
        if (item.dueDate) {
            const isOverdue = item.dueDate < localTodayStr && !item.completed;
            const dateObj = new Date(item.dueDate);
            const formattingClasses = isOverdue 
                ? 'text-rose-400 bg-rose-500/5 border-rose-500/20' 
                : 'text-amber-400/80 bg-amber-500/5 border-amber-500/10';

            dueDateElement = `
                <div class="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md mt-2 w-max border ${formattingClasses}">
                    <i data-lucide="${isOverdue ? 'alert-triangle' : 'clock'}" class="w-3 h-3"></i> 
                    ${isOverdue ? 'Overdue' : 'Due'}: ${dateObj.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                </div>`;
        }

        const completionCardStyles = item.completed 
            ? 'opacity-40 bg-slate-900/20 line-through text-slate-500 border-slate-900/40' 
            : 'border-slate-800/80 hover:border-slate-700/60 shadow-lg';

        itemCard.className = `glass p-5 rounded-2xl flex flex-col justify-between border shadow-lg transform transition-all duration-300 translate-y-4 opacity-0 hover:-translate-y-1 hover:shadow-2xl ${completionCardStyles}`;
        itemCard.style.animation = `fadeInCard 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards ${index * 0.05}s`;
        
        itemCard.innerHTML = `
            <div>
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                        <button class="toggle-complete-btn p-1 rounded-md transition-colors ${item.completed ? 'text-emerald-400 hover:text-slate-400' : 'text-slate-500 hover:text-emerald-400'}" data-id="${item.id}" data-status="${item.completed}">
                            <i data-lucide="${item.completed ? 'check-square' : 'square'}" class="w-5 h-5"></i>
                        </button>
                        <span class="text-xs font-bold uppercase tracking-wider bg-gradient-to-r ${categoryColorMap} bg-clip-text text-transparent px-2.5 py-0.5 rounded-md bg-slate-900/80 border border-slate-800">
                            ${item.category}
                        </span>
                    </div>
                    <div class="flex items-center gap-2">
                        ${priorityBadge}
                        <button class="delete-btn text-slate-500 hover:text-rose-400 transition-colors p-1" data-id="${item.id}">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                <h3 class="text-slate-100 font-medium tracking-wide text-base leading-snug px-1">${item.title}</h3>
                ${dueDateElement}
            </div>
            <div class="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Ref: ${item.id.substring(0, 5)}</span>
                <span>${new Date(item.timestamp).toLocaleDateString(undefined, {month: 'short', day: 'numeric', hour: '2-digit'})}</span>
            </div>
        `;

        itemCard.querySelector('.toggle-complete-btn').addEventListener('click', async (e) => {
            e.stopPropagation();
            const targetId = e.currentTarget.getAttribute('data-id');
            const currentStatus = e.currentTarget.getAttribute('data-status') === 'true';
            try {
                await updateDoc(doc(db, "management_items", targetId), {
                    completed: !currentStatus
                });
            } catch (err) {
                console.error("Error setting completion updates: ", err);
            }
        });

        itemCard.querySelector('.delete-btn').addEventListener('click', async (e) => {
            e.stopPropagation();
            const targetId = e.currentTarget.getAttribute('data-id');
            itemCard.classList.add('scale-95', 'opacity-0');
            setTimeout(async () => {
                try {
                    await deleteDoc(doc(db, "management_items", targetId));
                } catch (err) {
                    console.error("Action error deleting document entry reference: ", err);
                }
            }, 200);
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
