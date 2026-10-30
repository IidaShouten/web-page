(function () {
    const config = window.SiteConfig;
    const runtime = window.SiteRuntime;
    if (!config || !runtime) {
        const message = document.getElementById('menus-status');
        if (message) {
            message.textContent = '商品一覧の準備ができませんでした。ページを再読み込みしてください。';
            message.className = 'error-message';
            message.hidden = false;
        }
        return;
    }
    const escapeHtml = runtime.escapeHtml;
    const form = document.getElementById('product-filters');
    const search = document.getElementById('product-search');
    const searchDisclosure = document.getElementById('product-search-disclosure');
    const searchSummary = document.getElementById('product-search-summary');
    const categoryFilter = document.getElementById('product-category');
    const stockFilter = document.getElementById('product-in-stock');
    const status = document.getElementById('menus-status');
    const retry = document.getElementById('menus-retry');
    const results = document.getElementById('product-results');
    const empty = document.getElementById('product-empty');
    const count = document.getElementById('product-count');
    if (!form || !results) return;

    let products = [];
    let hasData = false;
    let loading = false;
    const categoryMap = new Map(config.categories.map(function (category) {
        return [runtime.normalizeMenuText(category.id), category.id];
    }));

    function categoryOf(item) {
        return categoryMap.get(runtime.normalizeMenuText(item.category || '')) || 'その他';
    }

    function stockOf(item) {
        const value = runtime.normalizeMenuText(item.stock || '');
        if (value === 'あり') return { label: '在庫あり', available: true, className: 'is-available' };
        if (['なし', '無し', '在庫切れ', '売り切れ'].includes(value)) {
            return { label: '在庫切れ', available: false, className: 'is-sold-out' };
        }
        return { label: '在庫未確認', available: false, className: 'is-unknown' };
    }

    function renderProduct(item) {
        const name = runtime.normalizeMenuText(item.name || '商品名未登録');
        const imageUrl = runtime.safeUrl(item.img_url);
        const detailUrl = runtime.safeUrl(item.url);
        const stock = stockOf(item);
        const photo = imageUrl
            ? `<a class="product-photo" href="${escapeHtml(imageUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(name)}の写真を拡大（新しいタブ）">
                <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)}" loading="lazy" decoding="async" width="${config.image.productWidth}" height="${config.image.productHeight}">
                <span class="product-photo__label">写真を拡大</span>
               </a>`
            : '<div class="product-photo product-photo--empty">写真準備中</div>';
        const detail = detailUrl && detailUrl !== imageUrl
            ? `<a class="product-detail text-link" href="${escapeHtml(detailUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(name)}の商品説明（外部サイト・新しいタブ）">商品説明 <span>（外部サイト）</span></a>`
            : '';
        return `<article class="product-card">
            ${photo}
            <div class="product-card__body">
                <h4 class="product-name">${escapeHtml(name)}</h4>
                <p class="product-price">${escapeHtml(item.price || '価格は店頭でご確認ください')}</p>
                <p class="product-stock ${stock.className}">${stock.label}</p>
                ${detail}
            </div>
        </article>`;
    }

    function renderProducts() {
        const keyword = search.value.trim();
        searchSummary.textContent = keyword ? `商品名で絞り込み中：${keyword}` : '商品名で探す';
        document.getElementById('product-reset').hidden = !keyword && !categoryFilter.value && !stockFilter.checked;
        if (!hasData) return;
        const terms = runtime.normalizeSearchText(search.value).split(/\s+/).filter(Boolean);
        const filtered = products.filter(function (item) {
            const category = categoryOf(item);
            const categoryLabel = config.categories.find(function (entry) { return entry.id === category; }).label;
            const text = runtime.normalizeSearchText(`${item.name || ''} ${categoryLabel}`);
            return (!categoryFilter.value || category === categoryFilter.value)
                && (!stockFilter.checked || stockOf(item).available)
                && terms.every(function (term) { return text.includes(term); });
        });
        config.categories.forEach(function (category) {
            const container = document.getElementById(category.id);
            const items = filtered.filter(function (item) { return categoryOf(item) === category.id; });
            container.closest('.product-category-block').hidden = items.length === 0;
            container.innerHTML = items.map(renderProduct).join('');
        });
        count.textContent = `${products.length}点中 ${filtered.length}点を表示`;
        empty.hidden = filtered.length !== 0;
        empty.querySelector('p').textContent = products.length
            ? '条件に合う商品が見つかりませんでした。検索語やカテゴリを変えてお試しください。'
            : config.messages.menusEmpty;
        empty.querySelector('button').hidden = products.length === 0;
    }

    function setStatus(message, kind) {
        status.textContent = message;
        status.className = kind || 'status-message';
        status.hidden = !message;
    }

    function acceptData(list, savedAt) {
        if (!Array.isArray(list) || !list.every(function (item) {
            return item && typeof item === 'object' && !Array.isArray(item) &&
                ['category', 'name', 'price', 'stock', 'url', 'img_url'].every(function (field) {
                    return item[field] == null || ['string', 'number', 'boolean'].includes(typeof item[field]);
                });
        })) throw new Error('Unexpected product data');
        products = list;
        hasData = true;
        renderProducts();
        runtime.updateTimestamp('menus-updated-at', savedAt);
    }

    async function loadMenus() {
        if (loading) return;
        loading = true;
        results.setAttribute('aria-busy', 'true');
        retry.hidden = true;
        setStatus(hasData ? '保存済みの商品を表示しています。最新の情報を確認中です。' : '商品一覧を読み込み中です。');
        try {
            const list = await runtime.fetchJson(config.api.menus);
            acceptData(list, new Date().toISOString());
            runtime.setCache(config.storageKeys.menusCache, list);
            setStatus('');
        } catch (error) {
            runtime.recordClientEvent('menus_fetch_failed', { message: error.message });
            setStatus(hasData ? config.messages.menusFallback : config.messages.menusError,
                hasData ? 'fallback-message' : 'error-message');
            retry.hidden = false;
        } finally {
            loading = false;
            results.setAttribute('aria-busy', 'false');
        }
    }

    const groups = [...new Set(config.categories.map(function (category) { return category.group; }))];
    groups.forEach(function (group) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = group;
        config.categories.filter(function (category) { return category.group === group; }).forEach(function (category) {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.label;
            optgroup.appendChild(option);
        });
        categoryFilter.appendChild(optgroup);
    });
    form.addEventListener('submit', function (event) { event.preventDefault(); });
    search.addEventListener('input', function (event) { if (!event.isComposing) renderProducts(); });
    search.addEventListener('compositionend', renderProducts);
    categoryFilter.addEventListener('change', renderProducts);
    stockFilter.addEventListener('change', renderProducts);
    function resetFilters() {
        form.reset();
        searchDisclosure.open = false;
        renderProducts();
    }
    document.getElementById('product-reset').addEventListener('click', resetFilters);
    empty.querySelector('button').addEventListener('click', function () {
        resetFilters();
        categoryFilter.focus();
    });
    document.querySelectorAll('[data-category]').forEach(function (link) {
        link.addEventListener('click', function () {
            form.reset();
            searchDisclosure.open = false;
            categoryFilter.value = link.dataset.category;
            renderProducts();
        });
    });
    retry.addEventListener('click', loadMenus);
    const cached = runtime.getCache(config.storageKeys.menusCache);
    if (cached) {
        try { acceptData(cached.payload, cached.savedAt); } catch (error) { /* Ignore unusable caches. */ }
    }
    loadMenus();
})();
