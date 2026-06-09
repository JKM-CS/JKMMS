// Configuration constants
const WHATSAPP_NUMBER = "9647511631324";
const FRUIT_FLAVORS = ["Strawberry", "Blueberry", "Apple", "Mango", "Peach", "Pineapple", "Raspberry", "Kiwi", "Cherry", "Passion Fruit"];

// Application state canvas 
let cart = [];

// Parse incoming routing parameter allocations safely
const urlParams = new URLSearchParams(window.location.search);
const tableNumber = urlParams.get('table');

// Helper component utilities
const createFlavoredItems = (suffix, price, prefix = "") => {
    return FRUIT_FLAVORS.map(flavor => ({
        name: `${prefix}${flavor}${suffix}`,
        price: price
    }));
};

// Master item data tree structure 
const menuData = [
    {
        name: "Mojito",
        id: "cat-mojito",
        image: "mojito.jpg",
        items: [
            { name: "Classic Mojito", price: 6000 },
            ...createFlavoredItems(" Mojito", 7000)
        ]
    },
    {
        name: "Smoothies",
        id: "cat-smoothies",
        image: "smoothies.jpg",
        items: createFlavoredItems(" Smoothie", 7000)
    },
    {
        name: "Ice Tea",
        id: "cat-icetea",
        image: "ice-tea.jpg",
        items: createFlavoredItems(" Ice Tea", 7000)
    },
    {
        name: "Hot Drinks",
        id: "cat-hotdrinks",
        image: "hot-drinks.jpg",
        items: [
            { name: "Espresso", price: 4000 },
            { name: "Americano", price: 6000 },
            { name: "Cappuccino", price: 7000 },
            { name: "Hot Chocolate", price: 7000 },
            { name: "Tea", price: 2000 }
        ]
    },
    {
        name: "Latte",
        id: "cat-latte",
        image: "latte.jpg",
        items: [
            { name: "Classic Latte", price: 6000 },
            { name: "Vanilla Latte", price: 7000 },
            { name: "Caramel Latte", price: 7000 },
            { name: "Spanish Latte", price: 7000 },
            { name: "Rose Latte", price: 7000 },
            { name: "Cinnamon Latte", price: 7000 },
            { name: "Lavender Latte", price: 7000 }
        ]
    },
    {
        name: "Sandwiches",
        id: "cat-sandwiches",
        image: "sandwiches.jpg",
        items: [
            { name: "Chicken Classic", price: 6000 },
            { name: "Chicken Caesar", price: 6000 },
            { name: "Meat", price: 6000 },
            { name: "Hot Dog", price: 6000 },
            { name: "Salami", price: 6000 }
        ]
    },
    {
        name: "Croissant",
        id: "cat-croissant",
        image: "croissant.jpg",
        items: [
            { name: "Cheese Croissant", price: 5000 },
            { name: "Chocolate Croissant", price: 5000 },
            { name: "Plain Croissant", price: 5000 },
            { name: "Cube Croissant", price: 5000 },
            { name: "Roll Croissant", price: 5000 },
            { name: "Ribbon Croissant", price: 5000 },
            { name: "Crema with Fruit Croissant", price: 5000 }
        ]
    },
    {
        name: "Cakes",
        id: "cat-cakes",
        image: "cakes.jpg",
        items: [
            { name: "Banana Cake", price: 3000 },
            { name: "Brownie Cube", price: 6000 },
            { name: "Brownie", price: 7000 },
            { name: "Chocolate Mousse", price: 6000 },
            { name: "Tiramisu", price: 5000 },
            { name: "Red Velvet", price: 7000 },
            { name: "Lazy Cake", price: 5000 }
        ]
    },
    {
        name: "Energy Drinks",
        id: "cat-energy",
        image: "energy-drinks.jpg",
        items: [
            { name: "Red Bull Classic", price: 4000 },
            ...createFlavoredItems("", 7000, "Red Bull ")
        ]
    },
    {
        name: "Pastries",
        id: "cat-pastries",
        note: "Prices to be confirmed with staff",
        items: [
            { name: "Cinnamon Roll", price: 5000 },
            { name: "Canele", price: 3000 },
            { name: "Bombolini with Fruit", price: 5000 },
            { name: "Bombolini", price: 4000 },
            { name: "Danish with Fruit", price: 5000 },
            { name: "Danish", price: 4000 },
            { name: "Donut", price: 3000 },
            { name: "Galette", price: 5000 }
        ]
    }
];

// Flat internal tracking dictionary for fast computational operations 
const itemPriceLookup = {};
menuData.forEach(cat => cat.items.forEach(i => itemPriceLookup[i.name] = i.price));

// Lifecycle Bootstrapping Init Hook
document.addEventListener("DOMContentLoaded", () => {
    renderCategoryNav();
    renderMenuGrid();
    setupCartListeners();
    checkTableRoutingContext();
    
    // Fire up vector graphic replacements dynamically
    if (window.lucide) {
        window.lucide.createIcons();
    }
});

function checkTableRoutingContext() {
    if (tableNumber) {
        const noticeBox = document.getElementById("table-notice");
        const noticeVal = document.getElementById("table-notice-val");
        if (noticeBox && noticeVal) {
            noticeVal.textContent = `Table ${tableNumber}`;
            noticeBox.classList.remove("hidden");
            noticeBox.classList.add("flex");
        }
    }
}

// Generate the Top sticky category tabs row
function renderCategoryNav() {
    const navBar = document.getElementById("category-nav-pills");
    if (!navBar) return;

    menuData.forEach((category, idx) => {
        const pill = document.createElement("button");
        pill.className = `px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer border ${
            idx === 0 
            ? "bg-yellow-400 text-black border-yellow-400 shadow-md" 
            : "bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-zinc-200 hover:border-zinc-800"
        }`;
        pill.textContent = category.name;
        pill.onclick = (e) => {
            // Smooth Scroll view hook alignment
            const element = document.getElementById(category.id);
            if (element) {
                const topOffset = element.getBoundingClientRect().top + window.scrollY - 130;
                window.scrollTo({ top: topOffset, behavior: 'smooth' });
            }
            
            // Clean dynamic active pill switches
            document.querySelectorAll("#category-nav-pills button").forEach(b => {
                b.className = "px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer border bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-zinc-200 hover:border-zinc-800";
            });
            pill.className = "px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer border bg-yellow-400 text-black border-yellow-400 shadow-md";
        };
        navBar.appendChild(pill);
    });
}

// Render modern menu grid cards layout
function renderMenuGrid() {
    const container = document.getElementById("menu-container");
    if (!container) return;
    container.innerHTML = "";

    menuData.forEach(category => {
        const section = document.createElement("section");
        section.id = category.id;
        section.className = "scroll-mt-32";

        let bannerHTML = "";
        if (category.image) {
            bannerHTML = `
                <div class="flex items-center gap-4 mb-6 border-b border-zinc-900 pb-3">
                    <div class="w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden shadow-xl ring-2 ring-zinc-900 shrink-0 bg-zinc-900">
                        <img src="${category.image}" alt="${category.name}" class="w-full h-full object-cover" loading="lazy">
                    </div>
                    <div>
                        <h2 class="text-xl font-black tracking-wide text-white">${category.name}</h2>
                        <p class="text-zinc-500 text-[11px] font-medium uppercase tracking-wider">Premium Selection</p>
                    </div>
                </div>`;
        } else {
            bannerHTML = `
                <div class="rounded-2xl mb-6 p-5 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 shadow-md">
                    <h2 class="text-xl font-black tracking-wide text-yellow-400">${category.name}</h2>
                    ${category.note ? `<p class="text-zinc-400 text-xs font-medium mt-1 flex items-center gap-1.5"><i data-lucide="info" class="w-3.5 h-3.5 text-zinc-500"></i>${category.note}</p>` : ""}
                </div>`;
        }

        let itemsHTML = `<div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">`;
        category.items.forEach(item => {
            const safeName = btoa(unescape(encodeURIComponent(item.name))); 
            itemsHTML += `
                <div class="group bg-zinc-950/40 hover:bg-zinc-950 border border-zinc-900 hover:border-zinc-800 rounded-2xl p-4 flex justify-between items-center transition-all duration-200 shadow-sm hover:shadow-md">
                    <div class="space-y-1 pr-2">
                        <h3 class="text-sm font-semibold tracking-wide text-zinc-200 group-hover:text-white transition-colors">${item.name}</h3>
                        <p class="text-yellow-400 font-bold text-xs tracking-wide">${item.price.toLocaleString()} <span class="text-[10px] text-yellow-500/80 font-medium">IQD</span></p>
                    </div>
                    <div class="flex items-center gap-2.5 shrink-0" data-item-id="${safeName}">
                        <div class="quantity-controls flex items-center gap-2.5 hidden">
                            <button onclick="changeQty('${safeName}', -1)" class="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-base flex items-center justify-center transition-colors cursor-pointer border border-zinc-800 active:scale-95">-</button>
                            <span class="quantity-val text-yellow-400 font-extrabold text-sm w-5 text-center">0</span>
                        </div>
                        <button onclick="changeQty('${safeName}', 1)" class="w-8 h-8 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-base flex items-center justify-center transition-all cursor-pointer shadow-md shadow-yellow-500/5 active:scale-95">+</button>
                    </div>
                </div>`;
        });
        itemsHTML += `</div>`;

        section.innerHTML = bannerHTML + itemsHTML;
        container.appendChild(section);
    });
}

window.changeQty = (encodedName, adjustment) => {
    const itemName = decodeURIComponent(escape(atob(encodedName)));
    if (adjustment === 1) {
        cart.push(itemName);
    } else {
        const index = cart.lastIndexOf(itemName);
        if (index !== -1) cart.splice(index, 1);
    }
    updateCartUI();
};

function updateCartUI() {
    const cartBar = document.getElementById("cart-bar");
    const cartCount = document.getElementById("cart-count");
    const cartTotal = document.getElementById("cart-total");
    const tagsContainer = document.getElementById("cart-summary-tags");

    if (cart.length === 0) {
        // Smooth slide out transitions animations
        cartBar.style.transform = "translateY(20px)";
        cartBar.style.opacity = "0";
        cartBar.style.pointerEvents = "none";
        
        document.querySelectorAll('.quantity-controls').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.quantity-val').forEach(el => el.textContent = '0');
        return;
    }

    // Trigger floating canvas display frames
    cartBar.style.transform = "translateY(0)";
    cartBar.style.opacity = "1";
    cartBar.style.pointerEvents = "auto";
    
    cartCount.textContent = `${cart.length} ${cart.length === 1 ? 'item selected' : 'items selected'}`;

    const counts = {};
    let totalCost = 0;
    cart.forEach(name => {
        counts[name] = (counts[name] || 0) + 1;
        totalCost += itemPriceLookup[name] || 0;
    });

    cartTotal.textContent = `${totalCost.toLocaleString()} IQD`;

    // Fast-sync grid quantities numbers counters
    document.querySelectorAll('[data-item-id]').forEach(controlBox => {
        const id = controlBox.getAttribute('data-item-id');
        const originalName = decodeURIComponent(escape(atob(id)));
        const qtyControls = controlBox.querySelector('.quantity-controls');
        const qtyVal = controlBox.querySelector('.quantity-val');

        if (counts[originalName]) {
            qtyControls.classList.remove('hidden');
            qtyVal.textContent = counts[originalName];
        } else {
            qtyControls.classList.add('hidden');
            qtyVal.textContent = '0';
        }
    });

    // Populate the running preview badge horizontal row layout
    tagsContainer.innerHTML = "";
    Object.entries(counts).forEach(([name, qty]) => {
        const span = document.createElement("span");
        span.className = "bg-zinc-900 border border-zinc-800/60 text-zinc-300 text-[11px] font-semibold px-3 py-1 rounded-xl whitespace-nowrap flex items-center gap-1";
        span.innerHTML = `<span class="text-yellow-400 font-extrabold">${qty}x</span> ${name}`;
        tagsContainer.appendChild(span);
    });
}

function setupCartListeners() {
    document.getElementById("clear-cart-btn").addEventListener("click", () => {
        cart = [];
        updateCartUI();
    });
    document.getElementById("whatsapp-btn").addEventListener("click", sendWhatsAppOrder);
}

function sendWhatsAppOrder() {
    if (cart.length === 0) return;

    const counts = {};
    cart.forEach(name => counts[name] = (counts[name] || 0) + 1);

    let textMessage = "Hello Maccannoli 👋\n";
    if (tableNumber) {
        textMessage += `👉 ORDER FROM TABLE: ${tableNumber}\n\n`;
    } else {
        textMessage += "\n";
    }
    
    textMessage += "My Order:\n";
    
    let totalCost = 0;
    Object.entries(counts).forEach(([name, qty]) => {
        const itemCost = itemPriceLookup[name] || 0;
        textMessage += `• ${qty}x ${name} - ${(qty * itemCost).toLocaleString()} IQD\n`;
        totalCost += qty * itemCost;
    });

    textMessage += `\nTotal: ${totalCost.toLocaleString()} IQD`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(textMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer") || (window.location.href = url);
}
