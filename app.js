// Constants
const WHATSAPP_NUMBER = "9647511631324";
const FRUIT_FLAVORS = ["Strawberry", "Blueberry", "Apple", "Mango", "Peach", "Pineapple", "Raspberry", "Kiwi", "Cherry", "Passion Fruit"];

// Cart State
let cart = [];

// 1. READ THE TABLE NUMBER FROM THE URL PARAMS
const urlParams = new URLSearchParams(window.location.search);
const tableNumber = urlParams.get('table'); // Will grab "1" from ?table=1

// Helper to generate flavored items dynamically
const createFlavoredItems = (suffix, price, prefix = "") => {
    return FRUIT_FLAVORS.map(flavor => ({
        name: `${prefix}${flavor}${suffix}`,
        price: price
    }));
};

// Menu Data Structure
const menuData = [
    {
        name: "Mojito",
        image: "mojito.jpg",
        items: [
            { name: "Classic Mojito", price: 6000 },
            ...createFlavoredItems(" Mojito", 7000)
        ]
    },
    {
        name: "Smoothies",
        image: "smoothies.jpg",
        items: createFlavoredItems(" Smoothie", 7000)
    },
    {
        name: "Ice Tea",
        image: "ice-tea.jpg",
        items: createFlavoredItems(" Ice Tea", 7000)
    },
    {
        name: "Hot Drinks",
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
        image: "energy-drinks.jpg",
        items: [
            { name: "Red Bull Classic", price: 4000 },
            ...createFlavoredItems("", 7000, "Red Bull ")
        ]
    },
    {
        name: "Pastries",
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

const itemPriceLookup = {};
menuData.forEach(cat => cat.items.forEach(i => itemPriceLookup[i.name] = i.price));

document.addEventListener("DOMContentLoaded", () => {
    renderMenu();
    setupCartListeners();
    displayTableNotice(); // Run visibility notice helper
});

// Helper to show table number header dynamically if present
function displayTableNotice() {
    if (tableNumber) {
        const notice = document.getElementById("table-notice");
        if (notice) {
            notice.textContent = `📍 Table ${tableNumber}`;
            notice.classList.remove("hidden");
        }
    }
}

function renderMenu() {
    const container = document.getElementById("menu-container");
    container.innerHTML = "";

    menuData.forEach(category => {
        const section = document.createElement("section");
        section.className = "mb-10";

        let bannerHTML = "";
        if (category.image) {
            bannerHTML = `
                <div class="flex items-center gap-4 mb-5">
                    <img src="${category.image}" alt="${category.name}" class="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover shrink-0 border border-zinc-800" loading="lazy">
                    <h2 class="text-3xl font-bold text-yellow-400">${category.name}</h2>
                </div>`;
        } else {
            bannerHTML = `
                <div class="rounded-2xl mb-5 p-4 bg-gradient-to-r from-yellow-600/25 to-zinc-900 border border-yellow-700/40">
                    <h2 class="text-3xl font-bold text-yellow-400">${category.name}</h2>
                    ${category.note ? `<p class="text-zinc-400 text-sm mt-1">${category.note}</p>` : ""}
                </div>`;
        }

        let itemsHTML = `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">`;
        category.items.forEach(item => {
            const safeName = btoa(unescape(encodeURIComponent(item.name))); 
            itemsHTML += `
                <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex justify-between items-center">
                    <div>
                        <h3 class="text-lg font-semibold">${item.name}</h3>
                        <p class="text-yellow-400">${item.price.toLocaleString()} IQD</p>
                    </div>
                    <div class="flex items-center gap-2" data-item-id="${safeName}">
                        <div class="quantity-controls flex items-center gap-2 hidden">
                            <button onclick="changeQty('${safeName}', -1)" class="bg-zinc-700 text-white w-8 h-8 rounded-lg font-bold text-lg flex items-center justify-center cursor-pointer">-</button>
                            <span class="quantity-val text-yellow-400 font-bold w-6 text-center">0</span>
                        </div>
                        <button onclick="changeQty('${safeName}', 1)" class="bg-yellow-500 text-black w-8 h-8 rounded-lg font-bold text-lg flex items-center justify-center cursor-pointer">+</button>
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
        cartBar.classList.add("hidden");
        document.querySelectorAll('.quantity-controls').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.quantity-val').forEach(el => el.textContent = '0');
        return;
    }

    cartBar.classList.remove("hidden");
    cartCount.textContent = `${cart.length} ${cart.length === 1 ? 'item' : 'items'}`;

    const counts = {};
    let totalCost = 0;
    cart.forEach(name => {
        counts[name] = (counts[name] || 0) + 1;
        totalCost += itemPriceLookup[name] || 0;
    });

    cartTotal.textContent = `${totalCost.toLocaleString()} IQD`;

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

    tagsContainer.innerHTML = "";
    Object.entries(counts).forEach(([name, qty]) => {
        const span = document.createElement("span");
        span.className = "bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded-lg";
        span.textContent = `${qty}x ${name}`;
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

// 2. INJECT TABLE NUMBER INTO WHATSAPP TEXT
function sendWhatsAppOrder() {
    if (cart.length === 0) return;

    const counts = {};
    cart.forEach(name => counts[name] = (counts[name] || 0) + 1);

    // Dynamic header greeting incorporating location if available
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
