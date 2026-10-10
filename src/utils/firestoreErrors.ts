/** Keep error codes for troubleshooting, without exposing payloads or auth tokens. */
export const firebaseErrorCode = (error: unknown): string => {
  if (!error || typeof error !== 'object' || !('code' in error)) return 'unknown';
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' && /^[a-z][a-z/-]{0,79}$/.test(code) ? code : 'unknown';
};

export const patientReadErrorMessage = (error: unknown): string => {
  const code = firebaseErrorCode(error).replace(/^firestore\//,'');
  const messages: Record<string,string> = {
    'permission-denied': '患者情報の読み取り権限が拒否されました。Firestoreのルールとログイン中のスタッフの権限をご確認ください。',
    unauthenticated: '患者情報を取得するための認証を確認できません。ログインし直してから再読み込みしてください。',
    unavailable: '患者情報のサーバーに接続できません。インターネット接続を確認して再読み込みしてください。',
    'deadline-exceeded': '患者情報の取得がタイムアウトしました。接続を確認して再読み込みしてください。',
    'resource-exhausted': '患者情報の取得がサービスの利用上限に達しました。Firebaseの使用状況をご確認ください。',
    'failed-precondition': '患者情報の取得に必要なサーバー設定を確認できません。FirebaseのFirestore設定をご確認ください。',
    'not-found': '患者情報のデータベースが見つかりません。Firebaseの接続先とFirestoreデータベースをご確認ください。',
  };
  return `${messages[code] ?? '患者情報を取得できません。接続とFirebaseの設定をご確認ください。'}（エラーコード: ${code}）`;
};
