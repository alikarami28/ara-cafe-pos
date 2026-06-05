// ====================================
// ARA Cafe - منوی عمومی
// ====================================

document.addEventListener('DOMContentLoaded', async function() {
    // لود تم
    ARAUtils.loadTheme();
    
    // دکمه تغییر تم
    document.getElementById('themeToggle').addEventListener('click', ARAUtils.toggleTheme);
    
    // لود دیتا
    await loadMenuData();
});

let allProducts = [];
let categories = [];
let currentCategory = 'all';

async function loadMenuData() {
    try {
        // تلاش برای لود از فایل JSON
        const response = await fetch('data/products.json');
        const data = await response.json();
        
        allProducts = data.products || [];
        categories = data.categories || [];
        
        // رندر کردن
        renderCategories();
        renderProducts(allProducts);
        
        // تنظیم Event Listeners
        setupSearchFilter();
    } catch (error) {
        console.error('Error loading menu:', error);
        
        // استفاده از دیتای نمونه
        allProducts = [
            { id: 1, name: 'لاته', price: 120000, category: 'hot', description: 'اسپرسو + شیر', active: true },
            { id: 2, name: 'کاپوچینو', price: 110000, category: 'hot', description: 'اسپرسو + شیر کف‌دار', active: true },
            { id: 3, name: 'آیس لاته', price: 130000, category: 'cold', description: 'اسپرسو + شیر سرد + یخ', active: true }
        ];
        categories = [
            { id: 'hot', name: 'نوشیدنی گرم', icon: '☕' },
            { id: 'cold', name: 'نوشیدنی سرد', icon: '🧊' }
        ];
        
        renderCategories();
        renderProducts(allProducts);
    }
}

function renderCategories() {
    const container = document.getElementById('categoriesContainer');
    
    // دکمه "همه"
    const allBtn = document.createElement('button');
    allBtn.className = 'category-btn active';
    allBtn.textContent = 'همه محصولات';
    allBtn.addEventListener('click', () => filterByCategory('all'));
    container.appendChild(allBtn);
    
    // دکمه‌های دسته‌بندی
    categories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.textContent = `${category.icon} ${category.name}`;
        btn.addEventListener('click', () => filterByCategory(category.id));
        container.appendChild(btn);
    });
}

function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    const noResults = document.getElementById('noResults');
    
    grid.innerHTML = '';
    
    if (products.length === 0) {
        grid.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    noResults.style.display = 'none';
    
    // فیلتر محصولات فعال
    const activeProducts = products.filter(p => p.active !== false);
    
    // مرتب‌سازی بر اساس sortOrder
    activeProducts.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    
    activeProducts.forEach(product => {
        const card = createProductCard(product);
        grid.appendChild(card);
    });
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // نام دسته‌بندی
    const category = categories.find(c => c.id === product.category);
    const categoryName = category ? category.name : product.category;
    
    card.innerHTML = `
        <img 
            src="${product.image || 'logo.png'}" 
            alt="${product.name}" 
            class="product-image"
            onerror="this.src='logo.png'"
        >
        <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <p class="product-description">${product.description || ''}</p>
            <div class="product-footer">
                <span class="product-price">${ARAUtils.formatCurrency(product.price)}</span>
                <span class="product-category-badge">${categoryName}</span>
            </div>
        </div>
    `;
    
    return card;
}

function filterByCategory(categoryId) {
    currentCategory = categoryId;
    
    // آپدیت دکمه‌های فعال
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const buttons = document.querySelectorAll('.category-btn');
    if (categoryId === 'all') {
        buttons[0].classList.add('active');
        renderProducts(allProducts);
    } else {
        // پیدا کردن دکمه مرتبط
        buttons.forEach(btn => {
            if (btn.textContent.includes(getCategoryName(categoryId))) {
                btn.classList.add('active');
            }
        });
        
        const filtered = allProducts.filter(p => p.category === categoryId);
        renderProducts(filtered);
    }
}

function getCategoryName(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '';
}

function setupSearchFilter() {
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', ARAUtils.debounce(function(e) {
        const query = e.target.value.trim().toLowerCase();
        
        if (query === '') {
            filterByCategory(currentCategory);
            return;
        }
        
        let filtered = allProducts;
        
        // اگر دسته‌بندی فعال است
        if (currentCategory !== 'all') {
            filtered = allProducts.filter(p => p.category === currentCategory);
        }
        
        // جستجو
        filtered = filtered.filter(product => 
            product.name.toLowerCase().includes(query) ||
            (product.description && product.description.toLowerCase().includes(query))
        );
        
        renderProducts(filtered);
    }, 300));
}