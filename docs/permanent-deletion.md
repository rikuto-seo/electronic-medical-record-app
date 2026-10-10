# 確認付きの完全削除

## 操作と範囲

削除ボタンを押すと、対象と削除範囲を表示する確認画面を一度挟む。「削除しない」で戻り、「完全に削除する」で実行する。処理中は再送・閉じる操作を止め、失敗時はエラーを表示して再試行できる。

- 患者一覧／患者ページの「患者を完全削除」：患者の基本情報、全カルテと任意の下位コレクション、予約・来院、請求・入金・返金、アプリが保存した患者配下の添付ファイル。
- 来院履歴の「この来院を完全削除」：その来院・予約、変更履歴、請求・支払い、その予約IDに紐付いたカルテと添付ファイル。未連携の旧カルテは日付だけで推測して削除しない。
- 支払い明細の「明細を完全削除」：選んだ入金／返金の1明細。合計はリアルタイムで再集計する。お金の決済・返金操作ではない。
- カルテの「カルテを完全削除」：そのカルテと添付ファイル、対応する来院タイムライン。予約・請求・支払いは残す。

確認済みの完全削除は復元できない。アプリ外に保存したPDF、会員カード、外部サービス上のファイルは削除対象に含まれない。
患者番号は再使用しないため、番号台帳には患者IDを除いた `{retired:true}` だけを残す。患者の氏名・カルテ・支払いのコピーや削除履歴は残さない。

## サーバー処理

`functions/permanentDeletion.js` の処理を `permanentlyDeleteClinicData` callableとして東京リージョンに公開する。
Firebase Authenticationの認証情報から指定済み院内スタッフUIDを確認する。削除対象のID、確認フラグ、患者との一致、表示時の患者・予約・支払いを検証する。
通常の編集では保存済み明細を改変できないルールを維持し、完全削除はサーバー側でだけ実行する。

患者・来院・カルテの削除では一時的に患者の編集をロックし、添付ファイル→関連履歴→本体の順で削除する。中断時は同じ対象の削除を再実行して続行できる。他の対象を削除する処理は上書きしない。
未知の下位コレクションも再帰的に削除し、500件を超える履歴にも対応する。
古い `deleteOldCheckedInReservations` は、同じエクスポートを維持して削除しない処理へ置き換えた。これも再公開して旧処理を停止する必要がある。

## Firebaseへの公開

今回の追加はCloud FunctionsとFirestore・Storageルールの公開が必要。フロントエンド更新だけでは完全削除できない。
CLIで対象プロジェクトにログイン済みの環境から実行する。

```powershell
firebase deploy --only firestore:rules,storage,functions:permanentlyDeleteClinicData,functions:deleteOldCheckedInReservations --project electronic-medical-recor-6ccac
```

Firestoreルールは削除中の患者・予約の編集、Storageルールは患者不在／削除中の添付アップロードを拒否する。
ルールと関数をセットで公開し、架空患者で確認画面の取消、入金1件の削除、来院1回の削除、患者全体の削除を確認する。
この作業では実データの削除を行っていない。Firebase Consoleの接続と本番公開は別途必要。

## ローカル検証

アプリテスト110件、通常の保存・アクセスルール26項目、完全削除19項目を確認した。
完全削除の検証は `demo-clinic-qa` のFirestore・Storageエミュレーターだけを使用し、実患者データに接続しない。
確認画面の取消・連打防止・失敗後の再試行、別患者の保護、古い表示内容の拒否、添付ファイルの削除、中断後の再開、削除中の編集・アップロード拒否、620件の下位履歴、患者番号の再使用禁止を含む。

`visit-history-and-payments.md` の検証用ツールとJava 21を用意し、検証用設定を次のようにする。

```json
{
  "firestore": { "rules": "firestore.rules" },
  "storage": { "rules": "storage.rules" },
  "emulators": {
    "firestore": { "host": "127.0.0.1", "port": 8088 },
    "storage": { "host": "127.0.0.1", "port": 9198 },
    "ui": { "enabled": false },
    "singleProjectMode": true
  }
}
```

```powershell
npm.cmd install --prefix functions
Copy-Item -LiteralPath firestore.rules -Destination tmp/firebase-qa/firestore.rules
Copy-Item -LiteralPath storage.rules -Destination tmp/firebase-qa/storage.rules
& .\tmp\firebase-qa\node_modules\.bin\firebase.cmd emulators:exec --only firestore,storage --project demo-clinic-qa --config tmp/firebase-qa/firebase.json "node scripts/verify-permanent-deletion.cjs"
```

Firebase CLIにはログイン済みアカウントがなく、本番公開は未実施。接続されたブラウザーがないため、実画面の目視確認も未実施。

公式資料：[Callableの認証](https://firebase.google.com/docs/functions/callable)、[Firestoreの削除と下位コレクション](https://firebase.google.com/docs/firestore/manage-data/delete-data)。
