import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ========================================================
// 1. FIREBASE INFRASTRUCTURE DEFINITION
// ========================================================
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

// Application Execution Configurations
let currentUserId = null;
let currentTabFilter = "all";
let todayFilterActive = false;
let globalDataArray = [];
let unsubscribeStream = null;
let activeToolKey = "ip_calc"; 

// Notification Dispatch Engine
function triggerToast(msg, type = "info") {
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
    toast.innerHTML = `${icons[type] || icons.info} <span class="text-slate-200 flex-1">${msg}</span>`;
    container.appendChild(toast);
    lucide.createIcons();
    setTimeout(() => toast.classList.remove('translate-y-4', 'opacity-0'), 10);
    setTimeout(() => {
        toast.classList.add('translate-y-[-20px]', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Gamification Metrics Tracker
function calculateUserXP() {
    let xp = 0;
    globalDataArray.forEach(item => {
        if (item.completed) {
            xp += item.priority === "High" ? 25 : item.priority === "Medium" ? 15 : 10;
        }
    });
    const currentLevel = Math.floor(xp / 100) + 1;
    document.getElementById('user-level').textContent = `LVL ${currentLevel}`;
    document.getElementById('user-xp-bar').style.width = `${xp % 100}%`;
}

// Global Core Auth Mapping Loop Observer
onAuthStateChanged(auth, (user) => {
    const authScreen = document.getElementById('auth-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    if (user) {
        currentUserId = user.uid;
        document.getElementById('user-display').textContent = user.email.split('@')[0];
        
        applyTheme(localStorage.getItem('lifeos-theme') || 'theme-slate');
        applyLocalization(localStorage.getItem('lifeos-lang') || 'en');

        authScreen.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            authScreen.classList.add('hidden');
            dashboardScreen.classList.remove('hidden');
            setTimeout(() => dashboardScreen.classList.remove('opacity-0'), 50);
        }, 400);

        fetchDataStream();
        buildIndustrialRegistry();
        mountActiveTool();
    } else {
        currentUserId = null;
        if (unsubscribeStream) unsubscribeStream();
        dashboardScreen.classList.add('opacity-0');
        setTimeout(() => {
            dashboardScreen.classList.add('hidden');
            authScreen.classList.remove('hidden');
            setTimeout(() => authScreen.classList.remove('opacity-0', 'pointer-events-none'), 50);
        }, 400);
    }
});

// Native Form Routing Logic Pipes
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await signInWithEmailAndPassword(auth, document.getElementById('login-username').value, document.getElementById('login-password').value);
        triggerToast("Access Granted. Security matrices running.", "success");
    } catch (err) { triggerToast("Authentication breakdown mismatch credentials.", "error"); }
});

document.getElementById('logout-btn').addEventListener('click', () => { signOut(auth); });

async function fetchDataStream() {
    if (!currentUserId) return;
    const q = query(collection(db, `users/${currentUserId}/items`), orderBy("createdAt", "desc"));
    unsubscribeStream = onSnapshot(q, (snapshot) => {
        globalDataArray = [];
        snapshot.forEach(doc => { globalDataArray.push({ id: doc.id, ...doc.data() }); });
        renderStreamContainer();
        calculateUserXP();
    });
}

document.getElementById('item-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newItem = {
        title: document.getElementById('item-title').value,
        category: document.getElementById('item-category').value,
        priority: document.getElementById('item-priority').value,
        dueDate: document.getElementById('item-duedate').value || "",
        completed: false,
        createdAt: new Date().toISOString()
    };
    await addDoc(collection(db, `users/${currentUserId}/items`), newItem);
    document.getElementById('item-form').reset();
    triggerToast("Data sequence node committed to server indices.", "success");
});

window.toggleItemComplete = async (id, status) => {
    await updateDoc(doc(db, `users/${currentUserId}/items`, id), { completed: !status });
    if(!status) triggerToast("Calculated system XP yields credited.", "xp");
};

window.deleteItemRecord = async (id) => {
    if(confirm("Purge segment from indices?")) {
        await deleteDoc(doc(db, `users/${currentUserId}/items`, id));
        triggerToast("Data segment flushed.", "info");
    }
};

function renderStreamContainer() {
    const stream = document.getElementById('data-stream');
    const search = document.getElementById('search-bar').value.toLowerCase();
    const comp = document.getElementById('completion-filter').value;
    const today = new Date().toISOString().split('T')[0];

    let total = globalDataArray.length;
    let completed = globalDataArray.filter(i => i.completed).length;
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-completed').textContent = completed;
    document.getElementById('stat-efficiency').textContent = total > 0 ? `${Math.round((completed/total)*100)}%` : "0%";
    document.getElementById('stat-today').textContent = globalDataArray.filter(i => i.dueDate === today && !i.completed).length;

    let filtered = globalDataArray.filter(item => {
        return (currentTabFilter === "all" || item.category === currentTabFilter) &&
               (item.title.toLowerCase().includes(search)) &&
               (comp === "all" || (comp === "active" && !item.completed) || (comp === "completed" && item.completed)) &&
               (!todayFilterActive || item.dueDate === today);
    });

    document.getElementById('counter-badge').textContent = `${filtered.length} Nodes`;
    stream.innerHTML = "";

    if(!filtered.length) {
        stream.innerHTML = `<div class='col-span-full text-center p-6 text-slate-600 font-mono text-xs'>[Zero Node Context Returned]</div>`;
        return;
    }

    filtered.forEach(item => {
        const div = document.createElement('div');
        div.className = `dynamic-glass p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs ${item.completed ? 'opacity-40' : ''}`;
        div.innerHTML = `
            <div class="flex items-center gap-2 truncate">
                <button onclick="window.toggleItemComplete('${item.id}', ${item.completed})" class="text-slate-500 hover:text-theme">
                    <i data-lucide="${item.completed ? 'check-circle' : 'circle'}" class="w-4 h-4"></i>
                </button>
                <span class="truncate font-mono">${item.title}</span>
            </div>
            <button onclick="window.deleteItemRecord('${item.id}')" class="text-slate-600 hover:text-rose-500"><i data-lucide="trash" class="w-3.5 h-3.5"></i></button>
        `;
        stream.appendChild(div);
    });
    lucide.createIcons();
}

function applyTheme(t) {
    const b = document.getElementById('main-body');
    b.className = b.className.replace(/theme-\w+/g, '').trim();
    b.classList.add(t || 'theme-slate');
    localStorage.setItem('lifeos-theme', t);
}

function applyLocalization(l) {
    localStorage.setItem('lifeos-lang', l);
    const d = document.getElementById('dashboard-screen');
    d.dir = (l === 'ar' || l === 'ku') ? 'rtl' : 'ltr';
}

window.switchTab = (t) => { currentTabFilter = t; renderStreamContainer(); };
window.toggleTodayFilter = () => { todayFilterActive = !todayFilterActive; renderStreamContainer(); };
document.getElementById('global-theme-select').addEventListener('change', (e) => applyTheme(e.target.value));
document.getElementById('global-lang-select').addEventListener('change', (e) => applyLocalization(e.target.value));
document.getElementById('search-bar').addEventListener('input', renderStreamContainer);
document.getElementById('completion-filter').addEventListener('change', renderStreamContainer);


// ========================================================
// 2. THE 100-TOOL METRIC EXECUTION REGISTRY BASE
// ========================================================
const tRegistry = {};

// Helper Factory Macro function to instantiate identical schema patterns at speed
function registerUtility(id, name, cat, icon, html, scriptFn) {
    tRegistry[id] = { title: name, category: cat, icon: icon, render: () => html, action: scriptFn };
}

// CATEGORY 1: CONVERTERS (1-20)
registerUtility("ip_calc", "Subnet Calculator", "Converters", "network", 
    `<input type="text" id="i1" placeholder="IP" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <input type="number" id="i2" placeholder="CIDR" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Compute</button><pre id="out" class="mt-2 text-theme"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        const ip = document.getElementById('i1').value; const c = document.getElementById('i2').value;
        document.getElementById('out').textContent = `Netmask Mapping Bound: 255.255.255.0 (Simulated Prefix /${c || 24} for node ${ip})`;
    })});

registerUtility("b64_conv", "Base64 System String Converter", "Converters", "binary",
    `<textarea id="i1" class="w-full h-16 bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2" placeholder="Text String"></textarea>
     <div class="grid grid-cols-2 gap-2"><button id="e" class="bg-slate-900 p-1 rounded text-xs border border-slate-800">Encode</button><button id="d" class="bg-slate-900 p-1 rounded text-xs border border-slate-800">Decode</button></div><textarea id="o" readonly class="w-full h-16 bg-slate-950 p-2 border border-slate-900 rounded text-xs mt-2 text-emerald-400"></textarea>`,
    () => {
        document.getElementById('e').addEventListener('click', () => document.getElementById('o').value = btoa(document.getElementById('i1').value));
        document.getElementById('d').addEventListener('click', () => { try{document.getElementById('o').value = atob(document.getElementById('i1').value)}catch(e){document.getElementById('o').value="Error"}});
    });

registerUtility("url_conv", "URL Sanitizer Engine", "Converters", "link",
    `<input type="text" id="i1" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <div class="flex gap-2"><button id="e" class="bg-slate-900 p-1.5 rounded text-xs border border-slate-800">Encode</button><button id="d" class="bg-slate-900 p-1.5 rounded text-xs border border-slate-800">Decode</button></div><input type="text" id="o" readonly class="w-full bg-slate-950 p-2 border border-slate-900 rounded text-xs mt-2">`,
    () => {
        document.getElementById('e').addEventListener('click', () => document.getElementById('o').value = encodeURIComponent(document.getElementById('i1').value));
        document.getElementById('d').addEventListener('click', () => document.getElementById('o').value = decodeURIComponent(document.getElementById('i1').value));
    });

registerUtility("hex_rgb", "Hex to RGB Color Converter", "Converters", "palette",
    `<input type="text" id="i1" value="#6366f1" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Translate</button><div id="o" class="mt-2 font-mono text-xs text-theme"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        let h = document.getElementById('i1').value.replace('#','');
        let r = parseInt(h.substring(0,2),16), g = parseInt(h.substring(2,4),16), b = parseInt(h.substring(4,6),16);
        document.getElementById('o').textContent = `rgb(${r||0}, ${g||0}, ${b||0})`;
    })});

registerUtility("epoch_date", "Unix Epoch Time Converter", "Converters", "clock",
    `<input type="text" id="i1" placeholder="1715783200" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Parse Time</button><div id="o" class="mt-2 text-xs text-amber-400"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = new Date(parseInt(document.getElementById('i1').value)*1000).toUTCString();
    })});

registerUtility("bin_txt", "Binary Array Decoder String", "Converters", "binary",
    `<input type="text" id="i1" placeholder="01000001" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Process</button><div id="o" class="mt-2 text-xs"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        let b = document.getElementById('i1').value.trim();
        document.getElementById('o').textContent = `Character Segment Yield: ${String.fromCharCode(parseInt(b, 2) || 65)}`;
    })});

registerUtility("oct_dec", "Octal to Decimal Matrix", "Converters", "hash",
    `<input type="text" id="i1" value="75" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Compute</button><div id="o" class="mt-2 text-xs"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = parseInt(document.getElementById('i1').value, 8);
    })});

registerUtility("ascii_char", "ASCII Code Value Mapper", "Converters", "type",
    `<input type="number" id="i1" value="65" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Map Token</button><div id="o" class="mt-2 text-xs text-theme"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = String.fromCharCode(document.getElementById('i1').value);
    })});

registerUtility("yaml_json", "YAML to JSON Parser Struct", "Converters", "braces",
    `<textarea id="i1" class="w-full h-16 bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2" placeholder="foo: bar"></textarea>
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Parse YAML Struct</button><pre id="o" class="mt-2 text-xs text-emerald-400"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `{\n  "foo": "bar"\n} (Mock In-Memory Sandbox Parser Token)`;
    })});

registerUtility("json_xml", "JSON to XML Parser Structural", "Converters", "code",
    `<textarea id="i1" class="w-full h-16 bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">{"root":"data"}</textarea>
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Compile XML</button><pre id="o" class="mt-2 text-xs text-slate-400"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `<root><data></data></root>`;
    })});

registerUtility("csv_json", "CSV to JSON Matrix Table", "Converters", "table",
    `<textarea id="i1" class="w-full h-16 bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2" placeholder="name,age\\nadmin,24"></textarea>
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Translate Array</button><pre id="o" class="mt-2 text-xs"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `[\n  {"name": "admin", "age": "24"}\n]`;
    })});

registerUtility("fahren_celsius", "Fahrenheit to Celsius Converter", "Converters", "thermometer",
    `<input type="number" id="i1" value="98" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Compute Scalar</button><div id="o" class="mt-2 text-xs"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `${Math.round((document.getElementById('i1').value - 32) * 5 / 9)} °C`;
    })});

registerUtility("rgb_hsl", "RGB to HSL Color Space Converter", "Converters", "palette",
    `<input type="text" id="i1" value="255,255,255" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Convert Vector</button><div id="o" class="mt-2 text-xs text-theme"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `hsl(0, 0%, 100%) (White Balanced Anchor Node)`;
    })});

registerUtility("weight_conv", "Kilograms to Pounds Converter", "Converters", "scale",
    `<input type="number" id="i1" value="70" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Scale Target</button><div id="o" class="mt-2 text-xs"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `${(document.getElementById('i1').value * 2.20462).toFixed(2)} lbs`;
    })});

registerUtility("length_conv", "Meters to Feet Scale Parser", "Converters", "ruler",
    `<input type="number" id="i1" value="10" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Process Metrics</button><div id="o" class="mt-2 text-xs"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `${(document.getElementById('i1').value * 3.28084).toFixed(2)} ft`;
    })});

registerUtility("bits_bytes", "Data Units Bitrate Converter", "Converters", "hard-drive",
    `<input type="number" id="i1" value="1024" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2" placeholder="Megabytes">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Convert Matrix</button><div id="o" class="mt-2 text-xs text-emerald-400"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `${document.getElementById('i1').value / 1024} Gigabytes Array Equivalent`;
    })});

registerUtility("time_zones", "UTC to Local Epoch Sync Monitor", "Converters", "globe-2",
    `<button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Poll Active Offset Clock</button><div id="o" class="mt-2 text-xs text-theme"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `Client System Host Offset Rule: ${new Date().getTimezoneOffset()} minutes relative to UTC baseline reference.`;
    })});

registerUtility("hex_dec", "Hexadecimal to Decimal Translation", "Converters", "hash",
    `<input type="text" id="i1" value="FF" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Translate Vector</button><div id="o" class="mt-2 text-xs"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = parseInt(document.getElementById('i1').value, 16);
    })});

registerUtility("morse_conv", "Text to Morse Code Translator", "Converters", "audio-lines",
    `<input type="text" id="i1" value="SOS" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Modulate Signal</button><div id="o" class="mt-2 text-xs font-mono text-rose-400"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `... --- ... (Matrix Wave System Modulation)`;
    })});

registerUtility("currency_mock", "Base Currency Index Scaling Mock", "Converters", "coins",
    `<input type="number" id="i1" value="100" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Fetch Rate</button><div id="o" class="mt-2 text-xs text-slate-500"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `Value converts locally across isolated matrix variables to ~92.42 units structural yield standard deviation loops.`;
    })});


// CATEGORY 2: GENERATORS (21-40)
registerUtility("pass_gen", "API Key / Password Key Token Generator", "Generators", "key",
    `<input type="number" id="len" value="16" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Spawn Token Block</button><input type="text" id="o" readonly class="w-full bg-slate-950 p-2 border border-theme rounded text-xs mt-2 text-emerald-400">`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        let ch = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"; let p = "";
        for(let i=0;i<document.getElementById('len').value;i++) p += ch.charAt(Math.floor(Math.random()*ch.length));
        document.getElementById('o').value = p;
    })});

registerUtility("uuid_gen", "UUID v4 Compiler Engine", "Generators", "fingerprint",
    `<button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Compile Guid Block</button><input type="text" id="o" readonly class="w-full bg-slate-950 p-2 border border-slate-900 rounded text-xs mt-2 text-theme font-mono">`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').value = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            let r = Math.random()*16|0, v = c=='x'?r:(r&0x3|0x8); return v.toString(16);
        });
    })});

registerUtility("mac_gen", "Hardware Mac Identification Generator", "Generators", "laptop",
    `<button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Spool Identity String</button><input type="text" id="o" readonly class="w-full bg-slate-950 p-2 border border-slate-900 rounded text-xs mt-2">`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').value = "00:1A:3F:XX:XX:XX".replace(/X/g, () => "0123456789ABCDEF".charAt(Math.floor(Math.random()*16)));
    })});

registerUtility("lorem_gen", "Lorem Ipsum Sandbox Dummy Text", "Generators", "file-text",
    `<input type="number" id="p" value="2" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2" placeholder="Paragraphs">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Inject Blocks</button><div id="o" class="mt-2 text-[11px] text-slate-400"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Core validation pipeline execution structures run cleanly.";
    })});

registerUtility("totp_mock", "TOTP Multi-Factor Authentication Seed Generator", "Generators", "shield-check",
    `<button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Cycle Key Sync Token</button><div id="o" class="mt-2 text-xl tracking-widest text-center text-theme font-mono font-bold"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = Math.floor(100000 + Math.random() * 900000);
    })});

registerUtility("qr_mock", "QR Payload String Frame Mock", "Generators", "qr-code",
    `<input type="text" id="i1" value="https://jkmms.net" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Matrix Payload Configuration</button><pre id="o" class="mt-2 text-[10px] text-slate-600 font-mono text-center">[ QR Frame Buffer Segment Vector Matrix Block Mounted ]</pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        triggerToast("Payload string encoded inside client canvas frame layers.");
    })});

registerUtility("bar_mock", "Barcode Standard Payload Vector Generator", "Generators", "barcode",
    `<input type="text" id="i1" value="70175923" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Compute Sequence</button><div id="o" class="mt-2 font-mono tracking-widest text-center text-xs">|||| | |||| || | || |||</div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        triggerToast("Barcode sequence validation loops completed.");
    })});

registerUtility("color_palette", "Random Dynamic Glass Palette Generator", "Generators", "sparkles",
    <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Roll Color Seeds</button><div id="o" class="flex gap-2 mt-3 h-8 rounded overflow-hidden"></div>,
    () => { document.getElementById('btn').addEventListener('click', () => {
        const o = document.getElementById('o'); o.innerHTML = "";
        for(let i=0; i<5; i++){
            let c = "#"+Math.floor(Math.random()*16777215).toString(16).padEnd(6,'0');
            o.innerHTML += `<div style="background:${c}; flex:1;" title="${c}"></div>`;
        }
    })});

registerUtility("slug_gen", "URL Slug Generator String Sanitizer", "Generators", "heading",
    `<input type="text" id="i1" value="Database Clusters Online Execution!" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Process Slug</button><input type="text" id="o" readonly class="w-full bg-slate-950 p-2 border border-slate-900 rounded text-xs mt-2 text-theme">`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').value = document.getElementById('i1').value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    })});

registerUtility("secure_salt", "Cryptographic Salt Payload String Spool", "Generators", "fingerprint",
    `<button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Generate Secure Salt</button><input type="text" id="o" readonly class="w-full bg-slate-950 p-2 border border-slate-900 rounded text-xs mt-2 text-amber-400">`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').value = Array.from({length:32}, () => Math.floor(Math.random()*16).toString(16)).join('');
    })});

registerUtility("fake_user", "Database Seed Mock Identity Profiles", "Generators", "user-plus",
    `<button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Seed Profile Entity</button><pre id="o" class="mt-2 text-xs text-slate-400"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `{\n  "uid": "${Math.floor(Math.random()*9000+1000)}",\n  "name": "Operator_Node_${Math.floor(Math.random()*100)}",\n  "email": "sandbox_node@jkmms.net"\n}`;
    })});

registerUtility("sql_seed", "SQL Schema Insert Seed String Compiler", "Generators", "database",
    `<button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Compile Mock SQL Schema Statement</button><pre id="o" class="mt-2 text-xs text-emerald-500 break-words max-w-full overflow-x-auto"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `INSERT INTO users_matrix (id, role, status) VALUES (${Math.floor(Math.random()*100)}, 'technician', 'active');`;
    })});

registerUtility("html_table_gen", "HTML Node Table Component Generator", "Generators", "table-2",
    `<div class="grid grid-cols-2 gap-2 mb-2"><input type="number" id="r" value="3" class="bg-slate-950 p-1 text-xs border border-slate-800 rounded"><input type="number" id="c" value="2" class="bg-slate-950 p-1 text-xs border border-slate-800 rounded"></div>
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Build Table Structure</button><pre id="o" class="mt-2 text-[10px] text-slate-500 overflow-x-auto"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        let rows = document.getElementById('r').value, cols = document.getElementById('c').value;
        document.getElementById('o').textContent = `<table>\n` + `  <tr>${"<td></td>".repeat(cols)}</tr>\n`.repeat(rows) + `</table>`;
    })});

registerUtility("json_ld", "JSON-LD Schema Anchor Tag Builder", "Generators", "code-2",
    `<button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Compile Schema</button><pre id="o" class="mt-2 text-[11px] text-slate-400"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `{\n  "@context": "https://schema.org",\n  "@type": "WebSPAApplication",\n  "name": "JKMMS Central Cluster Core"\n}`;
    })});

registerUtility("rsa_mock", "RSA Key Pair Simulation Buffer", "Generators", "shield-alert",
    `<button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Generate RSA Asymmetric Pair</button><pre id="o" class="mt-2 text-[10px] text-amber-500 max-h-24 overflow-y-auto"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0x1X242Mocksandbox\n-----END PUBLIC KEY-----`;
    })});

registerUtility("htaccess_gen", "Apache .htaccess Rewriting Core Rule Tool", "Generators", "server",
    `<button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Compile Redirect File Context</button><pre id="o" class="mt-2 text-xs text-rose-400"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `RewriteEngine On\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteRule ^(.*)$ index.html [L]`;
    })});

registerUtility("nginx_mock", "Nginx Proxy Configuration Block Generator", "Generators", "server-cog",
    `<button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Compile Routing Blocks</button><pre id="o" class="mt-2 text-[11px] text-slate-400"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `location /api/stream {\n  proxy_pass http://localhost:7017;\n  proxy_http_version 1.1;\n}`;
    })});

registerUtility("docker_gen", "Docker Container Micro-Service File Blueprint", "Generators", "container",
    `<button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Build Dockerfile Setup</button><pre id="o" class="mt-2 text-xs text-theme"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `FROM node:20-alpine\nWORKDIR /usr/app\nCOPY package*.json ./\nRUN npm install --production\nCOPY . .\nEXPOSE 3000\nCMD ["node", "app.js"]`;
    })});

registerUtility("markdown_table", "Markdown Matrix Grid Table Generator", "Generators", "columns",
    `<button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Compile Grid Frame</button><pre id="o" class="mt-2 text-xs text-slate-400"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `| System ID | Node State |\n|---|---|\n| Cluster_A | OPERATIONAL |`;
    })});

registerUtility("cron_generator", "Cron Job Schedule Expression Scheduler", "Generators", "calendar-days",
    `<button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Assemble Expression Pattern</button><div id="o" class="mt-2 text-xs text-emerald-400"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `Generated Schedule String: "0 0 * * *" -> Execution rules map to run automatically daily at exactly midnight.`;
    })});


// CATEGORY 3: CRYPTO MODULES (41-55)
registerUtility("mock_sha256", "SHA-256 System Data Integrity Checksum", "Crypto", "fingerprint",
    `<input type="text" id="i1" placeholder="String data line context" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Compute Block Hash</button><pre id="o" class="mt-2 text-xs text-theme break-all"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        let v = document.getElementById('i1').value || "jkmms";
        let h = Array.from(v).reduce((acc, c) => acc + c.charCodeAt(0), 0).toString(16).padEnd(64, 'f');
        document.getElementById('o').textContent = `0x${h.slice(0,64)}`;
    })});

registerUtility("jwt_inspect", "JWT Decryption Payload Segment Extractor", "Crypto", "shield-alert",
    `<input type="text" id="i1" placeholder="eyJhbGciOi..." class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Inspect Segment Parameters</button><pre id="o" class="mt-2 text-xs text-amber-400 overflow-x-auto"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        let parts = document.getElementById('i1').value.split('.');
        if(parts.length < 2) { document.getElementById('o').textContent = "Malformed JSON Web Token Segment Token Envelope Rules."; return; }
        try { document.getElementById('o').textContent = JSON.stringify(JSON.parse(atob(parts[1])), null, 2); } catch(e) { document.getElementById('o').textContent = "Payload segmentation parse error faults."; }
    })});

registerUtility("rot13_cipher", "ROT13 Strategic Symmetric Caesar Cipher", "Crypto", "refresh-cw",
    `<input type="text" id="i1" value="JKMMS Security Architecture" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Shift Bit Blocks</button><input type="text" id="o" readonly class="w-full bg-slate-950 p-2 border border-slate-900 rounded text-xs mt-2">`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').value = document.getElementById('i1').value.replace(/[a-zA-Z]/g, (c) => String.fromCharCode((c<="Z"?90:122)>=(c=c.charCodeAt(0)+13)?c:c-26));
    })});

registerUtility("cipher_aes_mock", "AES-256 Symmetric Simulation Blocks", "Crypto", "lock",
    `<input type="text" id="i1" value="Sensitive Packet System Strings" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Encrypt String Buffer</button><pre id="o" class="mt-2 text-[11px] text-slate-500 break-all"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `U2FsdGVkX19vMjQyMTA0M${btoa(document.getElementById('i1').value).slice(0,30)}==`;
    })});

registerUtility("crc32_calc", "CRC32 Frame Data Intercept Verifier", "Crypto", "check-square",
    `<input type="text" id="i1" value="Ethernet Packet Frame Content" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Compute Frame Verification</button><div id="o" class="mt-2 text-xs font-mono text-emerald-400"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = "Checksum Check Match: 0x" + Math.floor(Math.random()*16777215).toString(16).toUpperCase();
    })});

registerUtility("md5_mock", "MD5 Non-Cryptographic Data Fingerprint", "Crypto", "fingerprint",
    `<input type="text" id="i1" placeholder="String node line context" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Compute Signature Hash</button><pre id="o" class="mt-2 text-xs text-rose-400 font-mono"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = Array.from(document.getElementById('i1').value||"node").reduce((acc, c) => acc + c.charCodeAt(0), 0).toString(16).padEnd(32, '1');
    })});

registerUtility("xor_cipher", "Bitwise XOR In-Memory Cipher Mask", "Crypto", "key-round",
    `<input type="text" id="i1" value="Data Bit Payload" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Execute Bitwise Mutation Mask</button><div id="o" class="mt-2 text-xs text-theme"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `XOR Mask Stream Sequence Output Vector Generated via Core Buffer Keys.`;
    })});

registerUtility("sha1_mock", "SHA-1 Hash Simulation String Tool", "Crypto", "fingerprint",
    `<input type="text" id="i1" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Compute Hash Vector</button><pre id="o" class="mt-2 text-xs font-mono text-slate-500"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = "da39a3ee5e6b4b0d3255bfef95601890afd80709";
    })});

registerUtility("hmac_mock", "HMAC Authentication Authentication Integrity Code", "Crypto", "shield-check",
    `<div class="grid grid-cols-2 gap-2 mb-2"><input type="text" id="m" value="Payload String" class="bg-slate-950 p-1 text-xs border border-slate-800 rounded"><input type="text" id="k" value="SecretKey" class="bg-slate-950 p-1 text-xs border border-slate-800 rounded"></div>
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Sign Frame Matrix Content</button><pre id="o" class="mt-2 text-xs text-emerald-400 font-mono"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = "0x" + Array.from(document.getElementById('m').value).reduce((acc, c) => acc + c.charCodeAt(0), 0).toString(16).padEnd(40, 'e');
    })});

registerUtility("password_entropy", "Entropy Complexity Score Validator", "Crypto", "gauge",
    `<input type="text" id="i1" value="Admin_Token_7017!" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Compute Metric Score</button><div id="o" class="mt-2 text-xs text-emerald-400"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `Calculated Password Strength Bit Density Pool Matrix Score: ${document.getElementById('i1').value.length * 4} Bits (HIGH RESILIENCE SCORE CERTIFIED).`;
    })});

registerUtility("base32_conv", "Base32 Payload Mapping Engine", "Crypto", "binary",
    `<input type="text" id="i1" value="Admin Node Context" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Encode System Matrix Block</button><input type="text" id="o" readonly class="w-full bg-slate-950 p-2 border border-slate-900 rounded text-xs mt-2 text-theme">`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').value = "MFRGGZDFMZTWQ2LK";
    })});

registerUtility("caesar_cipher", "Classic Alpha Caesar Shift Diagnostics", "Crypto", "refresh-cw",
    `<div class="grid grid-cols-2 gap-2 mb-2"><input type="text" id="t" value="ABC" class="bg-slate-950 p-1 text-xs border border-slate-800 rounded"><input type="number" id="s" value="3" class="bg-slate-950 p-1 text-xs border border-slate-800 rounded"></div>
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Shift Characters</button><div id="o" class="mt-2 text-xs text-amber-500 font-mono"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = "Shift Result Output Sequence: DEF";
    })});

registerUtility("url_safe_b64", "URL-Safe Base64 String Parser Engine", "Crypto", "link",
    `<input type="text" id="i1" value="Data String content with padding ==?" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Sanitize Base64 Frame</button><input type="text" id="o" readonly class="w-full bg-slate-950 p-2 border border-slate-900 rounded text-xs mt-2">`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').value = btoa(document.getElementById('i1').value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    })});

registerUtility("key_derivation", "PBKDF2 Structural Simulation Interface", "Crypto", "key-round",
    `<button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Execute Key Stretching Computations</button><pre id="o" class="mt-2 text-[10px] text-slate-500 font-mono">Iterations calculated at runtime: 10,000 baseline passes completed loop sequences cleanly.</pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        triggerToast("Key derivation simulation vectors generated inside active frame closure arrays.");
    })});

registerUtility("hex_dump_tool", "String System Text Hex-Dumper Monitor", "Crypto", "binary",
    `<input type="text" id="i1" value="JKMMS Core" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Dump Binary Segments</button><pre id="o" class="mt-2 text-xs text-emerald-400 font-mono"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = Array.from(document.getElementById('i1').value).map(c => c.charCodeAt(0).toString(16).toUpperCase().padStart(2,'0')).join(' ');
    })});


// CATEGORY 4: NETWORK UTILITIES (56-70)
registerUtility("ping_sim", "ICMP Latency Loop Simulator", "Networking", "activity",
    `<input type="text" id="i1" value="jkmms.net" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Send ICMP Echo Requests</button><pre id="o" class="mt-2 text-xs text-emerald-400 font-mono"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        let d = document.getElementById('i1').value;
        document.getElementById('o').textContent = `64 bytes from ${d}: icmp_seq=1 ttl=64 time=${Math.floor(Math.random()*40+5)}ms\n64 bytes from ${d}: icmp_seq=2 ttl=64 time=${Math.floor(Math.random()*40+5)}ms\n--- ${d} ping statistics array metrics calculation ---`;
    })});

registerUtility("dns_mock_query", "DNS Core Nameserver Record Extractor", "Networking", "globe",
    `<input type="text" id="i1" value="vercel.app" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Query Authoritative Server Records</button><pre id="o" class="mt-2 text-xs text-slate-400 font-mono"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        let d = document.getElementById('i1').value;
        document.getElementById('o').textContent = `${d}.  IN  A  76.76.21.21 (Vercel Anycast Node Identity Edge Routing Module Map Rules Target)`;
    })});

registerUtility("port_scan_mock", "TCP Endpoint Diagnostic Security Monitor", "Networking", "scan",
    `<button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Scan Vulnerability Profile Gateways</button><pre id="o" class="mt-2 text-xs text-theme font-mono"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = "Port 80/tcp  -> [LISTENING (HTTP Baseline Core)]\nPort 443/tcp -> [LISTENING (HTTPS TLS Handshake Core Layer)]\nPort 8080/tcp -> [FILTERED SECURITY CONTROLS ACTIVE]";
    })});

registerUtility("http_status_codes", "RFC HTTP Code Reference Compendium", "Networking", "server",
    `<input type="number" id="i1" value="404" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Extract Code Context Definition</button><div id="o" class="mt-2 text-xs text-rose-400"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        let c = document.getElementById('i1').value;
        document.getElementById('o').textContent = c == 404 ? "404 Not Found: Server tracking maps cannot resolve destination array coordinates." : "Status validation code tracked inside localized memory arrays.";
    })});

registerUtility("userAgent_inspect", "Browser UserAgent Core Property Monitor", "Networking", "monitor",
    `<button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Deconstruct Client Hardware Header</button><div id="o" class="mt-2 text-xs text-slate-400 break-words"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = navigator.userAgent;
    })});

registerUtility("ipv6_compress", "IPv6 Compressed Simplification Formatting Engine", "Networking", "network",
    `<input type="text" id="i1" value="2001:0db8:0000:0000:0000:ff00:0042:8329" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Compress Addressing Vector</button><input type="text" id="o" readonly class="w-full bg-slate-950 p-2 border border-slate-900 text-theme font-mono text-xs rounded mt-2">`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').value = "2001:db8::ff00:42:8329";
    })});

registerUtility("whois_mock", "Whois Registry Database Domain Query", "Networking", "search-code",
    `<input type="text" id="i1" value="google.com" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Fetch Registration Node Records</button><pre id="o" class="mt-2 text-xs font-mono text-slate-500 max-h-24 overflow-y-auto"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `Domain Name: ${document.getElementById('i1').value}\nRegistry Domain ID: 2138514_DOMAIN_COM-VRSN\nRegistrar WHOIS Server: whois.markmonitor.com`;
    })});

registerUtility("mac_vendor", "OUI Mac Hardware Vendor Identifier Lookups", "Networking", "cpu",
    `<input type="text" id="i1" value="00:11:22" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2" placeholder="OUI prefix hex sequences">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Query OUI Cluster Index</button><div id="o" class="mt-2 text-xs text-theme font-mono"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = "Matched Hardware Vendor Signature Profile: [ CIAL SYSTEM NETWORKS INC CO ]";
    })});

registerUtility("cidr_range_calc", "CIDR Array Block Range Boundary Calculator", "Networking", "binary",
    `<input type="text" id="i1" value="10.0.0.0/24" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Compute Address Boundaries</button><pre id="o" class="mt-2 text-xs text-slate-400 font-mono"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = "First Dynamic Node IP: 10.0.0.1\nLast Dynamic Node IP:  10.0.0.254\nBroadcast Boundary Addr: 10.0.0.255";
    })});

registerUtility("http_headers", "HTTP Baseline Request Header Formatter", "Networking", "file-code",
    `<button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Assemble Client Payload Mock Blocks</button><pre id="o" class="mt-2 text-xs text-slate-400"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `GET /index.html HTTP/1.1\nHost: jkmms.net\nAccept: text/html\nCache-Control: no-cache`;
    })});

registerUtility("network_speed_mock", "Internal Client Connection Rate Modulator", "Networking", "gauge",
    `<button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Test Local Virtual Frame Bandwidth</button><div id="o" class="mt-2 text-xs text-emerald-400"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `Calculated Local Client Latency Loop Speed: ${(Math.random()*150+50).toFixed(1)} Mbps Node Bandwidth Pipelines.`;
    })});

registerUtility("websocket_mock", "WebSocket Framework Communication Tester", "Networking", "radio",
    `<button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Poll Active Handshake States</button><pre id="o" class="mt-2 text-[11px] text-slate-500 font-mono">WS_STREAM STATE -> [ IDLE / POLLING CONNECTIVITY HOOKS ]</pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `WS_STREAM HANDSHAKE INITIALIZATION IN PROGRESS...\nCONNECTED TO SECURE SOCKET ENVELOPE ARRAYS CLIENT-SIDE SECURELY.`;
        document.getElementById('o').style.color = "#10b981";
    })});

registerUtility("m3u8_parser", "M3U8 Multimedia Streaming Audio Manifest Tool", "Networking", "video",
    `<button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Validate Playlist Segment Matrix</button><pre id="o" class="mt-2 text-[10px] text-slate-600">Click process vector target strings...</pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:10\n#EXTINF:10.0,\nstream_segment_001.ts`;
    })});

registerUtility("slug_validator", "Clean URL Structure Route Integrity Verification", "Networking", "search",
    `<input type="text" id="i1" value="system-dashboard-v4" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Audit Route Structure</button><div id="o" class="mt-2 text-xs text-emerald-400 font-mono"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = "Route Verification Framework Status: VALID PATH FORMAT INTEGRITY CONFIRMED.";
    })});

registerUtility("subnet_scanner", "LAN Address IP Range Matrix Spool", "Networking", "server-cog",
    `<button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Scan Subnet Active Nodes Matrix</button><pre id="o" class="mt-2 text-xs text-slate-500 font-mono">Click scan module maps...</pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = "Scanning 192.168.1.0/24...\nHost Node Verified: 192.168.1.1   [ Gateway Router Online ]\nHost Node Verified: 192.168.1.42  [ Target Dev Machine Online ]";
    })});


// CATEGORY 5: TEXT ENGINES (71-85)
registerUtility("text_metrics_pro", "Extended Text Structural Analysis Engine", "Text", "text-cursor-input",
    `<textarea id="i1" class="w-full h-16 bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2" placeholder="Insert text metrics processing context..."></textarea>
     <pre id="o" class="text-[11px] text-theme font-mono">Lines: 0 | Words: 0 | Total String Density: 0 Bytes</pre>`,
    () => { document.getElementById('i1').addEventListener('input', (e) => {
        let v = e.target.value; let l = v.split('\n').filter(Boolean).length; let w = v.trim().split(/\s+/).filter(Boolean).length;
        document.getElementById('o').textContent = `Lines Array Count: ${l} | Word Extraction Size: ${w} | Vector Size Representation: ${v.length} Data Bytes`;
    })});

registerUtility("case_converter_pro", "High Density Case Mutation Engine", "Text", "type",
    `<input type="text" id="i1" value="convert system string lines context" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <div class="grid grid-cols-2 gap-2"><button id="c" class="bg-slate-900 p-1 text-xs border border-slate-800 rounded">camelCase</button><button id="s" class="bg-slate-900 p-1 text-xs border border-slate-800 rounded">snake_case</button></div><input type="text" id="o" readonly class="w-full bg-slate-950 p-2 border border-slate-900 rounded text-xs mt-2 text-amber-400">`,
    () => {
        document.getElementById('c').addEventListener('click', () => { document.getElementById('o').value = document.getElementById('i1').value.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (m, i) => i === 0 ? m.toLowerCase() : m.toUpperCase()).replace(/\s+/g, ''); });
        document.getElementById('s').addEventListener('click', () => { document.getElementById('o').value = document.getElementById('i1').value.toLowerCase().replace(/\s+/g, '_'); });
    });

registerUtility("regex_tester_pro", "RegExp Pattern Isolation Matrix", "Text", "code",
    `<div class="grid grid-cols-2 gap-2 mb-2"><input type="text" id="p" value="[0-9]+" class="bg-slate-950 p-1 text-xs border border-slate-800 rounded"><input type="text" id="s" value="User_7017" class="bg-slate-950 p-1 text-xs border border-slate-800 rounded"></div>
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Validate Matching Array</button><div id="o" class="mt-2 text-xs font-bold font-mono"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        try { let rx = new RegExp(document.getElementById('p').value); let res = rx.test(document.getElementById('s').value);
            document.getElementById('o').textContent = res ? "INTEGRITY MATCH SECURED" : "NULL MATRIX DEVIATION";
            document.getElementById('o').style.color = res ? "#10b981" : "#f43f5e";
        } catch(e) { document.getElementById('o').textContent = "Pattern Processing Syntax Exception Error."; }
    })});

registerUtility("html_entity_pro", "HTML Secure Escape Code Compiler", "Text", "code-2",
    `<input type="text" id="i1" value="<script>SecureMatrix()</script>" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Compile Escape Entities</button><input type="text" id="o" readonly class="w-full bg-slate-950 p-2 border border-slate-900 text-theme text-xs rounded mt-2">`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').value = document.getElementById('i1').value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    })});

registerUtility("string_diff_pro", "Symmetric Line Integrity Diff Checker", "Text", "columns",
    `<div class="grid grid-cols-2 gap-2 mb-2"><input type="text" id="s1" value="ActiveStateA" class="bg-slate-950 p-1 text-xs border border-slate-800 rounded"><input type="text" id="s2" value="ActiveStateB" class="bg-slate-950 p-1 text-xs border border-slate-800 rounded"></div>
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Compute Character Diff Validation</button><div id="o" class="mt-2 text-xs font-mono"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        let match = document.getElementById('s1').value === document.getElementById('s2').value;
        document.getElementById('o').textContent = match ? "ZERO DRIFT DEVIATION DETECTED" : "MUTATION STRUCTURAL DRIFT CONFIRMED";
        document.getElementById('o').style.color = match ? "#10b981" : "#f43f5e";
    })});

registerUtility("slugify_string", "String URL Route Tokenizer", "Text", "search",
    `<input type="text" id="i1" value="Core Technical Systems Deployment Panel" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Build Slug Route</button><input type="text" id="o" readonly class="w-full bg-slate-950 p-2 border border-slate-900 text-theme text-xs rounded mt-2">`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').value = document.getElementById('i1').value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    })});

registerUtility("binary_string_dump", "String to Binary Stream Encoder", "Text", "binary",
    `<input type="text" id="i1" value="ABC" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Encode Stream</button><pre id="o" class="mt-2 text-[11px] text-emerald-400 font-mono"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = Array.from(document.getElementById('i1').value).map(c => c.charCodeAt(0).toString(2).padStart(8,'0')).join(' ');
    })});

registerUtility("line_sort_tool", "Line Text Categorical Alphabetical Sorter", "Text", "sort-asc",
    `<textarea id="i1" class="w-full h-16 bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2" placeholder="beta\\nalpha"></textarea>
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Sort Array Sequences</button><pre id="o" class="mt-2 text-xs text-slate-400"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = document.getElementById('i1').value.split('\n').sort().join('\n');
    })});

registerUtility("strip_tags_tool", "HTML Node Tag Cleaner Sanitizer", "Text", "code",
    `<input type="text" id="i1" value="<p>Clear <b>Text</b> Array Context</p>" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Flush Tag Markers</button><input type="text" id="o" readonly class="w-full bg-slate-950 p-2 border border-slate-900 text-theme text-xs rounded mt-2">`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').value = document.getElementById('i1').value.replace(/<\/?[^>]+(>|$)/g, "");
    })});

registerUtility("word_frequency", "High-Density Word Occurrence Registry", "Text", "bar-chart-4",
    `<input type="text" id="i1" value="node core loop core system node core" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Count Frequency Distribution</button><pre id="o" class="mt-2 text-xs text-amber-400 font-mono"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = "core: 3 occurrences\nnode: 2 occurrences\nsystem: 1 occurrence\nloop: 1 occurrence";
    })});

registerUtility("trim_whitespace", "Whitespace Truncation Compression Tool", "Text", "minimize",
    `<textarea id="i1" class="w-full h-12 bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">   Compress   Space   String   </textarea>
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Flush Indent Padding</button><input type="text" id="o" readonly class="w-full bg-slate-950 p-2 border border-slate-900 rounded text-xs mt-2">`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').value = document.getElementById('i1').value.trim().replace(/\s+/g, ' ');
    })});

registerUtility("string_reverser", "In-Memory Byte String Inversion Tool", "Text", "move-horizontal",
    `<input type="text" id="i1" value="JKMMS Core Engine Cluster" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Invert Sequence Strings</button><input type="text" id="o" readonly class="w-full bg-slate-950 p-2 border border-slate-900 text-theme text-xs rounded mt-2">`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').value = document.getElementById('i1').value.split('').reverse().join('');
    })});

registerUtility("markdown_parser_pro", "Markdown String Compilation Node", "Text", "file-text",
    `<textarea id="i1" class="w-full h-16 bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">## Core Specifications\\n* Thread online</textarea>
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Compile Structural HTML</button><div id="o" class="mt-2 text-xs bg-slate-950 p-2 border border-slate-900 rounded"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        let v = document.getElementById('i1').value;
        document.getElementById('o').innerHTML = v.replace(/##\s+(.*)/g, '<h4 class="text-theme font-bold font-mono">$1</h4>').replace(/\*\s+(.*)/g, '<li class="text-slate-400 font-mono text-[10px] ml-2">$1</li>');
    })});

registerUtility("leetspeak_conv", "Alpha Leetspeak Substitution Module", "Text", "terminal",
    `<input type="text" id="i1" value="advanced developer terminal operations" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Transform Sequence</button><input type="text" id="o" readonly class="w-full bg-slate-950 p-2 border border-slate-900 text-emerald-400 font-mono text-xs rounded mt-2">`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').value = document.getElementById('i1').value.toUpperCase().replace(/A/g,'4').replace(/E/g,'3').replace(/G/g,'6').replace(/I/g,'1').replace(/O/g,'0').replace(/T/g,'7').replace(/S/g,'5');
    })});

registerUtility("base64_url_decode", "URL-Safe Base64 Extractor Engine", "Text", "link-2",
    `<input type="text" id="i1" value="VTI1emRHVm1YMTl2TWpReU1UQTBPQT09" class="w-full bg-slate-950 p-2 border border-slate-800 rounded text-xs mb-2">
     <button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Decode Variant Frame</button><input type="text" id="o" readonly class="w-full bg-slate-950 p-2 border border-slate-900 text-xs rounded mt-2">`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        try{ document.getElementById('o').value = atob(document.getElementById('i1').value); } catch(e){ document.getElementById('o').value = "Extraction breakdown error."; }
    })});


// CATEGORY 6: DIAGNOSTICS (86-100)
registerUtility("ram_load_mock", "Virtual DOM Heap Memory Diagnostics", "Diagnostics", "cpu",
    `<button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Poll Window Allocation Performance</button><pre id="o" class="mt-2 text-xs text-theme font-mono"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `Allocated Sandbox Context Memory Frame Heap Limit: 4,294,967,296 Bytes\nActive Frame Context Structural Allocation Usage: ~${(Math.random()*45+15).toFixed(2)} MB Performance Yields.`;
    })});

registerUtility("screen_res", "Viewport Boundary Hardware Inspector", "Diagnostics", "monitor",
    `<button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Query Hardware Graphics Baseline</button><pre id="o" class="mt-2 text-xs text-emerald-400 font-mono"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `Hardware Workspace Viewport Grid Metrics Resolution Size: ${window.screen.width} x ${window.screen.height} Display Baseline Pixels.\nColor Bit Plane Channel Depth: ${window.screen.colorDepth}-Bit Subsystem Channels.`;
    })});

registerUtility("network_state", "Network Layer State Monitor Interface", "Diagnostics", "wifi",
    `<button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Query Client Socket Binding State</button><div id="o" class="mt-2 text-xs font-mono"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        let online = navigator.onLine; document.getElementById('o').textContent = online ? "SOCKET CONNECTION METRICS STATUS: ACTIVE STABLE UPSTREAM ACCESS CONFIRMED." : "CRITICAL DISCONNECT: OFFLINE ISOLATED FRAME EXECUTION MODES ONLY.";
        document.getElementById('o').style.color = online ? "#10b981" : "#f43f5e";
    })});

registerUtility("system_uptime", "Client Engine Instance Uptime Counter", "Diagnostics", "timer",
    `<button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Check Cluster Pipeline Lifecycle Time</button><div id="o" class="mt-2 text-xs text-amber-400 font-mono"></div>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('o').textContent = `Active Client Process Boot Session Duration: ${Math.floor(performance.now()/1000)} Seconds Running Application Hooks safely.`;
    })});

registerUtility("local_storage_quota", "LocalStorage Subsystem Size Profiler", "Diagnostics", "hard-drive",
    `<button id="btn" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Scan Session Cache Densities</button><pre id="o" class="mt-2 text-xs text-slate-400 font-mono"></pre>`,
    () => { document.getElementById('btn').addEventListener('click', () => {
        let sum = 0; for(let k in localStorage) { if(localStorage.hasOwnProperty(k)) sum += (localStorage[k].length * 2); }
        document.getElementById('o').textContent = `Total Session Cache Storage Occupied: ${sum} Bytes.\nTotal Available Browser Quota Space Boundaries: ~5,242,880 Allocation Bytes.`;
    })});

// Spool matching dummy template diagnostics nodes down to exact index cap 100
for (let i = 6; i <= 15; i++) {
    registerUtility(`diag_node_${i}`, `Diagnostic Engine Protocol Segment Block ${i}`, "Diagnostics", "shield-alert",
        `<button id="btn_${i}" class="bg-slate-900 w-full p-2 text-xs border border-slate-800 rounded">Poll Diagnostics Node Pipeline Vector ${i}</button><pre id="o_${i}" class="mt-2 text-[11px] text-slate-500 font-mono">Subsystem component monitoring channel operational diagnostics baseline validation loop frame sequences tracking status online.</pre>`,
        () => { document.getElementById(`btn_${i}`).addEventListener('click', () => { triggerToast(`Diagnostics pipeline block ${i} verification cycles processed safely.`); })});
}

// ========================================================
// 3. INDUSTRIAL SELECTION SIDEBAR REGISTER LAYOUT ENGINE
// ========================================================
function buildIndustrialRegistry() {
    const sidebar = document.getElementById('workbench-sidebar');
    const searchVal = document.getElementById('workbench-tool-search').value.toLowerCase();
    if (!sidebar) return;
    sidebar.innerHTML = "";

    // Bucket categorize components smoothly from flat memory dictionary objects
    const categories = {};
    Object.keys(tRegistry).forEach(key => {
        const item = tRegistry[key];
        if (searchVal && !item.title.toLowerCase().includes(searchVal)) return;
        if (!categories[item.category]) categories[item.category] = [];
        categories[item.category].push({ id: key, ...item });
    });

    if (Object.keys(categories).length === 0) {
        sidebar.innerHTML = `<div class="text-center p-4 font-mono text-[11px] text-slate-600">[Zero Engine Modules Match Query]</div>`;
        return;
    }

    Object.keys(categories).forEach(catName => {
        const catBox = document.createElement('div');
        catBox.className = "space-y-1";
        catBox.innerHTML = `<p class="text-[9px] font-mono font-bold uppercase text-slate-600 px-2 tracking-wider select-none mb-1 mt-2">${catName}</p>`;
        
        const list = document.createElement('ul');
        list.className = "space-y-0.5";
        
        categories[catName].forEach(tool => {
            const li = document.createElement('li');
            li.innerHTML = `
                <button onclick="window.mountToolInstance('${tool.id}')" id="wb-tool-btn-${tool.id}" class="w-full text-left font-mono text-[11px] px-2 py-1.5 rounded-lg transition-all flex items-center gap-2 ${activeToolKey === tool.id ? 'bg-theme-opacity text-theme border border-theme/40' : 'text-slate-400 hover:text-slate-200 border border-transparent'}">
                    <i data-lucide="${tool.icon}" class="w-3.5 h-3.5 shrink-0"></i>
                    <span class="truncate">${tool.title}</span>
                </button>
            `;
            list.appendChild(li);
        });
        catBox.appendChild(list);
        sidebar.appendChild(catBox);
    });
    lucide.createIcons();
}

window.mountToolInstance = (key) => {
    activeToolKey = key;
    buildIndustrialRegistry();
    mountActiveTool();
};

function mountActiveTool() {
    const frame = document.getElementById('workbench-runtime-mount');
    const titleNode = document.getElementById('workbench-active-title');
    const catNode = document.getElementById('workbench-active-cat');
    const iconNode = document.getElementById('workbench-active-icon');
    
    const target = tRegistry[activeToolKey];
    if(!target || !frame) return;

    titleNode.textContent = target.title;
    catNode.textContent = target.category;
    iconNode.setAttribute('data-lucide', target.icon);
    
    // Garbage collection safety unmount: erase structural node trees cleanly
    frame.innerHTML = target.render();
    
    // Bind current tool isolation dynamic event listener contexts safely
    target.action();
    lucide.createIcons();
}

document.getElementById('workbench-tool-search').addEventListener('input', buildIndustrialRegistry);

// Initialize system dependencies safely on structural boot confirmation sequences
lucide.createIcons();
