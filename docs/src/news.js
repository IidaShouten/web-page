(function () {
    const config = window.SiteConfig;
    const runtime = window.SiteRuntime;
    const container = document.getElementById('news');
    const status = document.getElementById('news-status');
    const retry = document.getElementById('news-retry');
    if (!container || !status || !retry) return;
    let hasData = false;
    let loading = false;

    function publishedAt(item) {
        const year = Number(item.year);
        const month = Number(item.month);
        const day = Number(item.day);
        const date = new Date(Date.UTC(year, month - 1, day));
        return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
            ? date.getTime() : null;
    }

    function renderItems(items) {
        return `<dl class="news-list">${items.map(function (item) {
            const date = publishedAt(item);
            const label = date === null ? '日付未登録' : `${item.year}/${item.month}/${item.day}`;
            return `<div class="news-list__item"><dt>${runtime.escapeHtml(label)}</dt><dd>${runtime.escapeHtml(item.message || '')}</dd></div>`;
        }).join('')}</dl>`;
    }

    function renderNews(list, savedAt) {
        if (!Array.isArray(list) || list.some(function (item) {
            return !item || typeof item !== 'object' || Array.isArray(item);
        })) throw new Error('Unexpected news data');
        const ordered = list.slice().sort(function (a, b) { return (publishedAt(b) || 0) - (publishedAt(a) || 0); });
        const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
        const recent = ordered.filter(function (item) { return publishedAt(item) === null || publishedAt(item) >= cutoff; });
        const archive = ordered.filter(function (item) { return publishedAt(item) !== null && publishedAt(item) < cutoff; });
        const summary = !ordered.length ? config.messages.newsEmpty
            : '直近90日のお知らせはありません。過去のお知らせは下から確認できます。';
        container.innerHTML = (recent.length ? renderItems(recent) : `<p class="empty-message">${runtime.escapeHtml(summary)}</p>`)
            + (archive.length ? `<details class="news-archive"><summary>過去のお知らせを見る（${archive.length}件）</summary>${renderItems(archive)}</details>` : '');
        hasData = true;
        runtime.updateTimestamp('news-updated-at', savedAt);
    }

    async function loadNews() {
        if (loading) return;
        loading = true;
        retry.hidden = true;
        container.setAttribute('aria-busy', 'true');
        status.textContent = hasData ? '保存済みのお知らせを表示しています。最新の情報を確認中です。' : config.messages.newsLoading;
        status.className = 'status-message';
        status.hidden = false;
        try {
            const list = await runtime.fetchJson(config.api.news);
            renderNews(list, new Date().toISOString());
            runtime.setCache(config.storageKeys.newsCache, list);
            status.hidden = true;
        } catch (error) {
            runtime.recordClientEvent('news_fetch_failed', { message: error.message });
            status.textContent = hasData ? config.messages.newsFallback : config.messages.newsError;
            status.className = hasData ? 'fallback-message' : 'error-message';
            retry.hidden = false;
        } finally {
            loading = false;
            container.setAttribute('aria-busy', 'false');
        }
    }
    retry.addEventListener('click', loadNews);
    const cached = runtime.getCache(config.storageKeys.newsCache);
    if (cached) {
        try { renderNews(cached.payload, cached.savedAt); } catch (error) { /* Ignore unusable caches. */ }
    }
    loadNews();
})();
