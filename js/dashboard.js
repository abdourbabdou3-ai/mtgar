/**
 * Aya Kids Dashboard - لوحة التحكم الأسطورية
 * JavaScript متقدم مع ميزات إدارة المتجر
 * ===========================================
 */

class DashboardManager {
    constructor() {
        this.currentSection = 'dashboard';
        this.products = [];
        this.categories = [];
        this.orders = [];
        this.customers = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.charts = {};
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboardData();
        this.initializeCharts();
        this.setupNotifications();
        this.loadProducts();
        this.loadCategories();
        this.loadOrders();
        this.loadCustomers();
    }

    /**
     * إعداد مستمعي الأحداث
     */
    setupEventListeners() {
        // زر الإشعارات
        const notificationBtn = document.getElementById('notificationBtn');
        const notificationDropdown = document.getElementById('notificationDropdown');
        
        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationDropdown.classList.toggle('active');
        });

        // إغلاق الإشعارات عند النقر خارجها
        document.addEventListener('click', (e) => {
            if (!notificationBtn.contains(e.target) && !notificationDropdown.contains(e.target)) {
                notificationDropdown.classList.remove('active');
            }
        });

        // زر طي/توسيع الشريط الجانبي
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            this.adjustMainContent();
        });

        // البحث في لوحة التحكم
        const dashboardSearch = document.getElementById('dashboardSearch');
        dashboardSearch.addEventListener('input', (e) => {
            this.performDashboardSearch(e.target.value);
        });

        // نموذج إضافة المنتج
        const productForm = document.getElementById('productForm');
        productForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });

        // نموذج إضافة الفئة
        const categoryForm = document.getElementById('categoryForm');
        categoryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCategory();
        });

        // تصفية المنتجات
        const productsSearch = document.getElementById('productsSearch');
        const categoryFilter = document.getElementById('categoryFilter');
        const statusFilter = document.getElementById('statusFilter');

        productsSearch.addEventListener('input', () => {
            this.filterProducts();
        });

        categoryFilter.addEventListener('change', () => {
            this.filterProducts();
        });

        statusFilter.addEventListener('change', () => {
            this.filterProducts();
        });

        // تصفية الطلبات
        const orderStatusFilter = document.getElementById('orderStatusFilter');
        orderStatusFilter.addEventListener('change', () => {
            this.filterOrders();
        });

        // تصفية التواريخ
        const dateFilter = document.getElementById('dateFilter');
        dateFilter.addEventListener('change', () => {
            this.updateDashboardStats();
        });
    }

    /**
     * تحميل بيانات لوحة القيادة
     */
    async loadDashboardData() {
        try {
            // محاكاة لبيانات لوحة القيادة
            const dashboardData = {
                totalOrders: 1247,
                totalRevenue: 45892,
                totalCustomers: 892,
                totalProducts: 268,
                ordersChange: 12.5,
                revenueChange: 8.3,
                customersChange: 15.7,
                productsChange: -2.1
            };

            this.updateDashboardStats(dashboardData);
            this.loadRecentOrders();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('حدث خطأ في تحميل بيانات لوحة القيادة', 'error');
        }
    }

    /**
     * تحديث إحصائيات لوحة القيادة
     */
    updateDashboardStats(data) {
        // تحديث الأرقام مع أنيميشن
        const stats = [
            { element: '.stat-number', value: data.totalOrders, suffix: '' },
            { element: '.stat-number', value: data.totalRevenue, suffix: ' ر.س' },
            { element: '.stat-number', value: data.totalCustomers, suffix: '' },
            { element: '.stat-number', value: data.totalProducts, suffix: '' }
        ];

        stats.forEach((stat, index) => {
            const element = document.querySelectorAll('.stat-number')[index];
            if (element) {
                this.animateNumber(element, stat.value, stat.suffix);
            }
        });
    }

    /**
     * أنيميشن الأرقام
     */
    animateNumber(element, target, suffix = '') {
        const duration = 2000;
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current).toLocaleString() + suffix;
        }, 16);
    }

    /**
     * تحميل الطلبات الحديثة
     */
    loadRecentOrders() {
        const mockOrders = [
            {
                id: 'OR-2024-001',
                customer: 'أحمد محمد',
                products: '2 منتجات',
                total: '299.99',
                status: 'processing',
                date: '2024-01-15'
            },
            {
                id: 'OR-2024-002',
                customer: 'فاطمة علي',
                products: '1 منتج',
                total: '149.99',
                status: 'completed',
                date: '2024-01-14'
            },
            {
                id: 'OR-2024-003',
                customer: 'محمد عبدالله',
                products: '3 منتجات',
                total: '429.99',
                status: 'pending',
                date: '2024-01-13'
            },
            {
                id: 'OR-2024-004',
                customer: 'سارة أحمد',
                products: '1 منتج',
                total: '89.99',
                status: 'cancelled',
                date: '2024-01-12'
            }
        ];

        const recentOrders = document.getElementById('recentOrders');
        recentOrders.innerHTML = mockOrders.map(order => `
            <tr>
                <td><strong>${order.id}</strong></td>
                <td>${order.customer}</td>
                <td>${order.products}</td>
                <td><strong>${order.total} ر.س</strong></td>
                <td><span class="order-status ${order.status}">${this.getStatusText(order.status)}</span></td>
                <td>${order.date}</td>
            </tr>
        `).join('');
    }

    /**
     * الحصول على نص الحالة
     */
    getStatusText(status) {
        const statusTexts = {
            pending: 'قيد الانتظار',
            processing: 'قيد المعالجة',
            completed: 'مكتمل',
            cancelled: 'ملغي'
        };
        return statusTexts[status] || status;
    }

    /**
     * تهيئة الرسوم البيانية
     */
    initializeCharts() {
        // رسم المبيعات الشهرية
        const salesCtx = document.getElementById('salesChart');
        if (salesCtx) {
            this.charts.sales = new Chart(salesCtx, {
                type: 'line',
                data: {
                    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
                    datasets: [{
                        label: 'المبيعات',
                        data: [12000, 19000, 15000, 25000, 22000, 30000],
                        borderColor: '#ff6b9d',
                        backgroundColor: 'rgba(255, 107, 157, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0,0,0,0.1)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }

        // رسم المنتجات الأكثر مبيعاً
        const productsCtx = document.getElementById('productsChart');
        if (productsCtx) {
            this.charts.products = new Chart(productsCtx, {
                type: 'doughnut',
                data: {
                    labels: ['ألعبة', 'تعليمية', 'إلكترونية', 'قصص', 'إبداعية'],
                    datasets: [{
                        data: [45, 25, 15, 10, 5],
                        backgroundColor: [
                            '#ff6b9d',
                            '#4facfe',
                            '#ff9800',
                            '#9c27b0',
                            '#43e97b'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        }
                    }
                }
            });
        }
    }

    /**
     * إعداد الإشعارات
     */
    setupNotifications() {
        const mockNotifications = [
            {
                id: 1,
                type: 'success',
                title: 'طلب جديد',
                message: 'تم استلام طلب جديد برقم OR-2024-005',
                time: 'منذ 5 دقائق',
                unread: true
            },
            {
                id: 2,
                type: 'warning',
                title: 'منتج قليل الكمية',
                message: 'المنتج 'لعبة التطوير الذكية' أصبحت كميته أقل من 5',
                time: 'منذ 15 دقيقة',
                unread: true
            },
            {
                id: 3,
                type: 'info',
                title: 'تحديث النظام',
                message: 'تم تحديث النظام بنجاح إلى الإصدار 2.1',
                time: 'منذ ساعة',
                unread: false
            }
        ];

        const notificationList = document.getElementById('notificationList');
        notificationList.innerHTML = mockNotifications.map(notification => `
            <div class="notification-item ${notification.unread ? 'unread' : ''}" onclick="markAsRead(${notification.id})">
                <div class="notification-icon ${notification.type}">
                    <i class="fas fa-${notification.type === 'success' ? 'check' : notification.type === 'warning' ? 'exclamation' : 'info'}"></i>
                </div>
                <div class="notification-content">
                    <h5>${notification.title}</h5>
                    <p>${notification.message}</p>
                    <div class="notification-time">${notification.time}</div>
                </div>
            </div>
        `).join('');
    }

    /**
     * تحميل المنتجات من قاعدة البيانات
     */
    async loadProducts() {
        try {
            // جلب المنتجات من قاعدة البيانات
            const response = await fetch('tables/products');
            const result = await response.json();
            
            if (result.data) {
                this.products = result.data;
                this.displayProducts(this.products);
            } else {
                // استخدام بيانات محلية كاحتياطي
                this.loadMockProducts();
            }
        } catch (error) {
            console.error('Error loading products:', error);
            // استخدام بيانات محلية كاحتياطي
            this.loadMockProducts();
        }
    }

    /**
     * تحميل منتجات محلية (احتياطي)
     */
    loadMockProducts() {
        const mockProducts = [
            {
                id: '1',
                title: 'لعبة تطوير المهارات الذكية',
                price: 149.99,
                original_price: 199.99,
                image_url: 'https://images.unsplash.com/photo-1553279768-865429faedf8?w=400&h=300&fit=crop',
                category: 'تعليمية',
                rating: 4.8,
                reviews_count: 127,
                badge: 'جديد',
                description: 'لعبة تفاعلية لتطوير المهارات الذهنية للأطفال',
                is_active: true,
                stock_quantity: 25
            },
            {
                id: '2',
                title: 'دبدوب ناعم محشو',
                price: 89.99,
                original_price: 129.99,
                image_url: 'https://images.unsplash.com/photo-1553856625-6e326d0d5a0b?w=400&h=300&fit=crop',
                category: 'ألعبة',
                rating: 4.9,
                reviews_count: 89,
                badge: 'الأكثر مبيعاً',
                description: 'دبدوب ناعم ومحبب للأطفال',
                is_active: true,
                stock_quantity: 40
            }
        ];

        this.products = mockProducts;
        this.displayProducts(this.products);
    }

    /**
     * عرض المنتجات
     */
    displayProducts(products) {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;

        productsGrid.innerHTML = products.map(product => `
            <div class="product-card fade-in">
                <img src="${product.image_url}" alt="${product.title}" class="product-image">
                <div class="product-info">
                    <h3 class="product-title">${product.title}</h3>
                    <p class="product-category"><i class="fas fa-tag"></i> ${product.category}</p>
                    <p class="product-price">${product.price} ر.س</p>
                    <p class="product-quantity">الكمية: ${product.stock_quantity}</p>
                    <span class="product-status ${product.is_active ? 'active' : 'inactive'}">
                        ${product.is_active ? 'مفعل' : 'غير مفعل'}
                    </span>
                    <div class="product-actions">
                        <button class="btn btn-outline" onclick="editProduct('${product.id}')">
                            <i class="fas fa-edit"></i> تعديل
                        </button>
                        <button class="btn btn-danger" onclick="deleteProduct('${product.id}')">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * تصفية المنتجات
     */
    filterProducts() {
        const searchTerm = document.getElementById('productsSearch').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;

        let filtered = this.products.filter(product => {
            const matchesSearch = product.title.toLowerCase().includes(searchTerm) ||
                                product.category.toLowerCase().includes(searchTerm);
            
            const matchesCategory = !categoryFilter || product.category === categoryFilter;
            
            const matchesStatus = !statusFilter || 
                                (statusFilter === 'active' && product.is_active) ||
                                (statusFilter === 'inactive' && !product.is_active);

            return matchesSearch && matchesCategory && matchesStatus;
        });

        this.displayProducts(filtered);
    }

    /**
     * تحميل الفئات من قاعدة البيانات
     */
    async loadCategories() {
        try {
            const response = await fetch('tables/categories');
            const result = await response.json();
            
            if (result.data) {
                this.categories = result.data;
                this.displayCategories(this.categories);
            } else {
                // استخدام بيانات محلية كاحتياطي
                this.loadMockCategories();
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            // استخدام بيانات محلية كاحتياطي
            this.loadMockCategories();
        }
    }

    /**
     * تحميل فئات محلية (احتياطي)
     */
    loadMockCategories() {
        const mockCategories = [
            {
                id: '1',
                name: 'تعليمية',
                icon: 'fas fa-graduation-cap',
                products_count: 45,
                color: '#ff6b9d',
                is_active: true,
                sort_order: 1
            },
            {
                id: '2',
                name: 'ألعبة',
                icon: 'fas fa-puzzle-piece',
                products_count: 78,
                color: '#4facfe',
                is_active: true,
                sort_order: 2
            }
        ];

        this.categories = mockCategories;
        this.displayCategories(this.categories);
    }

    /**
     * عرض الفئات
     */
    displayCategories(categories) {
        const categoriesGrid = document.getElementById('categoriesGrid');
        if (!categoriesGrid) return;

        categoriesGrid.innerHTML = categories.map(category => `
            <div class="category-card fade-in" style="border-color: ${category.color}">
                <div class="category-icon" style="background: ${category.color}">
                    <i class="${category.icon}"></i>
                </div>
                <h3>${category.name}</h3>
                <p>${category.products_count} منتج</p>
                <div class="category-actions">
                    <button class="btn btn-outline" onclick="editCategory('${category.id}')">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                    <button class="btn btn-danger" onclick="deleteCategory('${category.id}')">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * تحميل الطلبات
     */
    loadOrders() {
        const mockOrders = [
            {
                id: 'OR-2024-001',
                customer: { name: 'أحمد محمد', email: 'ahmed@example.com' },
                products: 2,
                total: 299.99,
                status: 'processing',
                created_at: '2024-01-15T10:30:00Z'
            },
            {
                id: 'OR-2024-002',
                customer: { name: 'فاطمة علي', email: 'fatima@example.com' },
                products: 1,
                total: 149.99,
                status: 'completed',
                created_at: '2024-01-14T14:20:00Z'
            }
        ];

        this.orders = mockOrders;
        this.displayOrders(this.orders);
    }

    /**
     * عرض الطلبات
     */
    displayOrders(orders) {
        const ordersTable = document.getElementById('ordersTable');
        if (!ordersTable) return;

        ordersTable.innerHTML = `
            <div class="orders-table">
                <table>
                    <thead>
                        <tr>
                            <th>رقم الطلب</th>
                            <th>العميل</th>
                            <th>عدد المنتجات</th>
                            <th>المجموع</th>
                            <th>الحالة</th>
                            <th>التاريخ</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.map(order => `
                            <tr>
                                <td><strong>${order.id}</strong></td>
                                <td>
                                    <div><strong>${order.customer.name}</strong></div>
                                    <div style="font-size: 0.9rem; color: #666;">${order.customer.email}</div>
                                </td>
                                <td>${order.products} منتج</td>
                                <td><strong>${order.total.toFixed(2)} ر.س</strong></td>
                                <td><span class="order-status ${order.status}">${this.getStatusText(order.status)}</span></td>
                                <td>${new Date(order.created_at).toLocaleDateString('ar-SA')}</td>
                                <td>
                                    <div class="product-actions">
                                        <button class="btn btn-outline" onclick="viewOrder('${order.id}')">
                                            <i class="fas fa-eye"></i> عرض
                                        </button>
                                        <button class="btn btn-primary" onclick="updateOrderStatus('${order.id}')">
                                            <i class="fas fa-edit"></i> تعديل
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * تصفية الطلبات
     */
    filterOrders() {
        const statusFilter = document.getElementById('orderStatusFilter').value;
        
        let filtered = this.orders;
        if (statusFilter) {
            filtered = filtered.filter(order => order.status === statusFilter);
        }

        this.displayOrders(filtered);
    }

    /**
     * تحميل العملاء
     */
    loadCustomers() {
        const mockCustomers = [
            {
                id: 1,
                name: 'أحمد محمد',
                email: 'ahmed@example.com',
                phone: '0551234567',
                orders: 5,
                total_spent: 1249.95,
                joined_at: '2023-06-15T10:30:00Z',
                status: 'active'
            },
            {
                id: 2,
                name: 'فاطمة علي',
                email: 'fatima@example.com',
                phone: '0559876543',
                orders: 3,
                total_spent: 749.97,
                joined_at: '2023-08-20T14:20:00Z',
                status: 'active'
            }
        ];

        this.customers = mockCustomers;
        this.displayCustomers(this.customers);
    }

    /**
     * عرض العملاء
     */
    displayCustomers(customers) {
        const customersTable = document.getElementById('customersTable');
        if (!customersTable) return;

        customersTable.innerHTML = `
            <div class="orders-table">
                <table>
                    <thead>
                        <tr>
                            <th>الاسم</th>
                            <th>البريد الإلكتروني</th>
                            <th>رقم الهاتف</th>
                            <th>عدد الطلبات</th>
                            <th>إجمالي الإنفاق</th>
                            <th>تاريخ الانضمام</th>
                            <th>الحالة</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${customers.map(customer => `
                            <tr>
                                <td><strong>${customer.name}</strong></td>
                                <td>${customer.email}</td>
                                <td>${customer.phone}</td>
                                <td>${customer.orders} طلب</td>
                                <td><strong>${customer.total_spent.toFixed(2)} ر.س</strong></td>
                                <td>${new Date(customer.joined_at).toLocaleDateString('ar-SA')}</td>
                                <td><span class="product-status ${customer.status === 'active' ? 'active' : 'inactive'}">${customer.status === 'active' ? 'مفعل' : 'غير مفعل'}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * حفظ المنتج
     */
    async saveProduct() {
        const form = document.getElementById('productForm');
        const formData = new FormData(form);
        const product = {};
        
        for (let [key, value] of formData.entries()) {
            product[key] = value;
        }

        try {
            const response = await fetch('tables/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(product)
            });

            if (response.ok) {
                this.showNotification('تم حفظ المنتج بنجاح', 'success');
                this.closeModal('productModal');
                this.loadProducts();
            } else {
                throw new Error('Failed to save product');
            }
        } catch (error) {
            console.error('Error saving product:', error);
            this.showNotification('حدث خطأ في حفظ المنتج', 'error');
        }
    }

    /**
     * حفظ الفئة
     */
    async saveCategory() {
        const form = document.getElementById('categoryForm');
        const formData = new FormData(form);
        const category = {};
        
        for (let [key, value] of formData.entries()) {
            category[key] = value;
        }

        try {
            const response = await fetch('tables/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(category)
            });

            if (response.ok) {
                this.showNotification('تم حفظ الفئة بنجاح', 'success');
                this.closeModal('categoryModal');
                this.loadCategories();
            } else {
                throw new Error('Failed to save category');
            }
        } catch (error) {
            console.error('Error saving category:', error);
            this.showNotification('حدث خطأ في حفظ الفئة', 'error');
        }
    }

    /**
     * إظهار الإشعارات
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // إضافة أنماط CSS للإشعار
        const style = document.createElement('style');
        style.textContent = `
            .notification {
                position: fixed;
                top: 100px;
                right: 20px;
                background: rgba(255,255,255,0.95);
                backdrop-filter: blur(10px);
                border-radius: 15px;
                padding: 1rem 1.5rem;
                box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                z-index: 3000;
                transform: translateX(400px);
                transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                max-width: 300px;
            }
            
            .notification.show {
                transform: translateX(0);
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.8rem;
                font-weight: 500;
            }
            
            .notification-success .notification-content {
                color: #28a745;
            }
            
            .notification-error .notification-content {
                color: #dc3545;
            }
            
            .notification-info .notification-content {
                color: #17a2b8;
            }
            
            .notification i {
                font-size: 1.2rem;
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // إظهار الإشعار
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // إخفاء الإشعار بعد 3 ثواني
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
                style.remove();
            }, 300);
        }, 3000);
    }

    /**
     * تعديل محتوى الصفحة الرئيسية
     */
    adjustMainContent() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (sidebar.classList.contains('collapsed')) {
            mainContent.style.marginRight = '80px';
        } else {
            mainContent.style.marginRight = '280px';
        }
    }

    /**
     * البحث في لوحة التحكم
     */
    performDashboardSearch(query) {
        if (!query) return;

        // هنا يمكنك تنفيذ منطق البحث الفعلي
        this.showNotification(`جاري البحث عن: ${query}`, 'info');
    }

    /**
     * تصدير المنتجات
     */
    exportProducts() {
        // إنشاء ملف CSV
        const csvContent = this.products.map(product => 
            `${product.title},${product.category},${product.price},${product.stock_quantity}`
        ).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'products.csv';
        a.click();
        window.URL.revokeObjectURL(url);

        this.showNotification('تم تصدير المنتجات بنجاح', 'success');
    }

    /**
     * إغلاق النافذة المنبثقة
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');
    }
}

// دوال مساعدة عالمية
window.showSection = function(sectionName) {
    // إخفاء جميع الأقسام
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // إظهار القسم المطلوب
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // تحديث عنوان الصفحة
        const sectionTitle = document.getElementById('sectionTitle');
        const currentBreadcrumb = document.getElementById('currentBreadcrumb');
        
        const sectionTitles = {
            dashboard: 'لوحة القيادة',
            products: 'إدارة المنتجات',
            categories: 'الفئات',
            orders: 'الطلبات',
            customers: 'العملاء',
            analytics: 'التحليلات',
            settings: 'الإعدادات'
        };

        const title = sectionTitles[sectionName] || sectionName;
        sectionTitle.textContent = title;
        currentBreadcrumb.textContent = title;
    }

    // تحديث القائمة النشطة
    document.querySelectorAll('.menu-link').forEach(link => {
        link.classList.remove('active');
    });

    const activeLink = document.querySelector(`[onclick="showSection(\u0027${sectionName}\u0027)"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
};

window.showAddProductModal = function() {
    const modal = document.getElementById('productModal');
    const modalTitle = document.getElementById('modalTitle');
    
    modalTitle.textContent = 'إضافة منتج جديد';
    modal.classList.add('active');
    
    // إعادة تعيين النموذج
    document.getElementById('productForm').reset();
};

window.showAddCategoryModal = function() {
    const modal = document.getElementById('categoryModal');
    modal.classList.add('active');
    
    // إعادة تعيين النموذج
    document.getElementById('categoryForm').reset();
};

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
};

window.editProduct = function(productId) {
    // هنا يمكنك تنفيذ منطق التعديل
    alert(`تعديل المنتج رقم: ${productId}`);
};

window.deleteProduct = function(productId) {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        alert(`تم حذف المنتج رقم: ${productId}`);
    }
};

window.editCategory = function(categoryId) {
    alert(`تعديل الفئة رقم: ${categoryId}`);
};

window.deleteCategory = function(categoryId) {
    if (confirm('هل أنت متأكد من حذف هذه الفئة؟')) {
        alert(`تم حذف الفئة رقم: ${categoryId}`);
    }
};

window.viewOrder = function(orderId) {
    alert(`عرض تفاصيل الطلب رقم: ${orderId}`);
};

window.updateOrderStatus = function(orderId) {
    alert(`تحديث حالة الطلب رقم: ${orderId}`);
};

window.markAsRead = function(notificationId) {
    console.log(`تم تحديد الإشعار رقم ${notificationId} كمقروء`);
};

// تهيئة لوحة التحكم عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new DashboardManager();
});

// منع إرسال النماذج بالطريقة التقليدية
document.addEventListener('submit', (e) => {
    if (e.target.classList.contains('modal-form')) {
        e.preventDefault();
    }
});