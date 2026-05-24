const MENUS_API_URL =
    'https://script.google.com/macros/s/AKfycbyrCy6zydNo59xmisnkwkDsx4TIC6AY_LNhrzCpA-SZspYWe_cLwIWHEN0VmFnP5yls-w/exec';

const CATEGORY_ORDER = [
    '魚',
    '魚かし',
    'ダンゴ',
    'オキアミ',
    '練餌海道',
    '活エサ',
    'エビ',
    'サビキ',
    '本多商店',
    '福吉',
    'その他',
];

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        }[char];
    });
}

function createCategoryBuckets() {
    return CATEGORY_ORDER.reduce(function (buckets, category) {
        buckets[category] = [];
        return buckets;
    }, {});
}

function normalizeCategory(item) {
    if (!item || !item.category || !CATEGORY_ORDER.includes(item.category)) {
        return 'その他';
    }

    return item.category;
}

function renderProductCard(item) {
    const href = item.url && item.url.trim() !== '' ? item.url : item.img_url;
    const stockMarkup =
        item.stock === 'あり'
            ? `在庫 ${escapeHtml(item.stock)}`
            : '<span style="color:#c00;font-weight:600;">在庫切れ</span>';

    return `<div class="col-lg-3 col-md-4 col-sm-6 col-xs-6">
    <article class="product-card" itemscope itemtype="https://schema.org/Product" role="group" aria-label="${escapeHtml(item.name)}">
        <a href="${escapeHtml(href)}" class="product-link">
            <img src="${escapeHtml(item.img_url)}?w=300"
                srcset="${escapeHtml(item.img_url)}?w=300 1x, ${escapeHtml(item.img_url)}?w=600 2x"
                alt="${escapeHtml(item.name)}" loading="lazy">
            <h3 itemprop="name" class="product-name">${escapeHtml(item.name)}</h3>
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
        container.innerHTML = '<p class="empty-message">現在掲載商品はありません。</p>';
        return;
    }

    container.innerHTML = items.join('');
}

async function loadMenus() {
    const buckets = createCategoryBuckets();

    try {
        const response = await fetch(MENUS_API_URL);

        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }

        const list = await response.json();

        if (!Array.isArray(list)) {
            throw new Error('Unexpected payload');
        }

        list.forEach(function (item) {
            const category = normalizeCategory(item);
            buckets[category].push(renderProductCard(item));
        });

        CATEGORY_ORDER.forEach(function (category) {
            renderCategory(category, buckets[category]);
        });
    } catch (error) {
        console.error('Failed to load menu data.', error);
        CATEGORY_ORDER.forEach(function (category) {
            const container = document.getElementById(category);
            if (container) {
                container.innerHTML =
                    '<p class="error-message">商品一覧の取得に失敗しました。時間をおいて再度ご確認ください。</p>';
            }
        });
    }
}

loadMenus();
