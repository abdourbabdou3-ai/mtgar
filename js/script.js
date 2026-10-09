/**
 * Aya Kids - متجر الأطفال الأسطوري
 * JavaScript متقدم مع أنيميشن أسطوري
 * ===========================================
 */

class AyaKidsStore {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('ayaKidsCart')) || [];
        this.products = [];
        this.categories = [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.currentPage = 1;
        this.itemsPerPage = 12;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadProducts();
        this.loadCategories();
        this.updateCartUI();
        this.setupAnimations();
        this.setupScrollEffects();
        this.recordVisitor();
    }

    /**
     * إعداد مستمعي الأحداث
     */
    setupEventListeners() {
        // زر السلة
        const cartBtn = document.getElementById('cartBtn');
        const cartDropdown = document.getElementById('cartDropdown');
        
        cartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            cartDropdown.classList.toggle('active');
        });

        // إغلاق السلة عند النقر خارجها
        document.addEventListener('click', (e) => {
            if (!cartBtn.contains(e.target) && !cartDropdown.contains(e.target)) {
                cartDropdown.classList.remove('active');
            }
        });

        // زر البحث
        const searchBtn = document.getElementById('searchBtn');
        const searchModal = document.getElementById('searchModal');
        const closeSearch = document.getElementById('closeSearch');
        
        searchBtn.addEventListener('click', () => {
            searchModal.classList.add('active');
            document.getElementById('modalSearchInput').focus();
        });

        closeSearch.addEventListener('click', () => {
            searchModal.classList.remove('active');
        });

        // البحث في النافذة المنبثقة
        const modalSearchInput = document.getElementById('modalSearchInput');
        modalSearchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.performSearch();
        });

        // البحث في الشريط
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.filterProducts();
            });
        }

        // أزرار التصفية
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.filterProducts();
            });
        });

        // زر عرض المزيد
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMoreProducts();
            });
        }

        // زر التمرير للأعلى
        const scrollToTop = document.getElementById('scrollToTop');
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollToTop.classList.add('visible');
            } else {
                scrollToTop.classList.remove('visible');
            }
        });

        scrollToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // تأثير الشريط العلوي عند التمرير
        window.addEventListener('scroll', () => {
            const navbar = document.querySelector('.navbar');
            if (window.pageYOffset > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
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
                this.products = result.data.map(product => ({
                    id: product.id,
                    title: product.name,
                    price: product.price,
                    originalPrice: product.discount_percentage > 0 ? product.price / (1 - product.discount_percentage / 100) : product.price,
                    image: product.images && product.images[0] ? product.images[0] : 'https://via.placeholder.com/400x300',
                    category: product.category_id,
                    rating: 4.5, // يمكن تحسينه لاحقاً بالتقييمات
                    reviews: 50, // يمكن تحسينه لاحقاً بعدد المراجعات
                    badge: product.is_featured ? 'مميز' : '',
                    description: product.description,
                    inStock: product.status === 'active' && product.stock_quantity > 0,
                    stock_quantity: product.stock_quantity
                }));
                
                this.displayProducts(this.products);
            } else {
                // استخدام بيانات محلية كاحتياطي
                this.loadMockProducts();
            }
        } catch (error) {
            console.error('Error loading products from database:', error);
            // استخدام بيانات محلية كاحتياطي
            this.loadMockProducts();
        }
    }

    /**
     * تحميل الفئات من قاعدة البيانات
     */
    async loadCategories() {
        try {
            const response = await fetch('tables/categories');
            const result = await response.json();
            
            if (result.data) {
                this.categories = result.data.map(category => ({
                    id: category.id,
                    name: category.name,
                    icon: 'fas fa-tag', // يمكن تحسينه لاحقاً
                    count: this.products.filter(p => p.category === category.id).length,
                    color: '#ff6b9d' // يمكن تحسينه لاحقاً
                }));
                
                this.displayCategories(this.categories);
            } else {
                // استخدام بيانات محلية كاحتياطي
                this.loadMockCategories();
            }
        } catch (error) {
            console.error('Error loading categories from database:', error);
            // استخدام بيانات محلية كاحتياطي
            this.loadMockCategories();
        }
    }

    /**
     * تحميل فئات محلية (احتياطي)
     */
    loadMockCategories() {
        const mockCategories = [
            { id: 1, name: 'تعليمية', icon: 'fas fa-graduation-cap', count: 45 },
            { id: 2, name: 'ألعبة', icon: 'fas fa-puzzle-piece', count: 78 },
            { id: 3, name: 'إبداعية', icon: 'fas fa-palette', count: 32 },
            { id: 4, name: 'إلكترونية', icon: 'fas fa-microchip', count: 23 },
            { id: 5, name: 'قصص', icon: 'fas fa-book-open', count: 56 },
            { id: 6, name: 'رياضية', icon: 'fas fa-running', count: 34 }
        ];

        this.categories = mockCategories;
        this.displayCategories(this.categories);
    }

    /**
     * عرض المنتجات
     */
    displayProducts(products) {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;

        productsGrid.innerHTML = products.map(product => this.createProductCard(product)).join('');
        
        // إضافة أنيميشن الظهور
        setTimeout(() => {
            const cards = productsGrid.querySelectorAll('.product-card');
            cards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('fade-in');
                }, index * 100);
            });
        }, 100);

        // إضافة مستمعي الأحداث لأزرار "أضف للسلة"
        this.setupAddToCartButtons();
    }

    /**
     * إنشاء بطاقة المنتج
     */
    createProductCard(product) {
        const badgeHTML = product.badge ? 
            `<div class="product-badge">${product.badge}</div>` : '';

        const originalPriceHTML = product.originalPrice ? 
            `<span class="price-original">${product.originalPrice} ر.س</span>` : '';

        const outOfStockHTML = !product.inStock ? 
            `<div class="out-of-stock">غير متاح</div>` : '';

        return `
            <div class="product-card ${!product.inStock ? 'out-of-stock' : ''}">
                <div class="product-image-container">
                    <img src="${product.image}" alt="${product.title}" class="product-image">
                    ${badgeHTML}
                    ${outOfStockHTML}
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.title}</h3>
                    <div class="product-price">
                        <span class="price-current">${product.price} ر.س</span>
                        ${originalPriceHTML}
                    </div>
                    <div class="product-rating">
                        <div class="stars">${this.generateStars(product.rating)}</div>
                        <span class="rating-text">${product.rating} (${product.reviews})</span>
                    </div>
                    <button class="add-to-cart ${!product.inStock ? 'disabled' : ''}" 
                            data-product-id="${product.id}"
                            ${!product.inStock ? 'disabled' : ''}>
                        <i class="fas fa-shopping-cart"></i>
                        <span>${product.inStock ? 'أضف للسلة' : 'غير متاح'}</span>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * إنشاء نجوم التقييم
     */
    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let stars = '';

        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }

        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }

        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }

        return stars;
    }

    /**
     * إعداد أزرار "أضف للسلة"
     */
    setupAddToCartButtons() {
        const addToCartButtons = document.querySelectorAll('.add-to-cart:not(.disabled)');
        addToCartButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = parseInt(e.currentTarget.dataset.productId);
                const product = this.products.find(p => p.id === productId);
                
                if (product) {
                    this.addToCart(product, e.currentTarget);
                }
            });
        });
    }

    /**
     * إضافة منتج للسلة مع أنيميشن أسطوري
     */
    addToCart(product, button) {
        // أنيميشن الزر
        button.classList.add('animating', 'adding');
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>جاري الإضافة...</span>';

        setTimeout(() => {
            // إضافة للسلة
            const existingItem = this.cart.find(item => item.id === product.id);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                this.cart.push({
                    ...product,
                    quantity: 1,
                    addedAt: new Date().toISOString()
                });
            }

            // حفظ في التخزين المحلي
            localStorage.setItem('ayaKidsCart', JSON.stringify(this.cart));

            // أنيميشن الطائرة
            this.createFlyingAnimation(button, product);

            // تحديث واجهة السلة
            this.updateCartUI();

            // إعادة الزر لحالته الطبيعية
            button.classList.remove('animating', 'adding');
            button.classList.add('added');
            button.innerHTML = '<i class="fas fa-check"></i> <span>تمت الإضافة!</span>';

            // إظهار إشعار
            this.showNotification(`تم إضافة ${product.title} للسلة!`, 'success');

            // إعادة الزر بعد ثواني
            setTimeout(() => {
                button.classList.remove('added');
                button.innerHTML = '<i class="fas fa-shopping-cart"></i> <span>أضف للسلة</span>';
            }, 2000);

        }, 1000);
    }

    /**
     * إنشاء أنيميشن الطائرة
     */
    createFlyingAnimation(button, product) {
        const buttonRect = button.getBoundingClientRect();
        const cartBtn = document.getElementById('cartBtn');
        const cartRect = cartBtn.getBoundingClientRect();

        // إنشاء عنصر طائر
        const flyingItem = document.createElement('div');
        flyingItem.className = 'flying-item';
        flyingItem.innerHTML = `<img src="${product.image}" alt="${product.title}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">`;
        
        flyingItem.style.left = (buttonRect.left + buttonRect.width / 2 - 30) + 'px';
        flyingItem.style.top = (buttonRect.top + buttonRect.height / 2 - 30) + 'px';

        document.body.appendChild(flyingItem);

        // حساب المسار
        const deltaX = cartRect.left - buttonRect.left;
        const deltaY = cartRect.top - buttonRect.top;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // تطبيق الأنيميشن
        flyingItem.style.transition = `all ${distance / 800}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
        flyingItem.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.3) rotate(360deg)`;
        flyingItem.style.opacity = '0';

        // إزالة العنصر بعد الأنيميشن
        setTimeout(() => {
            flyingItem.remove();
            
            // أنيميشن السلة
            cartBtn.classList.add('shake');
            setTimeout(() => cartBtn.classList.remove('shake'), 500);
        }, distance / 800 * 1000);
    }

    /**
     * تحديث واجهة السلة
     */
    updateCartUI() {
        const cartCount = document.getElementById('cartCount');
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');

        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // تحديث العدد
        cartCount.textContent = totalItems;
        cartTotal.textContent = `${totalPrice.toFixed(2)} ر.س`;

        // تحديث عناصر السلة
        if (this.cart.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart">السلة فارغة</p>';
        } else {
            cartItems.innerHTML = this.cart.map(item => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.title}">
                    <div class="cart-item-info">
                        <h4 class="cart-item-title">${item.title}</h4>
                        <p class="cart-item-price">${item.price} ر.س × ${item.quantity}</p>
                    </div>
                    <button class="remove-item" data-product-id="${item.id}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');

            // إضافة مستمعي الأحداث لأزرار الإزالة
            cartItems.querySelectorAll('.remove-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const productId = parseInt(e.currentTarget.dataset.productId);
                    this.removeFromCart(productId);
                });
            });
        }
    }

    /**
     * إزالة منتج من السلة
     */
    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        localStorage.setItem('ayaKidsCart', JSON.stringify(this.cart));
        this.updateCartUI();
        this.showNotification('تمت إزالة المنتج من السلة', 'info');
    }

    /**
     * عرض الفئات
     */
    displayCategories(categories) {
        const categoriesGrid = document.getElementById('categoriesGrid');
        if (!categoriesGrid) return;

        categoriesGrid.innerHTML = categories.map(category => `
            <div class="category-card fade-in">
                <div class="category-icon">
                    <i class="${category.icon}"></i>
                </div>
                <h3>${category.name}</h3>
                <p>${category.count} منتج</p>
            </div>
        `).join('');
    }

    /**
     * تصفية المنتجات
     */
    filterProducts() {
        let filtered = this.products;

        // تصفية حسب النوع
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(product => {
                switch (this.currentFilter) {
                    case 'new':
                        return product.badge === 'جديد';
                    case 'sale':
                        return product.badge === 'تخفيض';
                    case 'popular':
                        return product.badge === 'الأكثر مبيعاً';
                    default:
                        return true;
                }
            });
        }

        // بحث
        if (this.searchQuery) {
            filtered = filtered.filter(product => 
                product.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                product.category.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                product.description.toLowerCase().includes(this.searchQuery.toLowerCase())
            );
        }

        this.displayProducts(filtered);
    }

    /**
     * البحث المتقدم
     */
    performSearch() {
        if (!this.searchQuery) {
            document.getElementById('searchResults').innerHTML = '';
            return;
        }

        const results = this.products.filter(product => 
            product.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            product.category.toLowerCase().includes(this.searchQuery.toLowerCase())
        );

        const searchResults = document.getElementById('searchResults');
        searchResults.innerHTML = results.map(product => `
            <div class="search-result-item" onclick="store.selectProduct(${product.id})">
                <img src="${product.image}" alt="${product.title}">
                <div class="search-result-info">
                    <h4>${product.title}</h4>
                    <p>${product.price} ر.س</p>
                </div>
            </div>
        `).join('') || '<p style="color: rgba(255,255,255,0.6); text-align: center;">لا توجد نتائج</p>';
    }

    /**
     * تحميل المزيد من المنتجات
     */
    async loadMoreProducts() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        const spinner = loadMoreBtn.querySelector('.fa-spinner');
        
        // إظهار مؤقم التحميل
        loadMoreBtn.disabled = true;
        spinner.style.display = 'inline-block';
        
        // محاكاة تحميل المزيد
        setTimeout(() => {
            // هنا يمكنك تحميل المزيد من المنتجات من الخادم
            this.showNotification('تم تحميل المزيد من المنتجات', 'success');
            
            // إخفاء مؤقم التحميل
            loadMoreBtn.disabled = false;
            spinner.style.display = 'none';
        }, 1500);
    }

    /**
     * إعداد الأنيميشنات المتقدمة
     */
    setupAnimations() {
        // أنيميشن الظهور عند التمرير
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, observerOptions);

        // مراقبة العناصر
        document.querySelectorAll('.product-card, .category-card, .feature-card').forEach(el => {
            observer.observe(el);
        });

        // أنيميشن خاص للمنتجات المميزة
        const specialProducts = document.querySelectorAll('.product-card[data-special="true"]');
        specialProducts.forEach((product, index) => {
            setTimeout(() => {
                product.classList.add('special-glow');
            }, index * 200);
        });

        // تأثير التكبير عند التحويم
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-15px) scale(1.02)';
                card.style.boxShadow = '0 15px 35px rgba(0,0,0,0.2), 0 0 60px rgba(255,107,157,0.3)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
                card.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            });
        });
    }

    /**
     * تأثيرات التمرير
     */
    setupScrollEffects() {
        // تأثير الشريط العلوي
        window.addEventListener('scroll', () => {
            const navbar = document.querySelector('.navbar');
            if (window.pageYOffset > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });

        // تأثيرات إضافية عند التمرير
        const sections = document.querySelectorAll('section');
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        sections.forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(30px)';
            section.style.transition = 'all 0.6s ease-out';
            sectionObserver.observe(section);
        });
    }

    /**
     * إظهار الإشعارات
     */
    showNotification(message, type = 'info') {
        // إنشاء عنصر الإشعار
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
     * اختيار منتج
     */
    selectProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            // هنا يمكنك فتح صفحة تفاصيل المنتج أو نافذة منبثقة
            this.showNotification(`تم اختيار: ${product.title}`, 'info');
            
            // إغلاق نافذة البحث
            document.getElementById('searchModal').classList.remove('active');
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
                country: 'السعودية'
            };

            await fetch('tables/visitors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(visitor)
            });
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
}

// تهيئة المتجر عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    window.store = new AyaKidsStore();
});

// دوال مساعدة عالمية
window.selectProduct = (productId) => {
    if (window.store) {
        window.store.selectProduct(productId);
    }
};