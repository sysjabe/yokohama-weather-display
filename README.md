# 横浜市 天気ディスプレイ

壁掛けAndroidタブレット＋Fully Kiosk Browserでの常時表示を想定した天気ダッシュボードです。

## GitHub Pagesへの公開手順

1. GitHubで新しいリポジトリを作成します。
   例: `yokohama-weather-display`
2. このZIPを展開し、以下3ファイルをリポジトリ直下へアップロードします。
   - `index.html`
   - `sw.js`
   - `manifest.webmanifest`
3. GitHubのリポジトリで `Settings` → `Pages` を開きます。
4. `Build and deployment` の Source を `Deploy from a branch` にします。
5. Branch を `main`、Folder を `/(root)` にして Save。
6. 数分後、GitHub PagesのURLが表示されます。
7. Androidタブレットの Fully Kiosk Browser の Start URL にそのURLを設定します。

例:
`https://あなたのGitHubユーザー名.github.io/yokohama-weather-display/`

## Fully Kiosk 推奨設定

- Start URL: GitHub Pages のURL
- Launch on Boot: ON
- Fullscreen Mode: ON
- Screen Off Timer: 180～300秒
- Motion Detection: ON
- Turn Screen On on Motion: ON
- JavaScript: ON
- Webview Cache: ON

## この完成版に含まれる機能

- 現在気温
- 現在天気
- 今日の最高 / 最低
- 湿度
- 今日の最大降水確率
- 3時間刻みの今後4枠
- 明日の最高 / 最低
- 時計・日付
- 10分ごとの自動更新
- 画面復帰時の即時更新
- API取得10秒タイムアウト
- 最終取得データをlocalStorageへ保存
- 通信断時は保存済み天気を表示
- 最終取得時刻を表示
- Service Workerで画面自体もオフラインキャッシュ
- 横画面 / 縦画面対応

## 天気データ

Open-Meteo Forecast APIを利用しています。APIキーは不要です。

## 位置

横浜市中心部付近の座標を使っています。

- 緯度: 35.4437
- 経度: 139.6380

個人宅の詳細位置は使っていません。

## 補足

iPhoneのファイルプレビューやChatGPT内のHTMLプレビューではJavaScriptが実行されない場合があります。
GitHub Pagesのように `https://` で配信すると正常動作します。
