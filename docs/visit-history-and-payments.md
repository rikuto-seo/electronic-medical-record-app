# 来院履歴・請求・入金・返金

## 院内での操作

患者一覧で氏名または「来院・支払い履歴」を押すと、患者ページの「来院・カルテ履歴」が開く。
来院回数、入金総額、返金総額、差引支払総額、予約・来院履歴、個別の支払い明細を確認できる。
各回の「この回のカルテを確認」を開くと、予約IDで紐付いた診療記録を表示する。記録の編集とPDF出力も利用できる。
「予約・支払いを開く」は対象日の予約ページに移動し、その予約の編集画面を開く。
予約と未連携の旧カルテは別枠に表示する。日付の一致だけで自動的に紐付けない。

予約の「予約・支払い」では次を入力する。

- 請求額：未入力と0円を区別する。請求額だけでは支払総額に加算しない。
- 入金・返金：区分、金額、支払日時、方法、メモを入力し「明細に追加」。最後に「変更を保存」または「予約を登録」で確定する。
- 保存前の明細は取り消せる。入力中の金額を明細に追加せず保存しようとすると案内を表示する。
- 通常の編集では保存済み明細を変更・削除できない。訂正は返金または入金の明細を追加して行う。新たな返金は残っている入金残高まで。
- 患者ページの「明細を完全削除」では、確認後にサーバー経由で保存済みの明細を削除できる。来院・カルテ・患者全体の完全削除も追加した。操作と公開手順は [permanent-deletion.md](permanent-deletion.md) を参照。

キャンセルは予約データを削除しない。状態・予約日時・メニュー等の変更を履歴に追加し、予約を再開しても過去のキャンセルと理由を残す。
この更新前に上書きされて失われたキャンセルや理由は復元できない。旧予約の初回更新では現在の内容を履歴の基点にする。
次回予約を複製したときは、入金・返金・変更履歴を引き継がない。

## 保存・アクセス

`reservations/{id}` に `feeAmount`、`payments`、`statusHistory` を追加。既存の予約・カルテのIDは維持する。
保存済み予約の患者変更を禁止し、別患者の支払いとして扱われないようにする。
同時編集時は最新状態の再取得と更新日時の照合を行う。新規予約は画面ごとに固定のIDを使い、登録再送による二重予約・二重入金を防ぐ。
履歴の取得失敗時は集計を0円と表示せず、エラーと再読み込み操作を表示する。

最新の `firestore.rules` を Firebase Console の **Firestore Database > ルール** に貼り付けて公開する。
番号発行の保護に加え、保存済み支払い・変更履歴の削除や改変、予約の患者変更を拒否するルールを追加した。
ローカルのルール更新だけではクラウド側に反映されない。今回の作業では実プロジェクトへの公開は行っていない。

## UI

`src/styles/ui.css` を最後に読み込み、管理画面・学習画面・ログイン画面の色、ボタン、入力欄、フォーカス表示を共通化した。
移動用リンクはボタンの外観を持つリンクとして残し、キーボード操作や別タブで開く操作を維持する。
カルテ、予約、新規登録、患者一覧、カード・PDF画面、解剖・病理・生理画面に適用する。

## ローカルFirestore検証

実データを使わず `demo-clinic-qa` のエミュレーターで `scripts/verify-firestore-rules.cjs` を実行する。
権限、採番トランザクションの同時実行、番号・保存済み支払いの不変性、キャンセルと復帰、旧予約の更新、実装済み保存サービスの一連の操作を検証する。
今回の確認結果：型チェック、104件のアプリテスト、26項目のFirestore検証、架空データのPDF生成・ページ内の文字と余白確認を通過。接続されたブラウザーがないため、実画面の目視確認と実プロジェクトへの公開は未実施。
Java 21、Node.js、Firebase CLI が必要。今回の検証用ツールは git 管理対象外の `tmp/firebase-qa` に用意した。

```powershell
npm.cmd install --prefix tmp/firebase-qa --no-save --no-package-lock firebase-tools@15.33.0 @firebase/rules-unit-testing@4.0.1 firebase@11.10.0
# Java 21 の bin が PATH にある状態で実行する。
Copy-Item -LiteralPath firestore.rules -Destination tmp/firebase-qa/firestore.rules
```

`tmp/firebase-qa/firebase.json` は次の内容にする。

```json
{
  "firestore": { "rules": "firestore.rules" },
  "emulators": {
    "firestore": { "host": "127.0.0.1", "port": 8088 },
    "ui": { "enabled": false },
    "singleProjectMode": true
  }
}
```

```powershell
& .\tmp\firebase-qa\node_modules\.bin\firebase.cmd emulators:exec --only firestore --project demo-clinic-qa --config tmp/firebase-qa/firebase.json "node scripts/verify-firestore-rules.cjs"
```

公式資料：[ルールのエミュレーターテスト](https://firebase.google.com/docs/firestore/security/test-rules-emulator)、[デモプロジェクトの説明](https://firebase.google.com/docs/emulator-suite/connect_firestore)。
