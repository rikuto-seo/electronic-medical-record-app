# ローカルでの起動と確認

PowerShellでは `npm.ps1` が実行ポリシーで止まる場合があるため、以下では `npm.cmd` を使います。

```powershell
npm.cmd install
npm.cmd run typecheck
npm.cmd start
```

開発サーバーは通常 http://localhost:3000 で起動します。既存のFirebaseアカウントでログインしてください。

```powershell
npm.cmd run build
```

`typecheck` は型チェックのみ、`build` は本番用ファイルを `build` に生成します。

フォーム検証はTypeScript 4.9と互換性のある `@hookform/resolvers` 3.10.0を使用します。
病理学の本文・目次は未登録のため、そのページには「準備中」と表示します。

大量のMDXと解剖データによるディスク容量不足を避けるため、Webpackのキャッシュは無効にしています。
起動を妨げない既存のESLint警告は残っています。
