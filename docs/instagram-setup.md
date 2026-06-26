# Instagram Feed Setup

The site fetches the latest posts from [@earthas_emporium](https://www.instagram.com/earthas_emporium/) at build time using Meta's Instagram Graph API. Posts are rendered as static HTML — no tokens are exposed to the browser.

## Prerequisites

1. **Business or Creator account** — [@earthas_emporium](https://www.instagram.com/earthas_emporium/) must be converted from a personal account:
   - Instagram app → Settings → Account → Switch to professional account
   - Choose Business or Creator

2. **Linked Facebook Page** — The Instagram account must be connected to a Facebook Page:
   - Instagram app → Settings → Account → Linked accounts → Facebook
   - Or link via [Meta Business Suite](https://business.facebook.com/)

3. **Meta Developer account** — Create one at [developers.facebook.com](https://developers.facebook.com/)

## Step 1: Create a Meta App

1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps)
2. Create App → use case: **Other** → type: **Business**
3. Add the **Instagram Graph API** product to your app

## Step 2: Get a Page Access Token

1. Open [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app from the dropdown
3. Click **Generate Access Token**
4. Grant permissions: `instagram_basic`, `pages_show_list`, `pages_read_engagement`
5. Query `/me/accounts` to find your Page's access token:
   ```
   GET /me/accounts
   ```
6. Copy the `access_token` for the Page linked to @earthas_emporium

For production, extend to a long-lived token via the [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/) (click **Extend Access Token**).

## Step 3: Get the Instagram User ID

Using your Page access token, query:

```
GET /{page-id}?fields=instagram_business_account
```

The response includes:

```json
{
  "instagram_business_account": {
    "id": "17841400000000000"
  }
}
```

Copy that `id` value — this is your `INSTAGRAM_USER_ID`.

## Step 4: Verify the Feed Endpoint

Test that posts are accessible:

```
GET /{instagram-user-id}/media?fields=id,caption,media_type,media_url,permalink,timestamp&limit=6&access_token={page-access-token}
```

You should see a `data` array with recent posts.

## Step 5: Add Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

```
INSTAGRAM_ACCESS_TOKEN=your_page_access_token_here
INSTAGRAM_USER_ID=your_instagram_business_account_id_here
```

Rebuild the site:

```bash
pnpm build
```

## Deployment

Add the same two variables to your hosting platform's environment/secrets settings (e.g. Cloudflare Pages, Netlify, Vercel). They are only used at build time.

## Keeping Posts Fresh

The feed is baked into the static build. To show new Instagram posts:

- **Manual:** Redeploy after posting, or run `pnpm build && pnpm preview` locally
- **Scheduled:** Set up a cron job or GitHub Action to trigger a rebuild every few days (optional)

For a market vendor posting a few times per week, redeploying after market days is usually enough.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Empty feed, no errors | Check that `INSTAGRAM_USER_ID` is the Instagram business account ID, not the Facebook Page ID |
| `(#10) Application does not have permission` | Regenerate token with `instagram_basic` permission |
| `(#190) Invalid OAuth access token` | Token expired — generate a new long-lived Page access token |
| Fallback shown in production | Env vars not set on the deployment platform |

When credentials are missing or invalid, the site shows a "Follow on Instagram" fallback instead of breaking the build.
