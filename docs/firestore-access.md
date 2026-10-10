# 患者情報を取得できない場合

## 今回確認できた原因

公開中のルールは `request.time < timestamp.date(2025, 8, 14)`。
この期限後は、ログインしていてもFirestoreへの読み書きが拒否される。
ログインの失敗やPDFの不具合ではなく、Firestoreのアクセス条件の期限切れ。

アプリと `.firebaserc` の接続先は `electronic-medical-recor-6ccac` で一致。
アプリはこのプロジェクトの `(default)` データベースから `patients` を読む。

## 公開するルールの準備

`firestore.rules` に必要なコレクションだけを許可するルールを用意した。
利用者から指定された院内スタッフUIDを設定済み。ローカルで準備済みだが、Firebase側へはまだ公開していない。

1. 同じプロジェクトのFirebase Consoleで **Authentication > Users** を開く。
2. 許可するスタッフアカウントの **ユーザーUID** を確認する。メールアドレス・パスワード・患者IDではない。
3. `isClinicStaff()` のUID一覧に、許可するスタッフUIDだけが含まれていることを確認する。スタッフを追加する場合もここを編集して再公開する。

例（例示用UIDは実際のUIDに置き換える）:

```text
return request.auth != null && request.auth.uid in [
  '実際のスタッフUID'
];
```

ルールは患者とその履歴・診療記録、予約、予約用院内設定の読み取り・作成・更新を許可する。
患者番号の自動採番用カウンタ・番号台帳も対象。発行済み番号は変更できず、新規患者作成は採番と同一トランザクションで行う。
新規登録は最新版ルールの再公開が必要。詳細は `chart-and-patient-number.md` を参照。
その他のパスとクライアントからの削除は拒否する。予約の取消は削除ではなく状態更新なので利用可能。
ログインした全アカウントを自動的に院内スタッフとして扱わない。

## Firebase Consoleでの反映と確認

1. **Firestore Database > ルール** で編集する。
2. ルールのシミュレーターで、Authenticationを有効にし、設定したスタッフUIDによる `/patients/任意のドキュメントID` の読み取りを確認する。
3. 同じパスが未認証・未許可UIDでは拒否されることを確認する。
4. UIDを設定済みのルールを公開する。
5. アプリの患者一覧で **再読み込み**、またはブラウザーを再読み込みする。
6. 患者一覧、患者の編集・登録、予約の取得・設定保存を確認する。

`firebase.json` にFirestoreルールのファイルを登録済み。Firebase CLIでログイン済みの環境では次のコマンドで、ルールだけを公開できる。

```powershell
firebase deploy --only firestore:rules --project electronic-medical-recor-6ccac
```

この環境には接続されたFirebase Consoleのブラウザーがなく、公開操作・実環境でのアクセス確認は行っていない。ローカル検証用のCLI・Javaを `tmp/firebase-qa` に用意した。エミュレーター検証方法は `visit-history-and-payments.md` を参照。
公開済みルールが認証・アクセス判定の本体であり、フロントエンドの再ビルドだけでは期限切れは解消しない。

公式資料:
- https://firebase.google.com/docs/firestore/security/rules-conditions
- https://firebase.google.com/docs/rules/simulator

## アプリのエラー表示

患者情報の取得エラーはコードを保持し、権限拒否・認証失敗・接続不良・利用上限・設定エラーを区別する。
開発者コンソールにはエラーコード、プロジェクトID、データベース、コレクション、ログイン有無だけを記録する。
患者情報、メールアドレス、UID、認証トークン、エラー本文は記録しない。

再読み込みで購読を作り直す。拒否された際は以前取得した患者を消し、ログアウト・アカウント変更後の古い購読も反映しない。
