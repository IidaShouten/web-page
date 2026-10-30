(function () {
    const siteConfig = window.SiteConfig || {
        api: {
            menus:
                'https://script.google.com/macros/s/AKfycbyrCy6zydNo59xmisnkwkDsx4TIC6AY_LNhrzCpA-SZspYWe_cLwIWHEN0VmFnP5yls-w/exec',
        },
        storageKeys: {
            menusCache: 'miura-bait-shop-menus-v2-cache',
        },
        image: {
            productWidth: 300,
            productHeight: 300,
        },
        categories: [
            { id: 'ダンゴ' },
            { id: 'オキアミ' },
            { id: '魚' },
            { id: 'エビ' },
            { id: 'サビキ' },
            { id: '魚かし' },
            { id: '練餌海道' },
            { id: '本多商店' },
            { id: '福吉' },
            { id: '活エサ' },
            { id: 'その他' },
        ],
        messages: {
            menusEmpty: '現在掲載商品はありません。',
            menusError: '商品一覧の取得に失敗しました。時間をおいて再度ご確認ください。',
            menusFallback:
                '最新の商品一覧を取得できなかったため、前回保存した内容を表示しています。',
        },
    };

    const siteRuntime = window.SiteRuntime || {
        escapeHtml: function (value) {
            return String(value).replace(/[&<>"']/g, function (char) {
                return {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#39;',
                }[char];
            });
        },
        normalizeInlineSpacing: function (value) {
            return String(value)
                .replace(/\u3000/g, ' ')
                .replace(/[ \t]+/g, ' ')
                .trim();
        },
        normalizeMenuText: function (value) {
            return String(value)
                .normalize('NFKC')
                .replace(/[‐‑‒–—―ｰ−－]/g, '-')
                .replace(/[〜～∼∾]/g, '~')
                .replace(/[／⁄∕]/g, '/')
                .replace(/\s*・\s*/g, '・')
                .replace(/\u3000/g, ' ')
                .replace(/[ \t]+/g, ' ')
                .trim();
        },
        getCache: function () {
            return null;
        },
        setCache: function () {},
        updateTimestamp: function () {},
        recordClientEvent: function () {},
    };

    const MENUS_API_URL = siteConfig.api.menus;
    const MENU_CACHE_KEY = siteConfig.storageKeys.menusCache;
    const CATEGORY_ORDER = siteConfig.categories.map(function (category) {
        return category.id;
    });
    const escapeHtml = siteRuntime.escapeHtml;
    const normalizeMenuText = siteRuntime.normalizeMenuText;

    const NORMALIZED_CATEGORY_MAP = siteConfig.categories.reduce(function (map, category) {
        map[normalizeMenuText(category.id)] = category.id;
        return map;
    }, {});

    function createCategoryBuckets() {
        return CATEGORY_ORDER.reduce(function (buckets, category) {
            buckets[category] = [];
            return buckets;
        }, {});
    }

    function normalizeCategory(item) {
        const normalizedCategory = normalizeMenuText(item && item.category ? item.category : '');

        if (!Object.prototype.hasOwnProperty.call(NORMALIZED_CATEGORY_MAP, normalizedCategory)) {
            return 'その他';
        }

        return NORMALIZED_CATEGORY_MAP[normalizedCategory];
    }

    function safeUrl(value) {
        if (typeof value !== 'string' || !value.trim()) {
            return '';
        }

        try {
            const url = new URL(value, window.location.href);
            return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
        } catch (error) {
            return '';
        }
    }

    function isMenuList(value) {
        return Array.isArray(value) && value.every(function (item) {
            return item && typeof item === 'object' && !Array.isArray(item) &&
                ['category', 'name', 'price', 'stock', 'url', 'img_url'].every(function (field) {
                    return item[field] == null || ['string', 'number', 'boolean'].includes(typeof item[field]);
                });
        });
    }

    function renderProductCard(item) {
        const imageUrl = safeUrl(item.img_url);
        const href = safeUrl(item.url) || imageUrl;
        const srcsetUrl = escapeHtml(imageUrl.replace(/,/g, '%2C'));
        const imageAttributes = imageUrl
            ? `src="${escapeHtml(imageUrl)}?w=300" srcset="${srcsetUrl}?w=300 1x, ${srcsetUrl}?w=600 2x"`
            : '';
        const normalizedName = normalizeMenuText(item.name || '');
        const stockMarkup =
            item.stock === 'あり'
                ? `在庫 ${escapeHtml(item.stock)}`
                : '<span style="color:#c00;font-weight:600;">在庫切れ</span>';

        return `<div class="col-lg-3 col-md-4 col-sm-6 col-xs-6">
    <article class="product-card" itemscope itemtype="https://schema.org/Product" role="group" aria-label="${escapeHtml(normalizedName)}">
        <a${href ? ` href="${escapeHtml(href)}"` : ''} class="product-link">
            <img ${imageAttributes}
                alt="${escapeHtml(normalizedName)}" loading="lazy" decoding="async" width="${siteConfig.image.productWidth}" height="${siteConfig.image.productHeight}">
            <h3 itemprop="name" class="product-name">${escapeHtml(normalizedName)}</h3>
            <h4 class="product-price">
                <meta itemprop="priceCurrency" content="JPY">
                <span itemprop="price">${escapeHtml(item.price)}</span>
            </h4>
            <h4 class="product-stock">${stockMarkup}</h4>
        </a>
    </article>
</div>`;
    }

    function renderCategory(category, items) {
        const container = document.getElementById(category);

        if (!container) {
            return;
        }

        if (items.length === 0) {
            container.innerHTML = `<p class="empty-message">${escapeHtml(siteConfig.messages.menusEmpty)}</p>`;
            return;
        }

        container.innerHTML = items.join('');
    }

    function createMenuBuckets(list) {
        const buckets = createCategoryBuckets();
        list.forEach(function (item) {
            const category = normalizeCategory(item);
            buckets[category].push(renderProductCard(item));
        });
        return buckets;
    }

    async function loadMenus() {
        try {
            const response = await fetch(MENUS_API_URL);

            if (!response.ok) {
                throw new Error(`Request failed: ${response.status}`);
            }

            const list = await response.json();

            if (!isMenuList(list)) {
                throw new Error('Unexpected payload');
            }

            const buckets = createMenuBuckets(list);
            siteRuntime.setCache(MENU_CACHE_KEY, list);
            CATEGORY_ORDER.forEach(function (category) {
                renderCategory(category, buckets[category]);
            });
            siteRuntime.updateTimestamp('menus-updated-at', new Date().toISOString());
        } catch (error) {
            console.error('Failed to load menu data.', error);
            siteRuntime.recordClientEvent('menus_fetch_failed', {
                message: error && error.message ? error.message : 'Unknown error',
            });

            const cached = siteRuntime.getCache(MENU_CACHE_KEY);

            if (cached && isMenuList(cached.payload)) {
                const buckets = createMenuBuckets(cached.payload);
                const notice = `<p class="fallback-message">${escapeHtml(siteConfig.messages.menusFallback)}</p>`;

                CATEGORY_ORDER.forEach(function (category) {
                    const container = document.getElementById(category);
                    if (container) {
                        container.innerHTML = notice + buckets[category].join('');
                    }
                });
                siteRuntime.updateTimestamp('menus-updated-at', cached.savedAt);
                return;
            }

            CATEGORY_ORDER.forEach(function (category) {
                const container = document.getElementById(category);
                if (container) {
                    container.innerHTML = `<p class="error-message">${escapeHtml(siteConfig.messages.menusError)}</p>`;
                }
            });
        }
    }

    loadMenus();
})();
