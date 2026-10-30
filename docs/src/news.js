(function () {
    const siteConfig = window.SiteConfig || {
        api: {
            news: 'https://script.google.com/macros/s/AKfycbx6bzcZ7HHwRWh9ieGrWiGTx2khsOUKXPhUNATQF2n3KThDLDILUCn8R-FGrrjm3DrzzQ/exec',
        },
        storageKeys: {
            newsCache: 'miura-bait-shop-news-cache',
        },
        messages: {
            newsLoading: '新着情報を読み込み中です。',
            newsEmpty: '現在お知らせはありません。',
            newsError: '新着情報の取得に失敗しました。時間をおいて再度ご確認ください。',
            newsFallback:
                '最新の新着情報を取得できなかったため、前回保存した内容を表示しています。',
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
        getCache: function () {
            return null;
        },
        setCache: function () {},
        updateTimestamp: function () {},
        recordClientEvent: function () {},
    };

    const NEWS_API_URL = siteConfig.api.news;
    const NEWS_CACHE_KEY = siteConfig.storageKeys.newsCache;
    const escapeHtml = siteRuntime.escapeHtml;

    function renderStatus(container, className, message) {
        container.innerHTML = `<p class="${className}">${escapeHtml(message)}</p>`;
    }

    function renderNewsItems(items) {
        return `<dl>${items
            .map(function (item) {
                const date = `${escapeHtml(item.year)}/${escapeHtml(item.month)}/${escapeHtml(item.day)}`;
                return `<dt>${date}</dt><dd>${escapeHtml(item.message)}</dd>`;
            })
            .join('')}</dl>`;
    }

    async function loadNews() {
        const container = document.getElementById('news');

        if (!container) {
            return;
        }

        renderStatus(container, 'status-message', siteConfig.messages.newsLoading);

        try {
            const response = await fetch(NEWS_API_URL);

            if (!response.ok) {
                throw new Error(`Request failed: ${response.status}`);
            }

            const list = await response.json();

            if (!Array.isArray(list) || list.length === 0) {
                renderStatus(container, 'empty-message', siteConfig.messages.newsEmpty);
                siteRuntime.updateTimestamp('news-updated-at', new Date().toISOString());
                return;
            }

            const ordered = list.slice().reverse();
            siteRuntime.setCache(NEWS_CACHE_KEY, ordered);
            container.innerHTML = renderNewsItems(ordered);
            siteRuntime.updateTimestamp('news-updated-at', new Date().toISOString());
        } catch (error) {
            console.error('Failed to load news.', error);
            siteRuntime.recordClientEvent('news_fetch_failed', {
                message: error && error.message ? error.message : 'Unknown error',
            });

            const cached = siteRuntime.getCache(NEWS_CACHE_KEY);

            if (cached && Array.isArray(cached.payload) && cached.payload.length > 0) {
                container.innerHTML =
                    `<p class="fallback-message">${escapeHtml(siteConfig.messages.newsFallback)}</p>` +
                    renderNewsItems(cached.payload);
                siteRuntime.updateTimestamp('news-updated-at', cached.savedAt);
                return;
            }

            renderStatus(container, 'error-message', siteConfig.messages.newsError);
        }
    }

    loadNews();
})();
