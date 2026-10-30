(function () {
    const SITE_CONFIG = {
        siteName: 'みうらの釣りえさ屋',
        siteUrl: 'https://xn--p8je3b2frdvci4270g512e.com/',
        description:
            '神奈川県三浦市で営業中の釣りエサ専門店。早朝営業、鮮度抜群のエサを取り揃えています。',
        address: '神奈川県三浦市三崎5丁目12-3 THE OCEAN VIEW miura 2階',
        image: {
            productWidth: 300,
            productHeight: 300,
        },
        api: {
            timeoutMs: 15000,
            news: 'https://script.google.com/macros/s/AKfycbx6bzcZ7HHwRWh9ieGrWiGTx2khsOUKXPhUNATQF2n3KThDLDILUCn8R-FGrrjm3DrzzQ/exec',
            menus:
                'https://script.google.com/macros/s/AKfycbyrCy6zydNo59xmisnkwkDsx4TIC6AY_LNhrzCpA-SZspYWe_cLwIWHEN0VmFnP5yls-w/exec',
        },
        categories: [
            { id: 'ダンゴ', label: 'ダンゴ', group: 'エサの種類' },
            { id: 'オキアミ', label: 'オキアミ', group: 'エサの種類' },
            { id: '魚', label: '魚', group: 'エサの種類' },
            { id: 'エビ', label: 'エビ', group: 'エサの種類' },
            { id: 'サビキ', label: 'サビキ', group: 'エサの種類' },
            { id: '魚かし', label: '魚かし', group: 'メーカー' },
            { id: '練餌海道', label: '練餌海道', group: 'メーカー' },
            { id: '本多商店', label: '本多商店', group: 'メーカー' },
            { id: '福吉', label: '魚餌研究所 福吉', group: 'メーカー' },
            { id: '活エサ', label: '活エサ', group: 'エサの種類' },
            { id: 'その他', label: 'その他', group: 'その他' },
        ],
        messages: {
            newsLoading: '新着情報を読み込み中です。',
            newsEmpty: '現在お知らせはありません。',
            newsError: '新着情報を読み込めませんでした。通信状況を確認して、もう一度お試しください。',
            newsFallback: '最新の新着情報を取得できなかったため、前回保存した内容を表示しています。',
            menusEmpty: '現在掲載商品はありません。',
            menusError: '商品一覧を読み込めませんでした。通信状況を確認して、もう一度お試しください。',
            menusFallback: '最新の商品一覧を取得できなかったため、前回保存した内容を表示しています。',
            updatedAtPrefix: '情報取得日時',
        },
        storageKeys: {
            newsCache: 'miura-bait-shop-news-cache',
            menusCache: 'miura-bait-shop-menus-v2-cache',
            clientLogs: 'miura-bait-shop-client-logs',
        },
        observability: {
            logEndpoint: '',
            maxStoredLogs: 30,
        },
        seo: {
            localBusiness: {
                '@context': 'https://schema.org',
                '@type': 'Store',
                name: 'みうらの釣りえさ屋',
                image: 'https://xn--p8je3b2frdvci4270g512e.com/icon.png',
                url: 'https://xn--p8je3b2frdvci4270g512e.com/',
                description:
                    '神奈川県三浦市で営業中の釣りエサ専門店。早朝営業、鮮度抜群のエサを取り揃えています。',
                address: {
                    '@type': 'PostalAddress',
                    addressCountry: 'JP',
                    addressRegion: '神奈川県',
                    addressLocality: '三浦市三崎',
                    streetAddress: '5丁目12-3 THE OCEAN VIEW miura 2階',
                },
                areaServed: '神奈川県三浦市',
                sameAs: ['http://www.miura-kaiou.com/'],
            },
        },
    };

    function safeParse(value) {
        if (!value) {
            return null;
        }

        try {
            return JSON.parse(value);
        } catch (error) {
            return null;
        }
    }

    function getStorage() {
        try {
            return window.localStorage;
        } catch (error) {
            return null;
        }
    }

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

    function normalizeInlineSpacing(value) {
        return String(value)
            .replace(/\u3000/g, ' ')
            .replace(/[ \t]+/g, ' ')
            .trim();
    }

    function normalizeUnicodeWidth(value) {
        return String(value).normalize('NFKC');
    }

    function normalizeDashVariants(value) {
        return String(value).replace(/[‐‑‒–—―ｰ−－]/g, '-');
    }

    function normalizeWaveVariants(value) {
        return String(value).replace(/[〜～∼∾]/g, '~');
    }

    function normalizeSlashVariants(value) {
        return String(value).replace(/[／⁄∕]/g, '/');
    }

    function normalizeBulletSpacing(value) {
        return String(value).replace(/\s*・\s*/g, '・');
    }

    function normalizeMenuText(value) {
        return normalizeInlineSpacing(
            normalizeBulletSpacing(
                normalizeSlashVariants(
                    normalizeWaveVariants(normalizeDashVariants(normalizeUnicodeWidth(value)))
                )
            )
        );
    }

    function normalizeSearchText(value) {
        return normalizeMenuText(value).toLocaleLowerCase('ja-JP').replace(/[ァ-ヶ]/g, function (char) {
            return String.fromCharCode(char.charCodeAt(0) - 0x60);
        });
    }

    function safeUrl(value) {
        if (typeof value !== 'string' || !value.trim()) return '';
        try {
            const url = new URL(value, window.location.href);
            return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
        } catch (error) {
            return '';
        }
    }

    async function fetchJson(url, timeoutMs = SITE_CONFIG.api.timeoutMs) {
        const controller = new AbortController();
        const timer = setTimeout(function () { controller.abort(); }, timeoutMs);
        try {
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) throw new Error(`Request failed: ${response.status}`);
            return await response.json();
        } finally {
            clearTimeout(timer);
        }
    }

    const SITE_RUNTIME = {
        escapeHtml,
        normalizeInlineSpacing,
        normalizeUnicodeWidth,
        normalizeDashVariants,
        normalizeWaveVariants,
        normalizeSlashVariants,
        normalizeBulletSpacing,
        normalizeMenuText,
        normalizeSearchText,
        safeUrl,
        fetchJson,
        getCache: function (key) {
            const storage = getStorage();
            try {
                return storage ? safeParse(storage.getItem(key)) : null;
            } catch (error) {
                return null;
            }
        },
        setCache: function (key, payload) {
            const storage = getStorage();

            if (!storage) {
                return;
            }

            try {
                storage.setItem(key, JSON.stringify({
                    savedAt: new Date().toISOString(), payload: payload,
                }));
            } catch (error) {
                // A full or disabled cache must not interrupt the visible content.
            }
        },
        formatDateTime: function (value) {
            if (!value) return '';
            const date = new Date(value);

            if (Number.isNaN(date.getTime())) {
                return '';
            }

            return new Intl.DateTimeFormat('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Tokyo',
            }).format(date);
        },
        updateTimestamp: function (elementId, value) {
            const element = document.getElementById(elementId);

            if (!element) {
                return;
            }

            const formatted = SITE_RUNTIME.formatDateTime(value);
            element.textContent = formatted
                ? `${SITE_CONFIG.messages.updatedAtPrefix}: ${formatted}`
                : '';
        },
        recordClientEvent: function (type, detail) {
            const entry = {
                type: type,
                detail: detail || {},
                path: window.location.pathname,
                timestamp: new Date().toISOString(),
            };
            const storage = getStorage();

            if (storage) {
                try {
                    const parsed = safeParse(storage.getItem(SITE_CONFIG.storageKeys.clientLogs));
                    const existing = Array.isArray(parsed) ? parsed : [];
                    existing.push(entry);
                    storage.setItem(SITE_CONFIG.storageKeys.clientLogs,
                        JSON.stringify(existing.slice(-SITE_CONFIG.observability.maxStoredLogs)));
                } catch (error) {
                    // Diagnostics must never prevent recovery from the original error.
                }
            }

            if (SITE_CONFIG.observability.logEndpoint && navigator.sendBeacon) {
                try {
                    navigator.sendBeacon(
                        SITE_CONFIG.observability.logEndpoint,
                        JSON.stringify(entry)
                    );
                } catch (error) {
                    console.warn('Failed to send beacon.', error);
                }
            }
        },
    };

    window.SiteConfig = SITE_CONFIG;
    window.SiteRuntime = SITE_RUNTIME;
})();
