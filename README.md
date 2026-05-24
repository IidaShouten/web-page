# みうらの釣りえさ屋ホームページ

GitHub Pages で公開している静的サイトです。公開ルートは `docs/` です。

## 公開構成

- `docs/index.html`
  サイト本体の HTML
- `docs/src/news.js`
  新着情報の取得と描画
- `docs/src/menus.js`
  商品一覧の取得と描画
- `docs/assets/css/site.css`
  このサイト専用の UI / UX 調整
- `docs/assets/css/style.css`
  既存テーマ由来のスタイル
- `docs/assets/js/main.js`
  このサイトで実際に使っている最小限の挙動
- `docs/assets/lib/`
  ベンダー資産。原則として直接編集しない
- `docs/CNAME`
  GitHub Pages のカスタムドメイン
- `_config.yml`
  GitHub Pages / Jekyll の設定

## 更新時に主に触る場所

### 文言や構成を変える

- `docs/index.html`

### 見た目を変える

- まず `docs/assets/css/site.css` を触る
- 既存テーマ側の修正が本当に必要な場合だけ `docs/assets/css/style.css` を触る

### 新着情報の表示を変える

- `docs/src/news.js`

### 商品一覧の表示を変える

- `docs/src/menus.js`

## データ取得元

このサイトは公開時にビルドして商品や新着情報を埋め込む方式ではなく、ブラウザ上で Google Apps Script の API から取得して描画します。

### 新着情報

- `docs/src/news.js`

取得元:

- `https://script.google.com/macros/s/AKfycbx6bzcZ7HHwRWh9ieGrWiGTx2khsOUKXPhUNATQF2n3KThDLDILUCn8R-FGrrjm3DrzzQ/exec`

### 商品一覧

- `docs/src/menus.js`

取得元:

- `https://script.google.com/macros/s/AKfycbyrCy6zydNo59xmisnkwkDsx4TIC6AY_LNhrzCpA-SZspYWe_cLwIWHEN0VmFnP5yls-w/exec`

## 商品カテゴリ

現在の表示順は以下です。

1. 魚
2. 魚かし
3. ダンゴ
4. オキアミ
5. 練餌海道
6. 活エサ
7. エビ
8. サビキ
9. 本多商店
10. 福吉
11. その他

カテゴリの描画順を変更したい場合は `docs/src/menus.js` の `CATEGORY_ORDER` を更新します。

## ローカル確認

GitHub Pages と同じく、`docs/` をそのまま静的配信して確認します。

例:

```bash
cd docs
python3 -m http.server 4000
```

ブラウザで `http://localhost:4000` を開いて確認します。

## 確認ポイント

- ページが開く
- ナビゲーションのアンカーリンクが動く
- スマホ表示でメニュー開閉が動く
- 新着情報が表示される
- 商品一覧が各カテゴリに表示される
- 外部リンクが正しく開く
- 画像のパス切れがない

## 運用メモ

- GitHub Pages の公開対象は `docs/` を前提にする
- `docs/assets/lib/` は古いテーマ由来の資産を含むため、削除や差し替えは実際の画面確認を前提に行う
- 見た目の調整は、まず `site.css` に寄せて進める
