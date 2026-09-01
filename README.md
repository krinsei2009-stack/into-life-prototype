# Into life prototype

既存のユーザー向け診断体験を維持しながら、ユーザーネームだけで始められるローカルゲスト体験と、Supabaseで保護された `/admin/` の運営画面を備えた静的Webアプリです。

## 構成

- `/index.html` — ユーザー向け画面。ユーザーネームを端末内に保存して、メールアドレス・登録・ログインなしで開始します。
- `/admin/index.html` — 管理者向け画面。ユーザー一覧、ミッションの作成・編集・削除、status変更、公開切替ができます。
- `/supabase/schema.sql` — テーブル、enum、Auth連携トリガー、RLSポリシー。
- `/config.js` — ブラウザ用Supabase接続設定。

## Supabaseセットアップ

1. Supabaseでプロジェクトを作成します。
2. SQL Editorで `supabase/schema.sql` を実行します。
3. Authentication > ProvidersでEmailを有効にします。開発中にメール確認を省略する場合は、Email providerのConfirm emailをオフにします。
4. `config.example.js` を参考に `config.js` へProject URLとanon keyを設定します。
5. Supabase AuthenticationのUsers画面から最初の運営アカウントを作成します。
6. SQL Editorで次を一度実行し、そのアカウントを管理者にします。

```sql
update public.profiles
set role = 'admin'
where email = 'admin@example.com';
```

管理画面は `profiles` の直接取得ではなく、RLSポリシーと共通の `public.is_admin()` 関数で権限を判定します。既存プロジェクトで古いSQLを適用済みの場合は、更新後の `supabase/schema.sql` にある `create or replace function public.is_admin()` から `grant execute` までの部分をSQL Editorで再実行してください。

`permission denied for table missions` または `profiles` が表示される既存プロジェクトでは、SQL Editorで次も実行してください。テーブル操作の入口となる権限だけを付与し、参照・変更可能な行は引き続きRLSが制限します。

```sql
revoke all on table public.profiles from anon;
revoke all on table public.missions from anon;
grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.missions to authenticated;
```

ブラウザに置くのはanon keyだけです。`service_role` keyは絶対に `config.js` やGitへ保存しないでください。

## ローカル起動

ES Modulesを使わない静的構成ですが、`/admin/` のパス解決を本番と揃えるためWebサーバー経由で開いてください。

```bash
python3 -m http.server 8080
```

- ユーザー画面: http://localhost:8080/
- 管理画面: http://localhost:8080/admin/

## デプロイ構成

- Frontend: Vercel（リポジトリ直下を静的サイトとして配信）
- Database / Auth: Supabase
- Source: GitHub `krinsei2009-stack/into-life-prototype`

VercelプロジェクトをGitHubの `main` ブランチへ接続すると、push後に自動デプロイできます。Build Commandは不要、Output Directoryはリポジトリ直下のままです。`config.js` は静的配信に必要なPublishable key専用ファイルとしてcommitします。Secret keyやservice_role keyは設定しないでください。

Productionへ切り替える前に、Vercelの本番URLと必要なPreview URLをSupabase AuthenticationのRedirect URLsへ登録してください。

ユーザー画面では、気分・刺激・未知度・人との距離・使える時間の5問とユーザーネーム入力のあと、架空イベント30件の内部候補から相性の高い3件だけを匿名の休日案として提示します。各案には正式タイトルの代わりに「ものづくり・創作」などの活動カテゴリと、「汚れてもよい服装」など参加判断に必要な注意を表示します。ユーザーが1件を選ぶと、そのミッションの段階公開画面へ進みます。一般ユーザーに30件の比較一覧は表示しません。回答・ユーザーネーム・選択結果は `localStorage` にだけ保存されます。現在のゲストモードはSupabaseへ接続せず、管理画面だけがSupabase AuthとRLSで保護されたデータへ接続します。

ユーザー画面は「Hide the experience. Show the journey.」を原則に、体験名・正式会場・詳細説明をstatus到達前にはDOMへ生成しません。最小MVPではプロフィール統計、履歴、進行バー、秒単位カウントダウン、初回チュートリアルを表示しません。選択後に見せるのはミッション、日時、エリア、status、次の公開と、その瞬間に必要なCTAだけです。「現在の情報」は日時・場所・準備の3行に限定しています。

Supabase AuthenticationのURL Configurationには、本番URLに加え必要に応じて `http://localhost:8080` を追加してください。

## ミッションの表示ルール

以下は、将来ユーザー側の匿名Authまたは本登録を有効にしてSupabaseのミッション配信を再接続するときの表示ルールです。現在は `assets/event-catalog.js` の架空イベント30件を、事前アンケートとの相性順で表示します。

| status | ユーザーに表示する情報 |
| --- | --- |
| `locked` | MISSION番号、日時、安全・準備情報、大まかなエリア。正式名称・ヒント・会場・内容は非表示 |
| `hint` | 上記＋抽象化したCLUE。ユーザーが「CLUEを見る」を押して開封 |
| `location_revealed` | 上記＋最寄り・正式集合場所。ユーザーが「集合場所を見る」を押して開封 |
| `revealed` | 上記＋正式タイトル・詳細。ユーザーが「ミッションを開封する」を押して開封 |
| `completed` | 本人の完了済みミッションとして正式タイトル・内容・フィードバックを表示 |

`status` は体験の進行段階、`is_published` はユーザー画面に出すかどうかです。この2つを分離することで、作成途中のミッションや公開停止も安全に扱えます。

ローカルMVPでは5状態の表示確認用に `?mission_state=locked`、`hint`、`location_revealed`、`revealed`、`completed` を利用できます。このパラメータはデモ表示専用で、Supabaseには書き込みません。

## セキュリティ

- 現在のローカルゲスト画面はSupabaseテーブルへアクセスしません。
- ユーザー側のデータ接続を再び有効にする場合も、Row Level Securityにより自分に割り当てられた公開済みミッションだけを参照させます。
- 管理画面のCRUDは `profiles.role = 'admin'` のユーザーだけに許可されます。
- 一般ユーザーからのrole変更やミッション更新は許可していません。
