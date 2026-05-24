# TODO

## Remaining Checks

- GitHub Pages 上で実画面確認を行う
- モバイル表示でナビ開閉とドロップダウン挙動を確認する
- アンカーリンクとスクロールトップボタンの動作を確認する
- `news.js` の新着情報取得が本番ドメインで正常表示されるか確認する
- `menus.js` の商品一覧取得が本番ドメインで正常表示されるか確認する
- 不要化できる `docs/assets/css/style.css` 依存を段階的に `docs/assets/css/site.css` へ移す
- `index.html` に残っているテーマ由来クラスを、必要ならサイト専用クラスへ置き換える
- 画面確認後に未使用の theme CSS セレクタと vendor 資産をさらに削減する

## Done

- GitHub Pages 前提の静的構成に整理
- `docs/index.html` の大きなインライン依存を削減
- サイト専用スタイルを `docs/assets/css/site.css` に分離
- 使っていない theme / plugin script の読み込みを削減
- `docs/assets/js/main.js` をページ専用の最小構成へ整理
- `docs/src/news.js` にエラー表示、キャッシュ、更新時刻表示を追加
- `docs/src/menus.js` にエラー表示、キャッシュ、更新時刻表示を追加
- `docs/src/site-config.js` で API、文言、カテゴリ、SEO 設定を集約
- `LocalBusiness` / `Store` の JSON-LD を追加
- スキップリンク、`aria-live`、`aria-expanded` などのアクセシビリティ改善を追加
- `docs/404.html` を追加して 404 到達時の記録導線を追加
- コピーライトをフッターに追加
- `file://` 直開きではなくローカルサーバー経由で確認する前提を README に追記
- カテゴリ別えさ一覧は静的 HTML を基準に戻して、壊れにくい構成へ修正
- `news.js` と `menus.js` をグローバル衝突しない構成へ修正

## Notes

- 現在の公開ルートは `docs/`
- カスタムドメインは `docs/CNAME`
- データ取得元は `docs/src/site-config.js` と各 `docs/src/*.js` に定義
- 既存仕様は維持したまま、UI / UX と保守性を先に改善済み
- カテゴリ UI は静的 HTML、商品データだけ JS で注入する方針
