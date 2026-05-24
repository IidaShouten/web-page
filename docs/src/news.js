const NEWS_API_URL =
    'https://script.google.com/macros/s/AKfycbx6bzcZ7HHwRWh9ieGrWiGTx2khsOUKXPhUNATQF2n3KThDLDILUCn8R-FGrrjm3DrzzQ/exec';

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

    renderStatus(container, 'status-message', '新着情報を読み込み中です。');

    try {
        const response = await fetch(NEWS_API_URL);

        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }

        const list = await response.json();

        if (!Array.isArray(list) || list.length === 0) {
            renderStatus(container, 'empty-message', '現在お知らせはありません。');
            return;
        }

        const ordered = list.slice().reverse();
        container.innerHTML = renderNewsItems(ordered);
    } catch (error) {
        console.error('Failed to load news.', error);
        renderStatus(
            container,
            'error-message',
            '新着情報の取得に失敗しました。時間をおいて再度ご確認ください。'
        );
    }
}

loadNews();
