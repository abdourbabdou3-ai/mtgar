/**
 * Aya Kids Dashboard - لوحة التحكم المتقدمة
 * JavaScript متقدم مع ميزات إدارة المتجر التلقائية
 * ===========================================
 */

class DashboardManager {
    constructor() {
        this.currentSection = 'dashboard';
        this.products = [];
        this.categories = [];
        this.orders = [];
        this.customers = [];
        this.visitors = [];
        this.settings = [];
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
        this.loadVisitors();
        this.loadSettings();
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
     * تحميل بيانات لوحة القيادة مع الإحصائيات التلقائية
     */
    async loadDashboardData() {
        try {
            // جلب البيانات من قاعدة البيانات
            const [ordersData, productsData, customersData, visitorsData] = await Promise.all([
                this.fetchTableData('orders'),
                this.fetchTableData('products'),
                this.fetchTableData('customers'),
                this.fetchTableData('visitors')
            ]);

            // حساب الإحصائيات التلقائية
            const totalOrders = ordersData.length;
            const totalProducts = productsData.length;
            const totalCustomers = customersData.length;
            
            // حساب إجمالي الإيرادات
            const totalRevenue = ordersData
                .filter(order => order.status === 'delivered' || order.status === 'completed')
                .reduce((sum, order) => sum + parseFloat(order.total || 0), 0);

            // حساب التغييرات مقارنة بالفترة السابقة
            const ordersChange = await this.calculateGrowthRate('orders');
            const revenueChange = await this.calculateRevenueGrowth();
            const customersChange = await this.calculateGrowthRate('customers');
            const productsChange = await this.calculateGrowthRate('products');

            const dashboardData = {
                totalOrders,
                totalRevenue,
                totalCustomers,
                totalProducts,
                ordersChange,
                revenueChange,
                customersChange,
                productsChange
            };

            this.updateDashboardStats(dashboardData);
            this.loadRecentOrders();
            this.updateVisitorCount();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('حدث خطأ في تحميل بيانات لوحة القيادة', 'error');
        }
    }

    /**
     * جلب بيانات الجدول من قاعدة البيانات
     */
    async fetchTableData(tableName, page = 1, limit = 1000) {
        try {
            const response = await fetch(`tables/${tableName}?page=${page}&limit=${limit}`);
            const result = await response.json();
            return result.data || [];
        } catch (error) {
            console.error(`Error fetching ${tableName}:`, error);
            return [];
        }
    }

    /**
     * حساب معدل النمو
     */
    async calculateGrowthRate(tableName) {
        try {
            const currentData = await this.fetchTableData(tableName, 1, 1000);
            const currentCount = currentData.length;
            
            // نحسب معدل النمو بناءً على آخر 30 يومًا
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const recentCount = currentData.filter(item => {
                const createdAt = new Date(item.created_at || item.createdAt);
                return createdAt >= thirtyDaysAgo;
            }).length;
            
            // نحسب معدل النمو بالنسبة المئوية
            const growthRate = currentCount > 0 ? ((recentCount / (currentCount - recentCount)) * 100) - 100 : 0;
            return growthRate;
        } catch (error) {
            return 0;
        }
    }

    /**
     * حساب نمو الإيرادات
     */
    async calculateRevenueGrowth() {
        try {
            const orders = await this.fetchTableData('orders');
            const currentMonth = new Date().getMonth();
            const previousMonth = currentMonth - 1;
            
            const currentMonthRevenue = orders
                .filter(order => {
                    const orderDate = new Date(order.created_at || order.createdAt);
                    return orderDate.getMonth() === currentMonth && 
                           (order.status === 'delivered' || order.status === 'completed');
                })
                .reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
            
            const previousMonthRevenue = orders
                .filter(order => {
                    const orderDate = new Date(order.created_at || order.createdAt);
                    return orderDate.getMonth() === previousMonth && 
                           (order.status === 'delivered' || order.status === 'completed');
                })
                .reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
            
            if (previousMonthRevenue === 0) return currentMonthRevenue > 0 ? 100 : 0;
            return ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
        } catch (error) {
            return 0;
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

        // تحديث مؤشرات التغيير
        this.updateChangeIndicator(0, data.ordersChange);
        this.updateChangeIndicator(1, data.revenueChange);
        this.updateChangeIndicator(2, data.customersChange);
        this.updateChangeIndicator(3, data.productsChange);
    }

    /**
     * تحديث مؤشر التغيير
     */
    updateChangeIndicator(index, change) {
        const changeElements = document.querySelectorAll('.stat-change');
        if (changeElements[index]) {
            const isPositive = change >= 0;
            changeElements[index].innerHTML = `
                <i class="fas fa-arrow-${isPositive ? 'up' : 'down'}"></i>
                ${Math.abs(change).toFixed(1)}%
            `;
            changeElements[index].className = `stat-change ${isPositive ? 'positive' : 'negative'}`;
        }
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
     * تحميل الطلبات الحديثة من قاعدة البيانات
     */
    async loadRecentOrders() {
        try {
            const orders = await this.fetchTableData('orders');
            const customers = await this.fetchTableData('customers');
            
            // دمج بيانات العملاء مع الطلبات
            const recentOrders = orders
                .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt))
                .slice(0, 4)
                .map(order => {
                    const customer = customers.find(c => c.id === order.customer_id);
                    return {
                        id: order.id,
                        customer: customer ? customer.name : 'عميل غير معروف',
                        products: order.items ? order.items.length : 0,
                        total: parseFloat(order.total || 0).toFixed(2),
                        status: order.status,
                        date: new Date(order.created_at || order.createdAt).toLocaleDateString('ar-SA')
                    };
                });

            const recentOrdersContainer = document.getElementById('recentOrders');
            recentOrdersContainer.innerHTML = recentOrders.map(order => `
                <tr>
                    <td><strong>${order.id}</strong></td>
                    <td>${order.customer}</td>
                    <td>${order.products} منتج</td>
                    <td><strong>${order.total} ر.س</strong></td>
                    <td><span class="order-status ${order.status}">${this.getStatusText(order.status)}</span></td>
                    <td>${order.date}</td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error loading recent orders:', error);
        }
    }

    /**
     * الحصول على نص الحالة
     */
    getStatusText(status) {
        const statusTexts = {
            pending: 'قيد الانتظار',
            confirmed: 'مؤكد',
            processing: 'قيد المعالجة',
            shipped: 'تم الشحن',
            delivered: 'تم التوصيل',
            completed: 'مكتمل',
            cancelled: 'ملغي',
            refunded: 'مسترد'
        };
        return statusTexts[status] || status;
    }

    /**
     * تحديث عدد الزوار
     */
    async updateVisitorCount() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const visitors = await this.fetchTableData('visitors');
            
            const todayVisitors = visitors.filter(visitor => {
                const visitDate = new Date(visitor.visit_date).toISOString().split('T')[0];
                return visitDate === today;
            }).length;

            const visitorElement = document.getElementById('todayVisitors');
            if (visitorElement) {
                visitorElement.textContent = `${todayVisitors} زائر اليوم`;
            }
        } catch (error) {
            console.error('Error updating visitor count:', error);
        }
    }

    /**
     * تهيئة الرسوم البيانية مع بيانات حقيقية
     */
    async initializeCharts() {
        try {
            const orders = await this.fetchTableData('orders');
            const monthlyData = this.processMonthlyData(orders);

            // رسم المبيعات الشهرية
            const salesCtx = document.getElementById('salesChart');
            if (salesCtx) {
                this.charts.sales = new Chart(salesCtx, {
                    type: 'line',
                    data: {
                        labels: monthlyData.labels,
                        datasets: [{
                            label: 'المبيعات',
                            data: monthlyData.sales,
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
                const productsData = await this.getMostSoldProducts();
                this.charts.products = new Chart(productsCtx, {
                    type: 'doughnut',
                    data: {
                        labels: productsData.labels,
                        datasets: [{
                            data: productsData.values,
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
        } catch (error) {
            console.error('Error initializing charts:', error);
        }
    }

    /**
     * معالجة البيانات الشهرية
     */
    processMonthlyData(orders) {
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const currentMonth = new Date().getMonth();
        const monthlySales = new Array(6).fill(0);
        
        orders.forEach(order => {
            const orderDate = new Date(order.created_at || order.createdAt);
            const orderMonth = orderDate.getMonth();
            const monthIndex = (orderMonth - currentMonth + 6) % 6;
            
            if (order.status === 'delivered' || order.status === 'completed') {
                monthlySales[monthIndex] += parseFloat(order.total || 0);
            }
        });

        return {
            labels: months.slice(currentMonth - 5, currentMonth + 1),
            sales: monthlySales
        };
    }

    /**
     * الحصول على المنتجات الأكثر مبيعاً
     */
    async getMostSoldProducts() {
        try {
            const orders = await this.fetchTableData('orders');
            const productSales = {};

            orders.forEach(order => {
                if (order.items && Array.isArray(order.items)) {
                    order.items.forEach(item => {
                        if (item.product_id) {
                            productSales[item.product_id] = (productSales[item.product_id] || 0) + (item.quantity || 1);
                        }
                    });
                }
            });

            // أعلى 5 منتجات
            const topProducts = Object.entries(productSales)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5);

            if (topProducts.length === 0) {
                return {
                    labels: ['ألعاب', 'تعليمية', 'إلكترونية', 'قصص', 'إبداعية'],
                    values: [45, 25, 15, 10, 5]
                };
            }

            return {
                labels: topProducts.map(([id]) => `منتج ${id}`),
                values: topProducts.map(([,count]) => count)
            };
        } catch (error) {
            return {
                labels: ['ألعاب', 'تعليمية', 'إلكترونية', 'قصص', 'إبداعية'],
                values: [45, 25, 15, 10, 5]
            };
        }
    }

    /**
     * تحميل المنتجات من قاعدة البيانات
     */
    async loadProducts() {
        try {
            const response = await fetch('tables/products');
            const result = await response.json();
            
            if (result.data) {
                this.products = result.data;
                this.displayProducts(this.products);
            } else {
                this.showNotification('لا توجد منتجات في قاعدة البيانات', 'info');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.showNotification('حدث خطأ في تحميل المنتجات', 'error');
        }
    }

    /**
     * عرض المنتجات
     */
    displayProducts(products) {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;

        productsGrid.innerHTML = products.map(product => {
            const price = parseFloat(product.price || 0);
            const discountPrice = product.discount_percentage > 0 ? 
                price * (1 - product.discount_percentage / 100) : price;
            
            return `
                <div class="product-card fade-in">
                    <img src="${product.images && product.images[0] ? product.images[0] : 'https://via.placeholder.com/400x300'}" alt="${product.name}" class="product-image">
                    <div class="product-info">
                        <h3 class="product-title">${product.name}</h3>
                        <p class="product-category"><i class="fas fa-tag"></i> ${product.category_id || 'بدون فئة'}</p>
                        <p class="product-price">
                            ${discountPrice.toFixed(2)} ر.س
                            ${product.discount_percentage > 0 ? `<del>${price.toFixed(2)} ر.س</del>` : ''}
                        </p>
                        <p class="product-quantity">الكمية: ${product.stock_quantity || 0}</p>
                        <span class="product-status ${product.status === 'active' ? 'active' : 'inactive'}">
                            ${product.status === 'active' ? 'مفعل' : 'غير مفعل'}
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
            `;
        }).join('');
    }

    /**
     * تصفية المنتجات
     */
    filterProducts() {
        const searchTerm = document.getElementById('productsSearch').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;

        let filtered = this.products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                              product.description.toLowerCase().includes(searchTerm);
            
            const matchesCategory = !categoryFilter || product.category_id === categoryFilter;
            
            const matchesStatus = !statusFilter || product.status === statusFilter;

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
                this.updateCategoryFilter();
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    /**
     * تحديث فلتر الفئات
     */
    updateCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">كل الفئات</option>' +
                this.categories.map(cat => 
                    `<option value="${cat.id}">${cat.name}</option>`
                ).join('');
        }
    }

    /**
     * عرض الفئات
     */
    displayCategories(categories) {
        const categoriesGrid = document.getElementById('categoriesGrid');
        if (!categoriesGrid) return;

        categoriesGrid.innerHTML = categories.map(category => {
            const productCount = this.products.filter(p => p.category_id === category.id).length;
            return `
                <div class="category-card fade-in" style="border-color: ${category.color || '#ff6b9d'}">
                    <div class="category-icon" style="background: ${category.color || '#ff6b9d'}">
                        <i class="${category.icon || 'fas fa-tag'}"></i>
                    </div>
                    <h3>${category.name}</h3>
                    <p>${productCount} منتج</p>
                    <div class="category-actions">
                        <button class="btn btn-outline" onclick="editCategory('${category.id}')">
                            <i class="fas fa-edit"></i> تعديل
                        </button>
                        <button class="btn btn-danger" onclick="deleteCategory('${category.id}')">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * تحميل الطلبات من قاعدة البيانات
     */
    async loadOrders() {
        try {
            const orders = await this.fetchTableData('orders');
            const customers = await this.fetchTableData('customers');
            
            // دمج بيانات العملاء مع الطلبات
            this.orders = orders.map(order => {
                const customer = customers.find(c => c.id === order.customer_id);
                return {
                    ...order,
                    customer: customer || { name: 'عميل غير معروف', email: '' }
                };
            });
            
            this.displayOrders(this.orders);
        } catch (error) {
            console.error('Error loading orders:', error);
        }
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
                                <td>${order.items ? order.items.length : 0} منتج</td>
                                <td><strong>${parseFloat(order.total || 0).toFixed(2)} ر.س</strong></td>
                                <td><span class="order-status ${order.status}">${this.getStatusText(order.status)}</span></td>
                                <td>${new Date(order.created_at || order.createdAt).toLocaleDateString('ar-SA')}</td>
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
     * تحميل العملاء من قاعدة البيانات
     */
    async loadCustomers() {
        try {
            this.customers = await this.fetchTableData('customers');
            this.displayCustomers(this.customers);
        } catch (error) {
            console.error('Error loading customers:', error);
        }
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
                                <td>${customer.total_orders || 0} طلب</td>
                                <td><strong>${parseFloat(customer.total_spent || 0).toFixed(2)} ر.س</strong></td>
                                <td>${new Date(customer.registered_at || customer.created_at).toLocaleDateString('ar-SA')}</td>
                                <td><span class="product-status ${customer.status === 'active' ? 'active' : 'inactive'}">${customer.status === 'active' ? 'مفعل' : 'غير مفعل'}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * تحميل الزوار
     */
    async loadVisitors() {
        try {
            this.visitors = await this.fetchTableData('visitors');
        } catch (error) {
            console.error('Error loading visitors:', error);
        }
    }

    /**
     * تحميل الإعدادات
     */
    async loadSettings() {
        try {
            this.settings = await this.fetchTableData('settings');
        } catch (error) {
            console.error('Error loading settings:', error);
        }
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

        // معالجة الحقول الخاصة
        product.price = parseFloat(product.price || 0);
        product.discount_percentage = parseFloat(product.discount_percentage || 0);
        product.stock_quantity = parseInt(product.stock_quantity || 0);
        product.weight = parseFloat(product.weight || 0);
        product.is_featured = product.is_featured === 'on';
        product.status = product.status || 'active';
        product.images = product.images ? product.images.split(',').map(url => url.trim()) : [];
        product.tags = product.tags ? product.tags.split(',').map(tag => tag.trim()) : [];
        product.updated_at = new Date().toISOString();

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
                this.loadDashboardData(); // تحديث الإحصائيات
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

        category.sort_order = parseInt(category.sort_order || 0);
        category.is_active = category.is_active === 'on';
        category.updated_at = new Date().toISOString();

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
     * تسجيل زائر جديد
     */
    async recordVisitor(page = window.location.pathname) {
        try {
            const visitor = {
                ip_address: await this.getClientIP(),
                user_agent: navigator.userAgent,
                visit_date: new Date().toISOString(),
                page: page,
                referrer: document.referrer || '',
                device_type: this.getDeviceType(),
                country: 'السعودية' // يمكن تحسينه بخدمة تحديد الموقع
            };

            await fetch('tables/visitors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(visitor)
            });

            this.updateVisitorCount();
        } catch (error) {
            console.error('Error recording visitor:', error);
        }
    }

    /**
     * الحصول على عنوان IP العميل
     */
    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return '127.0.0.1';
        }
    }

    /**
     * تحديد نوع الجهاز
     */
    getDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('mobile')) return 'mobile';
        if (userAgent.includes('tablet')) return 'tablet';
        return 'desktop';
    }

    /**
     * إعداد الإشعارات
     */
    setupNotifications() {
        // سيتم تحديث الإشعارات تلقائياً بناءً على البيانات
        this.updateNotifications();
    }

    /**
     * تحديث الإشعارات
     */
    async updateNotifications() {
        try {
            const [products, orders] = await Promise.all([
                this.fetchTableData('products'),
                this.fetchTableData('orders')
            ]);

            const notifications = [];

            // إشعار المنتجات منخفضة المخزون
            const lowStockProducts = products.filter(p => p.stock_quantity < 5);
            lowStockProducts.forEach(product => {
                notifications.push({
                    id: `low-stock-${product.id}`,
                    type: 'warning',
                    title: 'منتج قليل الكمية',
                    message: `المنتج '${product.name}' أصبحت كميته أقل من ${product.stock_quantity}`,
                    time: 'منذ لحظة',
                    unread: true
                });
            });

            // إشعار الطلبات الجديدة
            const newOrders = orders.filter(o => o.status === 'pending');
            newOrders.forEach(order => {
                notifications.push({
                    id: `new-order-${order.id}`,
                    type: 'success',
                    title: 'طلب جديد',
                    message: `تم استلام طلب جديد برقم ${order.id}`,
                    time: 'منذ لحظة',
                    unread: true
                });
            });

            this.displayNotifications(notifications);
        } catch (error) {
            console.error('Error updating notifications:', error);
        }
    }

    /**
     * عرض الإشعارات
     */
    displayNotifications(notifications) {
        const notificationList = document.getElementById('notificationList');
        if (!notificationList) return;

        notificationList.innerHTML = notifications.map(notification => `
            <div class="notification-item ${notification.unread ? 'unread' : ''}" onclick="markAsRead('${notification.id}')">
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
        const csvContent = this.products.map(product => 
            `"${product.name}","${product.category_id || 'بدون فئة'}",${product.price},${product.stock_quantity || 0}`
        ).join('\n');

        const headers = 'اسم المنتج,الفئة,السعر,الكمية\n';
        const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'منتجات-أيا-كيدز.csv';
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

    const activeLink = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
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

window.deleteProduct = async function(productId) {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        try {
            const response = await fetch(`tables/products/${productId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                window.dashboard.showNotification('تم حذف المنتج بنجاح', 'success');
                window.dashboard.loadProducts();
                window.dashboard.loadDashboardData();
            } else {
                throw new Error('Failed to delete product');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            window.dashboard.showNotification('حدث خطأ في حذف المنتج', 'error');
        }
    }
};

window.editCategory = function(categoryId) {
    alert(`تعديل الفئة رقم: ${categoryId}`);
};

window.deleteCategory = async function(categoryId) {
    if (confirm('هل أنت متأكد من حذف هذه الفئة؟')) {
        try {
            const response = await fetch(`tables/categories/${categoryId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                window.dashboard.showNotification('تم حذف الفئة بنجاح', 'success');
                window.dashboard.loadCategories();
            } else {
                throw new Error('Failed to delete category');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            window.dashboard.showNotification('حدث خطأ في حذف الفئة', 'error');
        }
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
    
    // تسجيل الزائر
    window.dashboard.recordVisitor();
    
    // تحديث الإحصائيات كل 30 ثانية
    setInterval(() => {
        window.dashboard.loadDashboardData();
        window.dashboard.updateNotifications();
    }, 30000);
});

// منع إرسال النماذج بالطريقة التقليدية
document.addEventListener('submit', (e) => {
    if (e.target.classList.contains('modal-form')) {
        e.preventDefault();
    }
});

// تسجيل الزائر عند مغادرة الصفحة
window.addEventListener('beforeunload', () => {
    if (window.dashboard) {
        window.dashboard.recordVisitor('dashboard-exit');
    }
});