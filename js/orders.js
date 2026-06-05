// ====================================
// ARA Cafe - مدیریت سفارشات
// ====================================

class OrderManager {
    constructor() {
        this.orders = [];
        this.currentInvoiceNumber = 1000;
        this.loadOrders();
    }
    
    /**
     * لود سفارشات از LocalStorage یا فایل
     */
    async loadOrders() {
        // تلاش برای لود از LocalStorage
        const savedOrders = ARAUtils.loadFromLocalStorage('ara_orders');
        if (savedOrders && savedOrders.length > 0) {
            this.orders = savedOrders;
            this.currentInvoiceNumber = Math.max(...this.orders.map(o => o.invoiceNo), 1000);
        } else {
            // لود از فایل JSON
            try {
                const response = await fetch('data/orders.json');
                const data = await response.json();
                this.orders = data.orders || [];
                if (this.orders.length > 0) {
                    this.currentInvoiceNumber = Math.max(...this.orders.map(o => o.invoiceNo));
                }
            } catch (error) {
                console.log('No orders file found, starting fresh');
                this.orders = [];
            }
        }
    }
    
    /**
     * ایجاد سفارش جدید
     */
    createOrder(items, subtotal, discount = 0, tax = 0) {
        this.currentInvoiceNumber++;
        
        const order = {
            invoiceNo: this.currentInvoiceNumber,
            date: new Date().toISOString(),
            items: items.map(item => ({
                productId: item.id,
                name: item.name,
                qty: item.qty,
                price: item.price
            })),
            subtotal: subtotal,
            discount: discount,
            tax: tax,
            total: subtotal - discount + tax
        };
        
        this.orders.push(order);
        this.saveOrders();
        
        return order;
    }
    
    /**
     * ذخیره سفارشات
     */
    saveOrders() {
        // ذخیره در LocalStorage
        ARAUtils.saveToLocalStorage('ara_orders', this.orders);
        
        // ذخیره در فایل JSON (نیاز به GitHub API)
        this.saveToFile();
    }
    
    /**
     * ذخیره در فایل JSON
     */
    async saveToFile() {
        const data = {
            orders: this.orders,
            lastUpdated: new Date().toISOString()
        };
        
        // در محیط Production از GitHub API استفاده می‌کنیم
        if (ARAUtils.isOnline()) {
            try {
                // این بخش با GitHub API پیاده‌سازی می‌شود
                console.log('Orders saved to file');
            } catch (error) {
                console.error('Error saving orders to file:', error);
            }
        }
    }
    
    /**
     * دریافت تاریخچه سفارشات
     */
    getOrderHistory(dateFilter = null) {
        if (!dateFilter) {
            return this.orders.sort((a, b) => new Date(b.date) - new Date(a.date));
        }
        
        const filterDate = new Date(dateFilter).toDateString();
        return this.orders.filter(order => {
            const orderDate = new Date(order.date).toDateString();
            return orderDate === filterDate;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    /**
     * دریافت یک سفارش با شماره فاکتور
     */
    getOrderByInvoiceNo(invoiceNo) {
        return this.orders.find(order => order.invoiceNo === invoiceNo);
    }
    
    /**
     * حذف سفارش
     */
    deleteOrder(invoiceNo) {
        this.orders = this.orders.filter(order => order.invoiceNo !== invoiceNo);
        this.saveOrders();
    }
    
    /**
     * دریافت شماره فاکتور بعدی
     */
    getNextInvoiceNumber() {
        return this.currentInvoiceNumber + 1;
    }
}

// ایجاد نمونه سراسری
window.orderManager = new OrderManager();