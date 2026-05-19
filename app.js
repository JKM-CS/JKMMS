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
    doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let currentCategoryFilter = 'all';
let globalUserRef = null;

const authScreen = document.getElementById('auth-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const itemForm = document.getElementById('item-form');
const dataStreamContainer = document.getElementById('data-stream');

// --- AUTH STATE MONITORING AND INTERACTIVE SHIFTS ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        globalUserRef = user;
        document.getElementById('user-display').innerText = user.email;
        
        // Dynamic structural transitions
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

// Capture and process user authorizations
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        alert(`Authentication Error: ${error.message}`);
    }
});

document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));

// --- REAL-TIME FIRESTORE WORKFLOW PIPELINES ---
itemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!globalUserRef) return;

    const titleInput = document.getElementById('item-title');
    const categoryInput = document.getElementById('item-category');

    try {
        await addDoc(collection(db, "management_items"), {
            userId: globalUserRef.uid,
            title: titleInput.value,
            category: categoryInput.value,
            timestamp: Date.now()
        });
        titleInput.value = '';
    } catch (err) {
        console.error("Failed writing entry records: ", err);
    }
});

let unsubscribeStream = () => {};
function initializeLiveStream() {
    unsubscribeStream(); 

    // Query elements mapped directly and exclusively to the authenticated user ID reference
    const baseQuery = query(
        collection(db, "management_items"),
        where("userId", "==", globalUserRef.uid),
        orderBy("timestamp", "desc")
    );

    unsubscribeStream = onSnapshot(baseQuery, (snapshot) => {
        let items = [];
        snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
        });
        renderDashboardStream(items);
    });
}

// Global scope binding for inline HTML category tab click handlers
window.switchTab = function(category) {
    currentCategoryFilter = category;
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-indigo-600/10', 'text-indigo-400', 'border-indigo-500/20');
        btn.classList.add('text-slate-400', 'hover:text-slate-200');
    });

    const activeTabButton = document.getElementById(`tab-${category}`);
    activeTabButton.classList.remove('text-slate-400', 'hover:text-slate-200');
    activeTabButton.classList.add('bg-indigo-600/10', 'text-indigo-400', 'border-indigo-500/20');

    document.getElementById('stream-heading').innerText = `${category.charAt(0).toUpperCase() + category.slice(1)} Stream`;
    initializeLiveStream(); 
};

// --- DYNAMIC CARD GENERATOR AND ANIMATIONS ---
function renderDashboardStream(items) {
    dataStreamContainer.innerHTML = '';
    
    const filteredItems = currentCategoryFilter === 'all' 
        ? items 
        : items.filter(i => i.category === currentCategoryFilter);

    document.getElementById('counter-badge').innerText = `${filteredItems.length} Items Listed`;

    if (filteredItems.length === 0) {
        dataStreamContainer.innerHTML = `
            <div class="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                <i data-lucide="inbox" class="w-10 h-10 mb-2 stroke-[1.5]"></i>
                <p class="text-sm">Clean workspace. Nothing logged under this category.</p>
            </div>`;
        lucide.createIcons();
        return;
    }

    filteredItems.forEach((item, index) => {
        const itemCard = document.createElement('div');
        
        let indicatorColors = 'from-indigo-500 to-cyan-400';
        if (item.category === 'University') indicatorColors = 'from-amber-400 to-orange-500';
        if (item.category === 'Work') indicatorColors = 'from-emerald-400 to-teal-500';

        itemCard.className = `glass p-5 rounded-2xl flex flex-col justify-between border border-slate-800/80 hover:border-slate-700/60 shadow-lg transform transition-all duration-300 translate-y-4 opacity-0 hover:-translate-y-1 hover:shadow-2xl`;
        itemCard.style.animation = `fadeInCard 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards ${index * 0.05}s`;
        
        itemCard.innerHTML = `
            <div>
                <div class="flex items-center justify-between mb-3">
                    <span class="text-xs font-bold uppercase tracking-wider bg-gradient-to-r ${indicatorColors} bg-clip-text text-transparent px-2.5 py-0.5 rounded-md bg-slate-900/80 border border-slate-800">
                        ${item.category}
                    </span>
                    <button class="delete-btn text-slate-500 hover:text-rose-400 transition-colors p-1" data-id="${item.id}">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
                <h3 class="text-slate-100 font-medium tracking-wide text-base leading-snug">${item.title}</h3>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>ID: ${item.id.substring(0, 8)}...</span>
                <span>${new Date(item.timestamp).toLocaleDateString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}</span>
            </div>
        `;

        // Smooth fade out and delete document processing
        itemCard.querySelector('.delete-btn').addEventListener('click', async (e) => {
            const targetId = e.currentTarget.getAttribute('data-id');
            itemCard.classList.add('scale-95', 'opacity-0');
            setTimeout(async () => {
                try {
                    await deleteDoc(doc(db, "management_items", targetId));
                } catch (err) {
                    console.error("Action error deleting document identifier: ", err);
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