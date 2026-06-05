// ====================================
// ARA Cafe - سیستم POS اصلی
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
});

let posProducts = [];
let posCategories = [];
let cart = [];
let currentInvoice = null;

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
            { id: 3, name: 'آیس لاته', price: 130000, category: 'cold' }
        ];
        posCategories = [
            { id: 'hot', name: 'گرم', icon: '☕' },
            { id: 'cold', name: 'سرد', icon: '🧊' }
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
        btn.textContent = `${category.icon} ${category.name}`;
        btn.addEventListener('click', () => filterPOSByCategory(category.id));
        container.appendChild(btn);
    });
}

// رندر محصولات POS
function renderPOSProducts(products) {
    const grid = document.getElementById('posProductsGrid');
    grid.innerHTML = '';
    
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'pos-product-card';
        card.innerHTML = `
            <div class="pos-product-name">${product.name}</div>
            <div class="pos-product-price">${ARAUtils.formatCurrency(product.price)}</div>
        `;
        card.addEventListener('click', () => addToCart(product));
        grid.appendChild(card);
    });
}

// فیلتر محصولات POS
function filterPOSByCategory(categoryId) {
    document.querySelectorAll('.pos-category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (categoryId === 'all') {
        document.querySelectorAll('.pos-category-btn')[0].classList.add('active');
        renderPOSProducts(posProducts);
    } else {
        const buttons = document.querySelectorAll('.pos-category-btn');
        buttons.forEach(btn => {
            if (btn.textContent.includes(getCategoryName(categoryId))) {
                btn.classList.add('active');
            }
        });
        
        const filtered = posProducts.filter(p => p.category === categoryId);
        renderPOSProducts(filtered);
    }
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
            product.name.toLowerCase().includes(query)
        );
        
        renderPOSProducts(filtered);
    }, 300));
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
}

// افزایش تعداد
function increaseQty(productId) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.qty++;
        renderCart();
        updateCalculations();
    }
}

// کاهش تعداد
function decreaseQty(productId) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (item.qty > 1) {
            item.qty--;
        } else {
            cart = cart.filter(item => item.id !== productId);
        }
        renderCart();
        updateCalculations();
    }
}

// حذف از سبد خرید
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    renderCart();
    updateCalculations();
}

// رندر سبد خرید
function renderCart() {
    const container = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        container.innerHTML = '<div class="empty-cart"><p>سبد خرید خالی است</p></div>';
        return;
    }
    
    container.innerHTML = '';
    
    cart.forEach(item => {
        const totalPrice = item.price * item.qty;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.draggable = true;
        
        cartItem.innerHTML = `
            <div class="item-info">
                <div class="item-name">${item.name}</div>
                <div class="item-price">${ARAUtils.formatCurrency(item.price)} × ${item.qty} = ${ARAUtils.formatCurrency(totalPrice)}</div>
            </div>
            <div class="item-controls">
                <button class="qty-btn" onclick="decreaseQty(${item.id})">-</button>
                <span class="item-qty">${item.qty}</span>
                <button class="qty-btn" onclick="increaseQty(${item.id})">+</button>
                <button class="delete-item" onclick="removeFromCart(${item.id})">🗑️</button>
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
    
    const tax = subtotal * 0.09; // ۹٪ مالیات
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
        if (confirm('آیا از حذف تمام آیتم‌ها اطمینان دارید؟')) {
            cart = [];
            renderCart();
            updateCalculations();
        }
    });
    
    // تغییر تخفیف
    document.getElementById('discountPercent').addEventListener('input', updateCalculations);
    document.getElementById('discountAmount').addEventListener('input', function() {
        document.getElementById('discountPercent').value = '';
        updateCalculations();
    });
    
    document.getElementById('discountPercent').addEventListener('input', function() {
        document.getElementById('discountAmount').value = '';
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
    
    // کیبورد شورتکات
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// کیبورد شورتکات‌ها
function handleKeyboardShortcuts(e) {
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
    if (e.key === 'Escape') {
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
}

// صدور فاکتور
function generateInvoice() {
    if (cart.length === 0) {
        alert('سبد خرید خالی است!');
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
    
    alert(`فاکتور شماره ${currentInvoice.invoiceNo} با موفقیت صادر شد.`);
}

// نمایش فاکتور در مودال
function showInvoiceModal(invoice) {
    const modal = document.getElementById('invoiceModal');
    const details = document.getElementById('invoiceDetails');
    
    details.innerHTML = `
        <h2>🧾 فاکتور فروش</h2>
        <hr>
        <p><strong>شماره فاکتور:</strong> ${invoice.invoiceNo}</p>
        <p><strong>تاریخ:</strong> ${ARAUtils.formatDate(invoice.date)}</p>
        <hr>
        <h3>اقلام:</h3>
        <ul>
            ${invoice.items.map(item => `
                <li>${item.name} - ${item.qty} عدد × ${ARAUtils.formatCurrency(item.price)} = ${ARAUtils.formatCurrency(item.qty * item.price)}</li>
            `).join('')}
        </ul>
        <hr>
        <p><strong>جمع کل:</strong> ${ARAUtils.formatCurrency(invoice.subtotal)}</p>
        <p><strong>تخفیف:</strong> ${ARAUtils.formatCurrency(invoice.discount)}</p>
        <p><strong>مالیات:</strong> ${ARAUtils.formatCurrency(invoice.tax)}</p>
        <p style="font-size: 1.3rem; color: #C8A97E;"><strong>مبلغ نهایی:</strong> ${ARAUtils.formatCurrency(invoice.total)}</p>
    `;
    
    modal.classList.add('active');
}

// چاپ فاکتور
function printInvoice() {
    if (!currentInvoice) {
        alert('ابتدا یک فاکتور صادر کنید.');
        return;
    }
    
    const printTemplate = document.getElementById('printTemplate');
    
    printTemplate.innerHTML = `
        <div style="text-align: center; padding: 20px; font-family: 'Vazirmatn'; width: 80mm;">
            <img src="logo.png" alt="Logo" style="width: 60px; height: 60px; margin-bottom: 10px;">
            <h2 style="margin: 5px 0;">ARA Cafe</h2>
            <p style="margin: 5px 0;">قهوه اصیل، طعم بی‌نظیر</p>
            <hr>
            <p><strong>فاکتور شماره:</strong> ${currentInvoice.invoiceNo}</p>
            <p><strong>تاریخ:</strong> ${ARAUtils.formatDate(currentInvoice.date)}</p>
            <hr>
            <table style="width: 100%; text-align: right;">
                <thead>
                    <tr>
                        <th>نام</th>
                        <th>تعداد</th>
                        <th>قیمت</th>
                        <th>جمع</th>
                    </tr>
                </thead>
                <tbody>
                    ${currentInvoice.items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.qty}</td>
                            <td>${item.price}</td>
                            <td>${item.qty * item.price}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <hr>
            <p><strong>جمع کل:</strong> ${ARAUtils.formatCurrency(currentInvoice.subtotal)}</p>
            <p><strong>تخفیف:</strong> ${ARAUtils.formatCurrency(currentInvoice.discount)}</p>
            <p><strong>مالیات:</strong> ${ARAUtils.formatCurrency(currentInvoice.tax)}</p>
            <h3>مبلغ نهایی: ${ARAUtils.formatCurrency(currentInvoice.total)}</h3>
            <hr>
            <p>با تشکر از خرید شما</p>
            <p>ARA Cafe - 021-12345678</p>
        </div>
    `;
    
    window.print();
}

// لود تاریخچه فاکتورها
function loadOrderHistory(dateFilter = null) {
    const container = document.getElementById('historyList');
    const orders = window.orderManager.getOrderHistory(dateFilter);
    
    if (orders.length === 0) {
        container.innerHTML = '<p style="opacity: 0.5;">موردی یافت نشد</p>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="history-item" onclick="showInvoiceDetails(${order.invoiceNo})">
            <strong>#${order.invoiceNo}</strong> - 
            ${ARAUtils.formatDate(order.date)} - 
            ${ARAUtils.formatCurrency(order.total)}
        </div>
    `).join('');
}

// نمایش جزئیات فاکتور از تاریخچه
function showInvoiceDetails(invoiceNo) {
    const invoice = window.orderManager.getOrderByInvoiceNo(invoiceNo);
    if (invoice) {
        currentInvoice = invoice;
        showInvoiceModal(invoice);
    }
}