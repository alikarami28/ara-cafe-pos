// ====================================
// ARA Cafe - سیستم POS - نسخه Mobile-First
// با آپدیت‌های ریسپانسیو
// ====================================

document.addEventListener('DOMContentLoaded', async function() {
    // لود تم
    ARAUtils.loadTheme();
    
    // دکمه تغییر تم
    document.getElementById('themeToggle').addEventListener('click', ARAUtils.toggleTheme);
    
    // لود دیتای محصولات
    await loadPOSData();
    
    // تنظیم Event Listeners
    setupPOSEvents();
    
    // لود تاریخچه
    loadOrderHistory();
    
    // تشخیص دستگاه و تنظیمات خاص
    setupDeviceSpecifics();
});

let posProducts = [];
let posCategories = [];
let cart = [];
let currentInvoice = null;

// تشخیص دستگاه
function setupDeviceSpecifics() {
    const isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent);
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
    
    if (isMobile && !isTablet) {
        // تنظیمات خاص موبایل
        document.querySelector('.pos-products-grid').style.gridTemplateColumns = 'repeat(3, 1fr)';
    }
    
    if (isTablet) {
        // تنظیمات خاص تبلت
        document.querySelector('.pos-products-grid').style.gridTemplateColumns = 'repeat(4, 1fr)';
    }
    
    // غیرفعال کردن Drag & Drop در موبایل (بهتر برای UX)
    if (isMobile) {
        document.querySelectorAll('.cart-item').forEach(item => {
            item.draggable = false;
        });
    }
}

// لود دیتای POS
async function loadPOSData() {
    try {
        const response = await fetch('data/products.json');
        const data = await response.json();
        
        posProducts = data.products.filter(p => p.active !== false);
        posCategories = data.categories || [];
        
        renderPOSCategories();
        renderPOSProducts(posProducts);
        setupPOSSearch();
    } catch (error) {
        console.error('Error loading POS data:', error);
        
        // دیتای پیش‌فرض
        posProducts = [
            { id: 1, name: 'لاته', price: 120000, category: 'hot' },
            { id: 2, name: 'کاپوچینو', price: 110000, category: 'hot' },
            { id: 3, name: 'آمریکانو', price: 90000, category: 'hot' },
            { id: 4, name: 'آیس لاته', price: 130000, category: 'cold' },
            { id: 5, name: 'فراپه', price: 140000, category: 'cold' },
            { id: 6, name: 'چای ماسالا', price: 100000, category: 'tea' },
            { id: 7, name: 'چیزکیک', price: 150000, category: 'dessert' }
        ];
        posCategories = [
            { id: 'hot', name: 'گرم', icon: '☕' },
            { id: 'cold', name: 'سرد', icon: '🧊' },
            { id: 'tea', name: 'چای', icon: '🫖' },
            { id: 'dessert', name: 'دسر', icon: '🍰' }
        ];
        
        renderPOSCategories();
        renderPOSProducts(posProducts);
    }
}

// رندر دسته‌بندی‌های POS
function renderPOSCategories() {
    const container = document.getElementById('posCategories');
    container.innerHTML = '';
    
    // دکمه "همه"
    const allBtn = document.createElement('button');
    allBtn.className = 'pos-category-btn active';
    allBtn.textContent = 'همه';
    allBtn.addEventListener('click', () => filterPOSByCategory('all'));
    container.appendChild(allBtn);
    
    posCategories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = 'pos-category-btn';
        btn.textContent = `${category.icon || ''} ${category.name}`;
        btn.addEventListener('click', () => filterPOSByCategory(category.id));
        container.appendChild(btn);
    });
}

// رندر محصولات POS
function renderPOSProducts(products) {
    const grid = document.getElementById('posProductsGrid');
    grid.innerHTML = '';
    
    if (products.length === 0) {
        grid.innerHTML = '<div style="text-align: center; padding: 20px; opacity: 0.5; grid-column: 1 / -1;">محصولی یافت نشد</div>';
        return;
    }
    
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'pos-product-card';
        card.innerHTML = `
            <div class="pos-product-name">${product.name}</div>
            <div class="pos-product-price">${ARAUtils.formatCurrency(product.price)}</div>
        `;
        
        // تاچ و کلیک
        card.addEventListener('click', (e) => {
            e.preventDefault();
            addToCart(product);
            
            // بازخورد لمسی
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
                card.style.transform = '';
            }, 150);
        });
        
        // لانگ پرس برای جزئیات
        let longPressTimer;
        card.addEventListener('touchstart', () => {
            longPressTimer = setTimeout(() => {
                // می‌تونیم جزئیات محصول رو نشون بدیم
                console.log('Long press:', product.name);
            }, 500);
        });
        
        card.addEventListener('touchend', () => {
            clearTimeout(longPressTimer);
        });
        
        grid.appendChild(card);
    });
}

// فیلتر محصولات POS
function filterPOSByCategory(categoryId) {
    // آپدیت دکمه‌های فعال
    document.querySelectorAll('.pos-category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (categoryId === 'all') {
        document.querySelectorAll('.pos-category-btn')[0].classList.add('active');
        renderPOSProducts(posProducts);
        return;
    }
    
    // پیدا کردن دکمه مرتبط
    const buttons = document.querySelectorAll('.pos-category-btn');
    let found = false;
    buttons.forEach(btn => {
        const category = posCategories.find(c => 
            btn.textContent.includes(c.name) && c.id === categoryId
        );
        if (category) {
            btn.classList.add('active');
            found = true;
        }
    });
    
    if (!found && buttons.length > 0) {
        buttons[0].classList.add('active');
    }
    
    const filtered = posProducts.filter(p => p.category === categoryId);
    renderPOSProducts(filtered);
}

// جستجوی POS
function setupPOSSearch() {
    const searchInput = document.getElementById('posSearchInput');
    
    searchInput.addEventListener('input', ARAUtils.debounce(function(e) {
        const query = e.target.value.trim().toLowerCase();
        
        if (query === '') {
            renderPOSProducts(posProducts);
            return;
        }
        
        const filtered = posProducts.filter(product => 
            product.name.toLowerCase().includes(query) ||
            (product.description && product.description.toLowerCase().includes(query))
        );
        
        renderPOSProducts(filtered);
    }, 300));
    
    // فوکوس خودکار روی جستجو
    searchInput.focus();
}

// افزودن به سبد خرید
function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.qty++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            qty: 1
        });
    }
    
    renderCart();
    updateCalculations();
    
    // اسکرول به پایین سبد خرید در موبایل
    if (window.innerWidth < 768) {
        const cartItems = document.getElementById('cartItems');
        cartItems.scrollTop = cartItems.scrollHeight;
    }
    
    // بازخورد صوتی (اختیاری)
    if ('vibrate' in navigator) {
        navigator.vibrate(30);
    }
}

// افزایش تعداد
function increaseQty(productId) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.qty++;
        renderCart();
        updateCalculations();
        if ('vibrate' in navigator) {
            navigator.vibrate(15);
        }
    }
}

// کاهش تعداد
function decreaseQty(productId) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (item.qty > 1) {
            item.qty--;
        } else {
            if (confirm('حذف این آیتم از سبد خرید؟')) {
                cart = cart.filter(item => item.id !== productId);
            } else {
                return;
            }
        }
        renderCart();
        updateCalculations();
        if ('vibrate' in navigator) {
            navigator.vibrate(15);
        }
    }
}

// حذف از سبد خرید
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    renderCart();
    updateCalculations();
    if ('vibrate' in navigator) {
        navigator.vibrate([20, 50, 20]);
    }
}

// رندر سبد خرید
function renderCart() {
    const container = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        container.innerHTML = '<div class="empty-cart"><p>🛒 سبد خرید خالی است</p><p style="font-size: 0.8rem; opacity: 0.6;">برای افزودن محصول کلیک کنید</p></div>';
        return;
    }
    
    container.innerHTML = '';
    
    cart.forEach(item => {
        const totalPrice = item.price * item.qty;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        
        // فقط در دسکتاپ Drag فعال است
        if (window.innerWidth >= 1024) {
            cartItem.draggable = true;
        }
        
        cartItem.innerHTML = `
            <div class="item-info">
                <div class="item-name">${item.name}</div>
                <div class="item-price">
                    ${ARAUtils.formatCurrency(item.price)} × ${item.qty} = 
                    <strong>${ARAUtils.formatCurrency(totalPrice)}</strong>
                </div>
            </div>
            <div class="item-controls">
                <button class="qty-btn" onclick="decreaseQty(${item.id})" aria-label="کاهش">−</button>
                <span class="item-qty">${item.qty}</span>
                <button class="qty-btn" onclick="increaseQty(${item.id})" aria-label="افزایش">+</button>
                <button class="delete-item" onclick="removeFromCart(${item.id})" aria-label="حذف">🗑</button>
            </div>
        `;
        
        container.appendChild(cartItem);
    });
}

// محاسبات سبد خرید
function updateCalculations() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discountPercent = parseFloat(document.getElementById('discountPercent').value) || 0;
    const discountAmount = parseFloat(document.getElementById('discountAmount').value) || 0;
    
    let discount = 0;
    
    if (discountPercent > 0) {
        discount = subtotal * (discountPercent / 100);
    } else if (discountAmount > 0) {
        discount = discountAmount;
    }
    
    const tax = subtotal * 0.09;
    const total = subtotal - discount + tax;
    
    document.getElementById('subtotal').textContent = ARAUtils.formatCurrency(subtotal);
    document.getElementById('tax').textContent = ARAUtils.formatCurrency(tax);
    document.getElementById('total').textContent = ARAUtils.formatCurrency(total);
    
    // فعال/غیرفعال کردن دکمه چاپ
    document.getElementById('printInvoiceBtn').disabled = !currentInvoice;
}

// تنظیم Event Listeners
function setupPOSEvents() {
    // پاک کردن سبد خرید
    document.getElementById('clearCartBtn').addEventListener('click', () => {
        if (cart.length === 0) return;
        
        if (confirm('آیا از حذف تمام آیتم‌های سبد خرید اطمینان دارید؟')) {
            cart = [];
            renderCart();
            updateCalculations();
            if ('vibrate' in navigator) {
                navigator.vibrate([50, 100, 50]);
            }
        }
    });
    
    // تغییر تخفیف
    document.getElementById('discountPercent').addEventListener('input', function() {
        if (this.value) {
            document.getElementById('discountAmount').value = '';
        }
        updateCalculations();
    });
    
    document.getElementById('discountAmount').addEventListener('input', function() {
        if (this.value) {
            document.getElementById('discountPercent').value = '';
        }
        updateCalculations();
    });
    
    // صدور فاکتور
    document.getElementById('generateInvoiceBtn').addEventListener('click', generateInvoice);
    
    // چاپ فاکتور
    document.getElementById('printInvoiceBtn').addEventListener('click', printInvoice);
    
    // جستجوی تاریخچه
    document.getElementById('searchHistoryBtn').addEventListener('click', () => {
        const dateFilter = document.getElementById('historyDateSearch').value;
        loadOrderHistory(dateFilter);
    });
    
    // بستن مودال
    document.querySelector('.close-modal').addEventListener('click', () => {
        document.getElementById('invoiceModal').classList.remove('active');
    });
    
    // کلیک خارج از مودال
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('invoiceModal');
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    // Swipe در مودال برای بستن
    let touchStartY = 0;
    document.querySelector('.modal-content').addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    });
    
    document.querySelector('.modal-content').addEventListener('touchmove', (e) => {
        const touchEndY = e.touches[0].clientY;
        if (touchEndY - touchStartY > 100) {
            document.getElementById('invoiceModal').classList.remove('active');
        }
    });
    
    // کیبورد شورتکات (فقط دسکتاپ)
    if (window.innerWidth >= 1024) {
        document.addEventListener('keydown', handleKeyboardShortcuts);
    }
    
    // رفرش ریسپانسیو
    window.addEventListener('resize', ARAUtils.debounce(() => {
        renderCart(); // بروزرسانی Drag & Drop
    }, 250));
}

// کیبورد شورتکات‌ها
function handleKeyboardShortcuts(e) {
    // جلوگیری از اجرا در input‌ها
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    // Ctrl + Enter = صدور فاکتور
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        generateInvoice();
    }
    
    // Ctrl + P = چاپ فاکتور
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        if (currentInvoice) {
            printInvoice();
        }
    }
    
    // Esc = پاک کردن سبد
    if (e.key === 'Escape' && cart.length > 0) {
        if (confirm('پاک کردن سبد خرید؟')) {
            cart = [];
            renderCart();
            updateCalculations();
        }
    }
    
    // F1 = فوکوس روی جستجو
    if (e.key === 'F1') {
        e.preventDefault();
        document.getElementById('posSearchInput').focus();
    }
    
    // F2 = فوکوس روی تخفیف درصدی
    if (e.key === 'F2') {
        e.preventDefault();
        document.getElementById('discountPercent').focus();
    }
    
    // +/- برای آخرین آیتم
    if (e.key === '+' && e.ctrlKey && cart.length > 0) {
        e.preventDefault();
        const lastItem = cart[cart.length - 1];
        increaseQty(lastItem.id);
    }
    
    if (e.key === '-' && e.ctrlKey && cart.length > 0) {
        e.preventDefault();
        const lastItem = cart[cart.length - 1];
        decreaseQty(lastItem.id);
    }
}

// صدور فاکتور
function generateInvoice() {
    if (cart.length === 0) {
        alert('⚠️ سبد خرید خالی است!');
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
        }
        return;
    }
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discountPercent = parseFloat(document.getElementById('discountPercent').value) || 0;
    const discountAmount = parseFloat(document.getElementById('discountAmount').value) || 0;
    
    let discount = 0;
    if (discountPercent > 0) {
        discount = subtotal * (discountPercent / 100);
    } else if (discountAmount > 0) {
        discount = discountAmount;
    }
    
    const tax = subtotal * 0.09;
    
    // ایجاد سفارش
    currentInvoice = window.orderManager.createOrder(cart, subtotal, discount, tax);
    
    // نمایش فاکتور در مودال
    showInvoiceModal(currentInvoice);
    
    // پاک کردن سبد
    cart = [];
    renderCart();
    updateCalculations();
    
    // رفرش تاریخچه
    loadOrderHistory();
    
    // بازخورد موفقیت
    if ('vibrate' in navigator) {
        navigator.vibrate([50, 30, 50, 30, 100]);
    }
    
    // نمایش alert با تاخیر (بعد از مودال)
    setTimeout(() => {
        alert(`✅ فاکتور شماره ${currentInvoice.invoiceNo} با موفقیت صادر شد.`);
    }, 300);
}

// نمایش فاکتور در مودال
function showInvoiceModal(invoice) {
    const modal = document.getElementById('invoiceModal');
    const details = document.getElementById('invoiceDetails');
    
    details.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <img src="logo.png" alt="Logo" style="width: 50px; height: 50px; border-radius: 50%; margin-bottom: 10px;">
            <h2>🧾 فاکتور فروش</h2>
            <p style="color: var(--color-accent);">ARA Cafe</p>
        </div>
        <hr>
        <div style="margin: 15px 0;">
            <p><strong>شماره فاکتور:</strong> ${invoice.invoiceNo}</p>
            <p><strong>تاریخ:</strong> ${ARAUtils.formatDate(invoice.date)}</p>
        </div>
        <hr>
        <h3 style="margin: 10px 0;">📋 اقلام:</h3>
        <div style="margin: 10px 0;">
            ${invoice.items.map(item => `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <span>${item.name} × ${item.qty}</span>
                    <span>${ARAUtils.formatCurrency(item.qty * item.price)}</span>
                </div>
            `).join('')}
        </div>
        <hr>
        <div style="margin: 10px 0;">
            <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                <span>جمع کل:</span>
                <span>${ARAUtils.formatCurrency(invoice.subtotal)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                <span>تخفیف:</span>
                <span style="color: var(--color-danger);">${ARAUtils.formatCurrency(invoice.discount)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                <span>مالیات (۹٪):</span>
                <span>${ARAUtils.formatCurrency(invoice.tax)}</span>
            </div>
        </div>
        <hr>
        <div style="display: flex; justify-content: space-between; font-size: 1.4rem; font-weight: 900; color: var(--color-accent); margin: 15px 0;">
            <span>💰 مبلغ نهایی:</span>
            <span>${ARAUtils.formatCurrency(invoice.total)}</span>
        </div>
        <div style="text-align: center; margin-top: 20px; opacity: 0.7; font-size: 0.85rem;">
            <p>با تشکر از خرید شما 🌹</p>
            <p>ARA Cafe - 021-12345678</p>
        </div>
    `;
    
    modal.classList.add('active');
}

// چاپ فاکتور
function printInvoice() {
    if (!currentInvoice) {
        alert('⚠️ ابتدا یک فاکتور صادر کنید.');
        return;
    }
    
    const printTemplate = document.getElementById('printTemplate');
    
    printTemplate.innerHTML = `
        <div style="text-align: center; padding: 15px; font-family: 'Vazirmatn', sans-serif; width: 80mm; font-size: 12px;">
            <img src="logo.png" alt="Logo" style="width: 50px; height: 50px; border-radius: 50%; margin-bottom: 8px;">
            <h2 style="margin: 3px 0; font-size: 16px;">☕ ARA Cafe</h2>
            <p style="margin: 3px 0; font-size: 11px;">قهوه اصیل، طعم بی‌نظیر</p>
            <hr style="border: 1px dashed #000; margin: 8px 0;">
            <p style="margin: 3px 0;"><strong>فاکتور شماره:</strong> ${currentInvoice.invoiceNo}</p>
            <p style="margin: 3px 0;"><strong>تاریخ:</strong> ${ARAUtils.formatDate(currentInvoice.date)}</p>
            <hr style="border: 1px dashed #000; margin: 8px 0;">
            <table style="width: 100%; text-align: right; font-size: 11px; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 1px solid #000;">
                        <th style="padding: 3px;">نام</th>
                        <th style="padding: 3px;">تعداد</th>
                        <th style="padding: 3px;">قیمت</th>
                        <th style="padding: 3px;">جمع</th>
                    </tr>
                </thead>
                <tbody>
                    ${currentInvoice.items.map(item => `
                        <tr>
                            <td style="padding: 3px;">${item.name}</td>
                            <td style="padding: 3px; text-align: center;">${item.qty}</td>
                            <td style="padding: 3px;">${ARAUtils.formatCurrency(item.price)}</td>
                            <td style="padding: 3px;">${ARAUtils.formatCurrency(item.qty * item.price)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <hr style="border: 1px dashed #000; margin: 8px 0;">
            <p style="margin: 3px 0; display: flex; justify-content: space-between;"><span>جمع کل:</span> <span>${ARAUtils.formatCurrency(currentInvoice.subtotal)}</span></p>
            <p style="margin: 3px 0; display: flex; justify-content: space-between;"><span>تخفیف:</span> <span>${ARAUtils.formatCurrency(currentInvoice.discount)}</span></p>
            <p style="margin: 3px 0; display: flex; justify-content: space-between;"><span>مالیات:</span> <span>${ARAUtils.formatCurrency(currentInvoice.tax)}</span></p>
            <h3 style="margin: 8px 0; font-size: 15px;">💰 مبلغ نهایی: ${ARAUtils.formatCurrency(currentInvoice.total)}</h3>
            <hr style="border: 1px dashed #000; margin: 8px 0;">
            <p style="margin: 3px 0; font-size: 11px;">با تشکر از خرید شما 🌹</p>
            <p style="margin: 3px 0; font-size: 10px;">ARA Cafe - 021-12345678</p>
            <p style="margin: 3px 0; font-size: 10px;">@ara_cafe</p>
        </div>
    `;
    
    window.print();
}

// لود تاریخچه فاکتورها
function loadOrderHistory(dateFilter = null) {
    const container = document.getElementById('historyList');
    
    if (!window.orderManager) {
        container.innerHTML = '<p style="opacity: 0.5; font-size: 0.8rem;">در حال بارگذاری...</p>';
        return;
    }
    
    const orders = window.orderManager.getOrderHistory(dateFilter);
    
    if (orders.length === 0) {
        container.innerHTML = '<p style="opacity: 0.5; font-size: 0.8rem;">📭 موردی یافت نشد</p>';
        return;
    }
    
    container.innerHTML = orders.slice(0, 20).map(order => `
        <div class="history-item" onclick="showInvoiceDetails(${order.invoiceNo})">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong>#${order.invoiceNo}</strong>
                <span style="font-size: 0.75rem; opacity: 0.7;">${ARAUtils.formatDate(order.date)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 3px;">
                <span>${order.items.length} آیتم</span>
                <span style="color: var(--color-accent); font-weight: 700;">${ARAUtils.formatCurrency(order.total)}</span>
            </div>
        </div>
    `).join('');
}

// نمایش جزئیات فاکتور از تاریخچه
function showInvoiceDetails(invoiceNo) {
    if (!window.orderManager) return;
    
    const invoice = window.orderManager.getOrderByInvoiceNo(invoiceNo);
    if (invoice) {
        currentInvoice = invoice;
        showInvoiceModal(invoice);
    }
}