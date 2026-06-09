// Configuration constants
const WHATSAPP_NUMBER = "9647505055000";

// Translation Lookups Engine Data
const translations = {
    en: {
        dir: "ltr",
        subSub: "Bakery & Café",
        location: "Erbil",
        heroDesc: "Tap items to build your selection. When finished, press the checkout button below to route your dynamic table request straight to our waiters via WhatsApp.",
        qrTitle: "Scan to Order",
        qrDesc: "Point your mobile camera over this design element to automatically launch the interactive portal link directly.",
        printedBtn: "View Traditional Printed Layout Menu",
        footerThanks: "Thank you and enjoy • Maccannoli Bakery & Café",
        cartTitle: "Selected Order",
        cartTotalLabel: "Total Bill",
        clearBtn: "Clear",
        submitBtn: "Submit Order to Waiters",
        tableLabel: "Table",
        itemsLabel: "items selected",
        itemLabel: "item selected",
        notePastries: "Prices to be confirmed with staff",
        mojito: "Mojito", smoothies: "Smoothies", icetea: "Ice Tea", hotdrinks: "Hot Drinks", latte: "Latte", sandwiches: "Sandwiches", croissant: "Croissant", cakes: "Cakes", energy: "Energy Drinks", pastries: "Pastries",
        waGreeting: "Hello Maccannoli 👋", waTable: "👉 ORDER FROM TABLE", waOrder: "My Order", waTotal: "Total"
    },
    ku: {
        dir: "rtl",
        subSub: "نانەواخانە و کافێ",
        location: "هەولێر",
        heroDesc: "کلیک لەسەر بابەتەکان بکە بۆ زیادکردنیان. کاتێک تەواو بوویت، دوگمەی ناردن لە خوارەوە دابگرە بۆ ناردنی داواکارییەکەت ڕاستەوخۆ بۆ کارمەندانمان لە ڕێگەی واتسئەپەوە.",
        qrTitle: "بۆ داواکردن سکان بکە",
        qrDesc: "کامێرای مۆبایلەکەت ڕووبەڕووی ئەم کۆدە بکەرەوە بۆ کردنەوەی ڕاستەوخۆی مینیو.",
        printedBtn: "بینینی مینیۆی چاپکراوی نەریتی",
        footerThanks: "سوپاس بۆ سەردانەکەتان • نانەواخانە و کافێی ماکانۆلی",
        cartTitle: "داواکاری هەڵبژێردراو",
        cartTotalLabel: "کۆیی گشتی",
        clearBtn: "سڕینەوە",
        submitBtn: "ناردنی داواکاری بۆ کارمەندان",
        tableLabel: "مێزی",
        itemsLabel: "بابەت هەڵبژێردراون",
        itemLabel: "بابەت هەڵبژێردراوە",
        notePastries: "نرخەکان لەگەڵ ستاف پشتڕاست دەکرێنەوە",
        mojito: "مۆهیتۆ", smoothies: "سمووزی", icetea: "ئایس تی", hotdrinks: "خواردنەوە گەرمەکان", latte: "لاتێ", sandwiches: "ساندویچ", croissant: "کرۆسان", cakes: "کێک", energy: "خواردنەوە وزەبەخشەکان", pastries: "شیرینی و هەویرکاری",
        waGreeting: "سڵاو ماکانۆلی 👋", waTable: "👉 داواکاری لە مێزی", waOrder: "داواکارییەکەم", waTotal: "کۆیی گشتی"
    },
    ar: {
        dir: "rtl",
        subSub: "مخبز ومقهى",
        location: "أربيل",
        heroDesc: "اضغط على الأصناف لبناء طلبك. عند الانتهاء، اضغط على زر إرسال الطلب في الأسفل لإرسال طلب الطاولة الخاص بك مباشرة إلى طاقمنا عبر الواتساب.",
        qrTitle: "امسح الرمز للطلب",
        qrDesc: "وجه كاميرا هاتفك فوق الرمز لفتح قائمة الطعام التفاعلية مباشرة.",
        printedBtn: "عرض القائمة المطبوعة التقليدية",
        footerThanks: "شكراً لكم واستمتعوا بوقتكم • مخبز ومقهى ماكانولي",
        cartTitle: "الطلب المحدد",
        cartTotalLabel: "الحساب الإجمالي",
        clearBtn: "مسح",
        submitBtn: "إرسال الطلب إلى الطاقم",
        tableLabel: "طاولة",
        itemsLabel: "أصناف مختارة",
        itemLabel: "صنف واحد مختار",
        notePastries: "الأسعار يتم تأكيدها مع الموظفين",
        mojito: "موهيتو", smoothies: "سموذي", icetea: "شاي مثلج", hotdrinks: "مشروبات ساخنة", latte: "لاتيه", sandwiches: "سندويشات", croissant: "كرواسون", cakes: "كيك", energy: "مشروبات طاقة", pastries: "معجنات وحلويات",
        waGreeting: "مرحباً ماكانولي 👋", waTable: "👉 طلب من طاولة", waOrder: "طلبي", waTotal: "المجموع الكلي"
    }
};

const FRUIT_FLAVORS = {
    en: ["Strawberry", "Blueberry", "Apple", "Mango", "Peach", "Pineapple", "Raspberry", "Kiwi", "Cherry", "Passion Fruit"],
    ku: ["شلیک", "بلو بێری", "سێو", "مانگۆ", "خۆخ", "ئەنەناس", "ڕاسبێری", "کیوی", "گێلاس", "پاشن فروت"],
    ar: ["فراولة", "توت أزرق", "تفاح", "مانجو", "خوخ", "أناناس", "توت عليق", "كيوي", "كرز", "فاكهة العاطفة"]
};

let currentLang = null;
let cart = [];

const urlParams = new URLSearchParams(window.location.search);
const tableNumber = urlParams.get('table');

const getMenuData = (lang) => {
    const f = FRUIT_FLAVORS[lang];
    const makeFlavors = (suffix, price, prefix = "") => f.map(flavor => ({
        name: `${prefix}${flavor}${suffix}`,
        price: price
    }));

    return [
        {
            name: translations[lang].mojito, id: "cat-mojito", image: "mojito.jpg",
            items: [{ name: lang === "en" ? "Classic Mojito" : lang === "ku" ? "مۆهیتۆ کلاسیک" : "موهيتو كلاسيك", price: 6000 }, ...makeFlavors(lang === "en" ? " Mojito" : lang === "ku" ? " مۆهیتۆ" : " موهيتو", 7000)]
        },
        { name: translations[lang].smoothies, id: "cat-smoothies", image: "smoothies.jpg", items: makeFlavors(lang === "en" ? " Smoothie" : lang === "ku" ? " سمووزی" : " سموذي", 7000) },
        { name: translations[lang].icetea, id: "cat-icetea", image: "ice-tea.jpg", items: makeFlavors(lang === "en" ? " Ice Tea" : lang === "ku" ? " ئایس تی" : " شاي مثلج", 7000) },
        {
            name: translations[lang].hotdrinks, id: "cat-hotdrinks", image: "hot-drinks.jpg",
            items: [
                { name: lang === "en" ? "Espresso" : lang === "ku" ? "ئێسپرێسۆ" : "إسبريسو", price: 4000 },
                { name: lang === "en" ? "Americano" : lang === "ku" ? "ئەمەریکانۆ" : "أمريكانو", price: 6000 },
                { name: lang === "en" ? "Cappuccino" : lang === "ku" ? "کاپوچینۆ" : "كابوتشينو", price: 7000 },
                { name: lang === "en" ? "Hot Chocolate" : lang === "ku" ? "شۆکۆلاتەی گەرم" : "شوكولاتة ساخنة", price: 7000 },
                { name: lang === "en" ? "Tea" : lang === "ku" ? "چای" : "شاي", price: 2000 }
            ]
        },
        {
            name: translations[lang].latte, id: "cat-latte", image: "latte.jpg",
            items: ["Classic", "Vanilla", "Caramel", "Spanish", "Rose", "Cinnamon", "Lavender"].map(n => {
                const mapPrices = { "Classic": 6000, "Vanilla": 7000, "Caramel": 7000, "Spanish": 7000, "Rose": 7000, "Cinnamon": 7000, "Lavender": 7000 };
                return { name: lang === "en" ? `${n} Latte` : lang === "ku" ? `لاتێ ${langNameKU(n)}` : `لاتيه ${langNameAR(n)}`, price: mapPrices[n] };
            })
        },
        {
            name: translations[lang].sandwiches, id: "cat-sandwiches", image: "sandwiches.jpg",
            items: [
                { name: lang === "en" ? "Chicken Classic" : lang === "ku" ? "مریشکی کلاسیک" : "دجاج كلاسيك", price: 6000 },
                { name: lang === "en" ? "Chicken Caesar" : lang === "ku" ? "مریشکی قەیسەر" : "دجاج سيزر", price: 6000 },
                { name: lang === "en" ? "Meat Sandwich" : lang === "ku" ? "ساندویچی گۆشت" : "سندويش لحم", price: 6000 },
                { name: lang === "en" ? "Hot Dog" : lang === "ku" ? "هۆت دۆگ" : "هوت دوغ", price: 6000 },
                { name: lang === "en" ? "Salami" : lang === "ku" ? "سەلامی" : "سلامي", price: 6000 }
            ]
        },
        {
            name: translations[lang].croissant, id: "cat-croissant", image: "croissant.jpg",
            items: [
                { name: lang === "en" ? "Cheese Croissant" : lang === "ku" ? "کرۆسانی پەنیر" : "كرواسون جبنة", price: 5000 },
                { name: lang === "en" ? "Chocolate Croissant" : lang === "ku" ? "کرۆسانی شوکۆلاتە" : "كرواسون شوكولاتة", price: 5000 },
                { name: lang === "en" ? "Plain Croissant" : lang === "ku" ? "کرۆسانی سادە" : "كرواسون سادة", price: 5000 },
                { name: lang === "en" ? "Cube Croissant" : lang === "ku" ? "کرۆسانی چوارگۆشە (Cube)" : "كرواسون مكعب", price: 5000 },
                { name: lang === "en" ? "Roll Croissant" : lang === "ku" ? "کرۆسانی ڕۆڵ" : "كرواسون رول", price: 5000 },
                { name: lang === "en" ? "Ribbon Croissant" : lang === "ku" ? "کرۆسانی ڕیبۆن" : "كرواسون ريبون", price: 5000 },
                { name: lang === "en" ? "Crema with Fruit Croissant" : lang === "ku" ? "کرۆسانی کرێم و میوە" : "كرواسون كريمة وفواكه", price: 5000 }
            ]
        },
        {
            name: translations[lang].cakes, id: "cat-cakes", image: "cakes.jpg",
            items: [
                { name: lang === "en" ? "Banana Cake" : lang === "ku" ? "کێکی مۆز" : "كيك موز", price: 3000 },
                { name: lang === "en" ? "Brownie Cube" : lang === "ku" ? "بڕاونی چوارگۆشە" : "مكعب براوني", price: 6000 },
                { name: lang === "en" ? "Brownie" : lang === "ku" ? "بڕاونی" : "براوني", price: 7000 },
                { name: lang === "en" ? "Chocolate Mousse" : lang === "ku" ? "موویسی شوکۆلاتە" : "موس الشوكولاتة", price: 6000 },
                { name: lang === "en" ? "Tiramisu" : lang === "ku" ? "تیرامیسو" : "تيراميسو", price: 5000 },
                { name: lang === "en" ? "Red Velvet" : lang === "ku" ? "ڕێد ڤێلڤێت" : "ريد فيلفيت", price: 7000 },
                { name: lang === "en" ? "Lazy Cake" : lang === "ku" ? "لەیزی کێک" : "ليزى كيك", price: 5000 }
            ]
        },
        {
            name: translations[lang].energy, id: "cat-energy", image: "energy-drinks.jpg",
            items: [
                { name: lang === "en" ? "Red Bull Classic" : lang === "ku" ? "ڕێد بۆڵ کلاسیک" : "ريد بول كلاسيك", price: 4000 },
                ...makeFlavors("", 7000, lang === "en" ? "Red Bull " : lang === "ku" ? "ڕێد بۆڵ " : "ريد بول ")
            ]
        },
        {
            name: translations[lang].pastries, id: "cat-pastries", note: translations[lang].notePastries,
            items: [
                { name: lang === "en" ? "Cinnamon Roll" : lang === "ku" ? "سینامۆن ڕۆڵ" : "لفافة القرفة", price: 5000 },
                { name: lang === "en" ? "Canele" : lang === "ku" ? "کانێلی" : "كانيل", price: 3000 },
                { name: lang === "en" ? "Bombolini with Fruit" : lang === "ku" ? "بۆمبۆلینی لەگەڵ میوە" : "بومبوليني بالفواكه", price: 5000 },
                { name: lang === "en" ? "Bombolini" : lang === "ku" ? "بۆمبۆلینی سادە" : "بومبوليني", price: 4000 },
                { name: lang === "en" ? "Danish with Fruit" : lang === "ku" ? "دانۆش لەگەڵ میوە" : "دانش بالفواكه", price: 5000 },
                { name: lang === "en" ? "Danish" : lang === "ku" ? "دانۆش سادە" : "دانش", price: 4000 },
                { name: lang === "en" ? "Donut" : lang === "ku" ? "دۆنات" : "دونات", price: 3000 },
                { name: lang === "en" ? "Galette" : lang === "ku" ? "گالێت" : "غاليت", price: 5000 }
            ]
        }
    ];
};

function langNameKU(n) {
    const m = { "Classic": "کلاسیک", "Vanilla": "ڤانیلا", "Caramel": "کارامێل", "Spanish": "سپانیش", "Rose": "گوڵ", "Cinnamon": "دارچینی", "Lavender": "لاڤێندەر" };
    return m[n] || n;
}
function langNameAR(n) {
    const m = { "Classic": "كلاسيك", "Vanilla": "فانيليا", "Caramel": "كاراميل", "Spanish": "سبانيش", "Rose": "ورد", "Cinnamon": "قرفة", "Lavender": "خزامى" };
    return m[n] || n;
}

let itemPriceLookup = {};

// Handle Language Selections & Overwrite the Explicit CSS Display States
window.selectLanguage = function(lang) {
    currentLang = lang;
    
    // Toggle displays securely using primitive standard rules
    document.getElementById("language-gate").style.setProperty("display", "none", "important");
    document.getElementById("application-content-wrapper").style.setProperty("display", "block", "important");
    
    document.body.setAttribute("dir", translations[lang].dir);
    document.getElementById("lang-switcher").value = lang;

    const menuData = getMenuData(lang);
    itemPriceLookup = {};
    menuData.forEach(cat => cat.items.forEach(i => itemPriceLookup[i.name] = i.price));

    // Fill strings
    document.getElementById("txt-sub-sub").textContent = translations[lang].subSub;
    document.getElementById("txt-location").textContent = translations[lang].location;
    document.getElementById("txt-hero-desc").textContent = translations[lang].heroDesc;
    document.getElementById("txt-qr-title").textContent = translations[lang].qrTitle;
    document.getElementById("txt-qr-desc").textContent = translations[lang].qrDesc;
    document.getElementById("txt-printed-btn").textContent = translations[lang].printedBtn;
    document.getElementById("txt-footer-thanks").textContent = translations[lang].footerThanks;
    document.getElementById("txt-cart-title").textContent = translations[lang].cartTitle;
    document.getElementById("txt-cart-total-label").textContent = translations[lang].cartTotalLabel;
    document.getElementById("txt-clear-btn").textContent = translations[lang].clearBtn;
    document.getElementById("txt-submit-btn").textContent = translations[lang].submitBtn;

    renderCategoryNav(menuData);
    renderMenuGrid(menuData);
    checkTableBadge();
    updateCartUI();
};

document.addEventListener("DOMContentLoaded", () => {
    setupCartListeners();
});

function checkTableBadge() {
    if (tableNumber && currentLang) {
        const noticeBox = document.getElementById("table-notice");
        const noticeVal = document.getElementById("table-notice-val");
        if (noticeBox && noticeVal) {
            noticeVal.textContent = `${translations[currentLang].tableLabel} ${tableNumber}`;
            noticeBox.classList.remove("hidden");
            noticeBox.classList.add("flex");
        }
    }
}

function renderCategoryNav(menuData) {
    const navBar = document.getElementById("category-nav-pills");
    if (!navBar) return;
    navBar.innerHTML = "";

    menuData.forEach((category, idx) => {
        const pill = document.createElement("button");
        pill.className = `px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer border ${
            idx === 0 ? "bg-yellow-400 text-black border-yellow-400 shadow-md" : "bg-zinc-950 text-zinc-400 border-zinc-900"
        }`;
        pill.textContent = category.name;
        pill.onclick = () => {
            const element = document.getElementById(category.id);
            if (element) {
                const topOffset = element.getBoundingClientRect().top + window.scrollY - 130;
                window.scrollTo({ top: topOffset, behavior: 'smooth' });
            }
            document.querySelectorAll("#category-nav-pills button").forEach(b => {
                b.className = "px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer border bg-zinc-950 text-zinc-400 border-zinc-900";
            });
            pill.className = "px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer border bg-yellow-400 text-black border-yellow-400 shadow-md";
        };
        navBar.appendChild(pill);
    });
}

function renderMenuGrid(menuData) {
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
                        <p class="text-zinc-500 text-[11px] font-medium uppercase tracking-wider">Maccannoli Premium</p>
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
                <div class="group bg-zinc-950/40 hover:bg-zinc-950 border border-zinc-900 hover:border-zinc-800 rounded-2xl p-4 flex justify-between items-center transition-all duration-200">
                    <div class="space-y-1 pr-2">
                        <h3 class="text-sm font-semibold tracking-wide text-zinc-200 group-hover:text-white transition-colors">${item.name}</h3>
                        <p class="text-yellow-400 font-bold text-xs tracking-wide">${item.price.toLocaleString()} <span class="text-[10px] text-yellow-500/80 font-medium">IQD</span></p>
                    </div>
                    <div class="flex items-center gap-2.5 shrink-0" data-item-id="${safeName}">
                        <div class="quantity-controls flex items-center gap-2.5 hidden">
                            <button onclick="changeQty('${safeName}', -1)" class="w-8 h-8 rounded-xl bg-zinc-900 text-zinc-400 font-bold text-base flex items-center justify-center cursor-pointer border border-zinc-800 active:scale-95">-</button>
                            <span class="quantity-val text-yellow-400 font-extrabold text-sm w-5 text-center">0</span>
                        </div>
                        <button onclick="changeQty('${safeName}', 1)" class="w-8 h-8 rounded-xl bg-yellow-400 text-black font-bold text-base flex items-center justify-center cursor-pointer active:scale-95">+</button>
                    </div>
                </div>`;
        });
        itemsHTML += `</div>`;

        section.innerHTML = bannerHTML + itemsHTML;
        container.appendChild(section);
    });
    if (window.lucide) window.lucide.createIcons();
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
    if (!currentLang) return;
    
    const cartBar = document.getElementById("cart-bar");
    const cartCount = document.getElementById("cart-count");
    const cartTotal = document.getElementById("cart-total");
    const tagsContainer = document.getElementById("cart-summary-tags");

    if (cart.length === 0) {
        cartBar.style.transform = "translateY(20px)";
        cartBar.style.opacity = "0";
        cartBar.style.pointerEvents = "none";
        document.querySelectorAll('.quantity-controls').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.quantity-val').forEach(el => el.textContent = '0');
        return;
    }

    cartBar.style.transform = "translateY(0)";
    cartBar.style.opacity = "1";
    cartBar.style.pointerEvents = "auto";
    
    cartCount.textContent = `${cart.length} ${cart.length === 1 ? translations[currentLang].itemLabel : translations[currentLang].itemsLabel}`;

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
    if (cart.length === 0 || !currentLang) return;

    const t = translations[currentLang];
    const counts = {};
    cart.forEach(name => counts[name] = (counts[name] || 0) + 1);

    let textMessage = `${t.waGreeting}\n`;
    if (tableNumber) {
        textMessage += `${t.waTable}: ${tableNumber}\n\n`;
    } else {
        textMessage += "\n";
    }
    
    textMessage += `${t.waOrder}:\n`;
    
    let totalCost = 0;
    Object.entries(counts).forEach(([name, qty]) => {
        const itemCost = itemPriceLookup[name] || 0;
        textMessage += `• ${qty}x ${name} - ${(qty * itemCost).toLocaleString()} IQD\n`;
        totalCost += qty * itemCost;
    });

    textMessage += `\n${t.waTotal}: ${totalCost.toLocaleString()} IQD`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(textMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer") || (window.location.href = url);
}
