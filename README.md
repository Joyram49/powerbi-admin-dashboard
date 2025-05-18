# tiny-t3-turbo

> [!NOTE]
>
> NextAuth setup now works for Expo app!

> [!NOTE]
>
> OAuth deployments are now working for preview deployments. Read [deployment guide](https://github.com/tinycor/tiny-t3-turbo#auth-proxy) and [check out the source](./apps/auth-proxy) to learn more!

## Installation

> [!NOTE]
>
> Make sure to follow the system requirements specified in [`package.json#engines`](./package.json#L4) before proceeding.

To initialize an app using the `tiny-t3-turbo` starter, you use Turbo's CLI to init your project (use PNPM as package manager):

```bash
npx create-turbo@latest -e https://github.com/tinycor/tiny-t3-turbo
```

## About

Ever wondered how to migrate your T3 application into a monorepo? Stop right here! This is the perfect starter repo to get you running with the perfect stack!

It uses [Turborepo](https://turborepo.org) and contains:

```text
.github
  └─ workflows
        └─ CI with pnpm cache setup
.vscode
  └─ Recommended extensions and settings for VSCode users
apps
  ├─ auth-proxy
  |   ├─ Nitro server to proxy OAuth requests in preview deployments
  |   └─ Uses Auth.js Core
  ├─ expo
  |   ├─ Expo SDK 51
  |   ├─ React Native using React 18
  |   ├─ Navigation using Expo Router
  |   ├─ Tailwind using NativeWind
  |   └─ Typesafe API calls using tRPC
  └─ next.js
      ├─ Next.js 14
      ├─ React 18
      ├─ Tailwind CSS
      └─ E2E Typesafe API Server & Client
packages
  ├─ api
  |   └─ tRPC v11 router definition
  ├─ auth
  |   └─ Authentication using next-auth.
  ├─ db
  |   └─ Typesafe db calls using Drizzle & Supabase
  └─ ui
      └─ Start of a UI package for the webapp using shadcn-ui
tooling
  ├─ eslint
  |   └─ shared, fine-grained, eslint presets
  ├─ prettier
  |   └─ shared prettier configuration
  ├─ tailwind
  |   └─ shared tailwind configuration
  └─ typescript
      └─ shared tsconfig you can extend from
```

> In this template, we use `@acme` as a placeholder for package names. As a user, you might want to replace it with your own organization or project name. You can use find-and-replace to change all the instances of `@acme` to something like `@my-company` or `@project-name`.

## Quick Start

> **Note**
> The [db](./packages/db) package is preconfigured to use Supabase and is **edge-bound** with the [Vercel Postgres](https://github.com/vercel/storage/tree/main/packages/postgres) driver. If you're using something else, make the necessary modifications to the [schema](./packages/db/src/schema) as well as the [client](./packages/db/src/index.ts) and the [drizzle config](./packages/db/drizzle.config.ts). If you want to switch to non-edge database driver, remove `export const runtime = "edge";` [from all pages and api routes](https://github.com/tinycor/tiny-t3-turbo/issues/634#issuecomment-1730240214).

To get it running, follow the steps below:

### 1. Setup dependencies

```bash
# Install dependencies
pnpm i

# Configure environment variables
# There is an `.env.example` in the root directory you can use for reference
cp .env.example .env

# Push the Drizzle schema to the database
pnpm db:push
```

### 2. Configure Expo `dev`-script

#### Use iOS Simulator

1. Make sure you have XCode and XCommand Line Tools installed [as shown on expo docs](https://docs.expo.dev/workflow/ios-simulator).

   > **NOTE:** If you just installed XCode, or if you have updated it, you need to open the simulator manually once. Run `npx expo start` from `apps/expo`, and then enter `I` to launch Expo Go. After the manual launch, you can run `pnpm dev` in the root directory.

   ```diff
   +  "dev": "expo start --ios",
   ```

2. Run `pnpm dev` at the project root folder.

#### Use Android Emulator

1. Install Android Studio tools [as shown on expo docs](https://docs.expo.dev/workflow/android-studio-emulator).

2. Change the `dev` script at `apps/expo/package.json` to open the Android emulator.

   ```diff
   +  "dev": "expo start --android",
   ```

3. Run `pnpm dev` at the project root folder.

### 3. Configuring Next-Auth to work with Expo

In order to get Next-Auth to work with Expo, you must either:

#### Deploy the Auth Proxy (RECOMMENDED)

In [apps/auth-proxy](./apps/auth-proxy) you can find a Nitro server that proxies OAuth requests. By deploying this and setting the `AUTH_REDIRECT_PROXY_URL` environment variable to the URL of this proxy, you can get OAuth working in preview deployments and development for Expo apps. See more deployment instructions in the [auth proxy README](./apps/auth-proxy/README.md).

By using the proxy server, the Next.js apps will forward any auth requests to the proxy server, which will handle the OAuth flow and then redirect back to the Next.js app. This makes it easy to get OAuth working since you'll have a stable URL that is publically accessible and doesn't change for every deployment and doesn't rely on what port the app is running on. So if port 3000 is taken and your Next.js app starts at port 3001 instead, your auth should still work without having to reconfigure the OAuth provider.

#### Add your local IP to your OAuth provider

You can alternatively add your local IP (e.g. `192.168.x.y:$PORT`) to your OAuth provider. This may not be as reliable as your local IP may change when you change networks. Some OAuth providers may also only support a single callback URL for each app making this approach unviable for some providers (e.g. GitHub).

### 4a. When it's time to add a new UI component

Run the `ui-add` script to add a new UI component using the interactive `shadcn/ui` CLI:

```bash
pnpm ui-add
```

When the component(s) has been installed, you should be good to go and start using it in your app.

### 4b. When it's time to add a new package

To add a new package, simply run `pnpm turbo gen init` in the monorepo root. This will prompt you for a package name as well as if you want to install any dependencies to the new package (of course you can also do this yourself later).

The generator sets up the `package.json`, `tsconfig.json` and a `index.ts`, as well as configures all the necessary configurations for tooling around your package such as formatting, linting and typechecking. When the package is created, you're ready to go build out the package.

## FAQ

### Does the starter include Solito?

No. Solito will not be included in this repo. It is a great tool if you want to share code between your Next.js and Expo app. However, the main purpose of this repo is not the integration between Next.js and Expo — it's the code splitting of your T3 App into a monorepo. The Expo app is just a bonus example of how you can utilize the monorepo with multiple apps but can just as well be any app such as Vite, Electron, etc.

Integrating Solito into this repo isn't hard, and there are a few [official templates](https://github.com/nandorojo/solito/tree/master/example-monorepos) by the creators of Solito that you can use as a reference.

### Does this pattern leak backend code to my client applications?

No, it does not. The `api` package should only be a production dependency in the Next.js application where it's served. The Expo app, and all other apps you may add in the future, should only add the `api` package as a dev dependency. This lets you have full typesafety in your client applications, while keeping your backend code safe.

If you need to share runtime code between the client and server, such as input validation schemas, you can create a separate `shared` package for this and import it on both sides.

## Deployment

### Next.js

#### Prerequisites

> **Note**
> Please note that the Next.js application with tRPC must be deployed in order for the Expo app to communicate with the server in a production environment.

#### Deploy to Vercel

Let's deploy the Next.js application to [Vercel](https://vercel.com). If you've never deployed a Turborepo app there, don't worry, the steps are quite straightforward. You can also read the [official Turborepo guide](https://vercel.com/docs/concepts/monorepos/turborepo) on deploying to Vercel.

1. Create a new project on Vercel, select the `apps/nextjs` folder as the root directory. Vercel's zero-config system should handle all configurations for you.

2. Add your `DATABASE_URL` environment variable.

3. Done! Your app should successfully deploy. Assign your domain and use that instead of `localhost` for the `url` in the Expo app so that your Expo app can communicate with your backend when you are not in development.

### Auth Proxy

The auth proxy is a Nitro server that proxies OAuth requests in preview deployments. This is required for the Next.js app to be able to authenticate users in preview deployments. The auth proxy is not used for OAuth requests in production deployments. To get it running, it's easiest to use Vercel Edge functions. See the [Nitro docs](https://nitro.unjs.io/deploy/providers/vercel#vercel-edge-functions) for how to deploy Nitro to Vercel.

Then, there are some environment variables you need to set in order to get OAuth working:

- For the Next.js app, set `AUTH_REDIRECT_PROXY_URL` to the URL of the auth proxy.
- For the auth proxy server, set `AUTH_REDIRECT_PROXY_URL` to the same as above, as well as `AUTH_DISCORD_ID`, `AUTH_DISCORD_SECRET` (or the equivalent for your OAuth provider(s)). Lastly, set `AUTH_SECRET` **to the same value as in the Next.js app** for preview environments.

Read more about the setup in [the auth proxy README](./apps/auth-proxy/README.md).

### Expo

Deploying your Expo application works slightly differently compared to Next.js on the web. Instead of "deploying" your app online, you need to submit production builds of your app to app stores, like [Apple App Store](https://www.apple.com/app-store) and [Google Play](https://play.google.com/store/apps). You can read the full [guide to distributing your app](https://docs.expo.dev/distribution/introduction), including best practices, in the Expo docs.

1. Make sure to modify the `getBaseUrl` function to point to your backend's production URL:

   <https://github.com/tinycor/tiny-t3-turbo/blob/656965aff7db271e5e080242c4a3ce4dad5d25f8/apps/expo/src/utils/api.tsx#L20-L37>

2. Let's start by setting up [EAS Build](https://docs.expo.dev/build/introduction), which is short for Expo Application Services. The build service helps you create builds of your app, without requiring a full native development setup. The commands below are a summary of [Creating your first build](https://docs.expo.dev/build/setup).

   ```bash
   # Install the EAS CLI
   pnpm add -g eas-cli

   # Log in with your Expo account
   eas login

   # Configure your Expo app
   cd apps/expo
   eas build:configure
   ```

3. After the initial setup, you can create your first build. You can build for Android and iOS platforms and use different [`eas.json` build profiles](https://docs.expo.dev/build-reference/eas-json) to create production builds or development, or test builds. Let's make a production build for iOS.

   ```bash
   eas build --platform ios --profile production
   ```

   > If you don't specify the `--profile` flag, EAS uses the `production` profile by default.

4. Now that you have your first production build, you can submit this to the stores. [EAS Submit](https://docs.expo.dev/submit/introduction) can help you send the build to the stores.

   ```bash
   eas submit --platform ios --latest
   ```

   > You can also combine build and submit in a single command, using `eas build ... --auto-submit`.

5. Before you can get your app in the hands of your users, you'll have to provide additional information to the app stores. This includes screenshots, app information, privacy policies, etc. _While still in preview_, [EAS Metadata](https://docs.expo.dev/eas/metadata) can help you with most of this information.

6. Once everything is approved, your users can finally enjoy your app. Let's say you spotted a small typo; you'll have to create a new build, submit it to the stores, and wait for approval before you can resolve this issue. In these cases, you can use EAS Update to quickly send a small bugfix to your users without going through this long process. Let's start by setting up EAS Update.

   The steps below summarize the [Getting started with EAS Update](https://docs.expo.dev/eas-update/getting-started/#configure-your-project) guide.

   ```bash
   # Add the `expo-updates` library to your Expo app
   cd apps/expo
   pnpm expo install expo-updates

   # Configure EAS Update
   eas update:configure
   ```

7. Before we can send out updates to your app, you have to create a new build and submit it to the app stores. For every change that includes native APIs, you have to rebuild the app and submit the update to the app stores. See steps 2 and 3.

8. Now that everything is ready for updates, let's create a new update for `production` builds. With the `--auto` flag, EAS Update uses your current git branch name and commit message for this update. See [How EAS Update works](https://docs.expo.dev/eas-update/how-eas-update-works/#publishing-an-update) for more information.

   ```bash
   cd apps/expo
   eas update --auto
   ```

   > Your OTA (Over The Air) updates must always follow the app store's rules. You can't change your app's primary functionality without getting app store approval. But this is a fast way to update your app for minor changes and bug fixes.

9. Done! Now that you have created your production build, submitted it to the stores, and installed EAS Update, you are ready for anything!

## Recent Fixes

### Session Tracking System Fixes

The session tracking system has been updated to fix several issues:

1. **Made reportId Optional**: Modified the userSessions schema to make the reportId field optional, which resolves the 500 error that occurred during session creation.

2. **Updated Session Router**: Simplified the session creation process by not requiring a reportId when creating a new session.

3. **Enhanced Error Handling**: Added better error logging in the session router to aid in debugging.

These changes ensure that the user activity tracking system works reliably without requiring a report to be associated with each session.

```bash
# To apply schema changes to your database:
npm run -w @acme/db push
```

## References

The stack originates from [create-t3-app](https://github.com/tinycor/create-t3-app).

A [blog post](https://jumr.dev/blog/t3-turbo) where I wrote how to migrate a T3 app into this.

```
tiny-t3-turbo
├─ .npmrc
├─ .nvmrc
├─ apps
│  ├─ auth-proxy
│  │  ├─ eslint.config.js
│  │  ├─ package.json
│  │  ├─ README.md
│  │  ├─ routes
│  │  │  └─ r
│  │  │     └─ [...auth].ts
│  │  ├─ tsconfig.json
│  │  └─ turbo.json
│  ├─ expo
│  │  ├─ .expo-shared
│  │  │  └─ assets.json
│  │  ├─ app.config.ts
│  │  ├─ assets
│  │  │  └─ icon.png
│  │  ├─ babel.config.js
│  │  ├─ eas.json
│  │  ├─ eslint.config.mjs
│  │  ├─ index.ts
│  │  ├─ metro.config.js
│  │  ├─ package.json
│  │  ├─ src
│  │  │  ├─ app
│  │  │  │  ├─ index.tsx
│  │  │  │  ├─ post
│  │  │  │  │  └─ [id].tsx
│  │  │  │  └─ _layout.tsx
│  │  │  ├─ styles.css
│  │  │  ├─ types
│  │  │  │  └─ nativewind-env.d.ts
│  │  │  └─ utils
│  │  │     ├─ api.tsx
│  │  │     ├─ auth.tsx
│  │  │     ├─ base-url.tsx
│  │  │     └─ session-store.ts
│  │  ├─ tailwind.config.ts
│  │  ├─ tsconfig.json
│  │  └─ turbo.json
│  └─ nextjs
│     ├─ eslint.config.js
│     ├─ next.config.js
│     ├─ package.json
│     ├─ postcss.config.cjs
│     ├─ public
│     │  ├─ favicon.ico
│     │  ├─ joc-logo-color.png
│     │  ├─ joc-logo.png
│     │  └─ t3-icon.svg
│     ├─ README.md
│     ├─ src
│     │  ├─ app
│     │  │  ├─ (auth)
│     │  │  │  ├─ forgot-password
│     │  │  │  │  └─ page.tsx
│     │  │  │  ├─ layout.tsx
│     │  │  │  ├─ login
│     │  │  │  │  └─ page.tsx
│     │  │  │  ├─ register
│     │  │  │  │  └─ page.tsx
│     │  │  │  ├─ reset-password
│     │  │  │  │  └─ page.tsx
│     │  │  │  ├─ verify-otp
│     │  │  │  │  └─ page.tsx
│     │  │  │  └─ _components
│     │  │  │     ├─ AuthFooter.tsx
│     │  │  │     ├─ ForgotPasswordForm.tsx
│     │  │  │     ├─ SignInForm.tsx
│     │  │  │     ├─ SignUp.tsx
│     │  │  │     ├─ TokenVerifyForm.tsx
│     │  │  │     └─ UpdatePasswordForm.tsx
│     │  │  ├─ (dashboard)
│     │  │  │  ├─ admin
│     │  │  │  │  ├─ page.tsx
│     │  │  │  │  └─ reports
│     │  │  │  │     ├─ page.tsx
│     │  │  │  │     └─ _components
│     │  │  │  │        └─ ReportColumns.tsx
│     │  │  │  ├─ layout.tsx
│     │  │  │  ├─ super-admin
│     │  │  │  │  ├─ billing
│     │  │  │  │  │  └─ page.tsx
│     │  │  │  │  ├─ change-password
│     │  │  │  │  │  └─ page.tsx
│     │  │  │  │  ├─ layout.tsx
│     │  │  │  │  ├─ page.tsx
│     │  │  │  │  ├─ reports
│     │  │  │  │  │  ├─ page.tsx
│     │  │  │  │  │  └─ _components
│     │  │  │  │  │     ├─ add-report-form.tsx
│     │  │  │  │  │     ├─ ReportColumns.tsx
│     │  │  │  │  │     ├─ ReportForm.tsx
│     │  │  │  │  │     ├─ ReportModal.tsx
│     │  │  │  │  │     └─ update-report-form.tsx
│     │  │  │  │  ├─ settings
│     │  │  │  │  │  └─ page.tsx
│     │  │  │  │  ├─ users
│     │  │  │  │  │  ├─ page.tsx
│     │  │  │  │  │  └─ _components
│     │  │  │  │  │     ├─ UserColumns.tsx
│     │  │  │  │  │     ├─ UserForm.tsx
│     │  │  │  │  │     └─ UserModal.tsx
│     │  │  │  │  └─ _components
│     │  │  │  │     ├─ CompanyColumns.tsx
│     │  │  │  │     ├─ CompanyForm.tsx
│     │  │  │  │     ├─ CompanyModal.tsx
│     │  │  │  │     ├─ report-metrics
│     │  │  │  │     │  ├─ active-accounts.tsx
│     │  │  │  │     │  ├─ error-card.tsx
│     │  │  │  │     │  ├─ report-metrics.tsx
│     │  │  │  │     │  ├─ skeleton-card.tsx
│     │  │  │  │     │  ├─ total-reports-card.tsx
│     │  │  │  │     │  ├─ total-users-card.tsx
│     │  │  │  │     │  └─ user-engagement.tsx
│     │  │  │  │     └─ SuperAdminTab.tsx
│     │  │  │  ├─ user
│     │  │  │  │  ├─ page.tsx
│     │  │  │  │  └─ _components
│     │  │  │  │     └─ ReportColumns.tsx
│     │  │  │  └─ _components
│     │  │  │     ├─ DataTable.tsx
│     │  │  │     ├─ EntityActions.tsx
│     │  │  │     ├─ Header.tsx
│     │  │  │     ├─ MultiSelect.tsx
│     │  │  │     ├─ Pagination.tsx
│     │  │  │     ├─ ReportViewer.tsx
│     │  │  │     ├─ Sidebar.tsx
│     │  │  │     └─ SidebarTrigger.tsx
│     │  │  ├─ api
│     │  │  │  ├─ auth
│     │  │  │  │  └─ confirm
│     │  │  │  │     └─ route.ts
│     │  │  │  ├─ track
│     │  │  │  │  └─ session
│     │  │  │  │     └─ [id]
│     │  │  │  │        └─ route.ts
│     │  │  │  ├─ trpc
│     │  │  │  │  └─ [trpc]
│     │  │  │  │     └─ route.ts
│     │  │  │  └─ webhooks
│     │  │  │     └─ stripe
│     │  │  │        └─ route.ts
│     │  │  ├─ cancel
│     │  │  │  └─ page.tsx
│     │  │  ├─ error.tsx
│     │  │  ├─ globals.css
│     │  │  ├─ layout.tsx
│     │  │  └─ success
│     │  │     └─ page.tsx
│     │  ├─ components
│     │  │  └─ ActivityTracker.tsx
│     │  ├─ env.ts
│     │  ├─ hooks
│     │  │  ├─ useActivityTracking.ts
│     │  │  ├─ useDebounce.ts
│     │  │  └─ useSessionActivity.ts
│     │  ├─ middleware.ts
│     │  ├─ server
│     │  │  └─ api
│     │  │     └─ routers
│     │  ├─ trpc
│     │  │  ├─ query-client.ts
│     │  │  ├─ react.tsx
│     │  │  └─ server.ts
│     │  ├─ types
│     │  │  └─ company.ts
│     │  └─ utils
│     │     ├─ formatDuration.ts
│     │     ├─ routes.ts
│     │     └─ supabase
│     │        └─ middleware.ts
│     ├─ tailwind.config.ts
│     ├─ tsconfig.json
│     ├─ turbo.json
│     └─ types
│        └─ next-types.d.ts
├─ changes.md
├─ LICENSE
├─ package.json
├─ packages
│  ├─ api
│  │  ├─ env.ts
│  │  ├─ eslint.config.js
│  │  ├─ package.json
│  │  ├─ src
│  │  │  ├─ index.ts
│  │  │  ├─ root.ts
│  │  │  ├─ router
│  │  │  │  ├─ auth.ts
│  │  │  │  ├─ billing.ts
│  │  │  │  ├─ company.ts
│  │  │  │  ├─ payment-method.ts
│  │  │  │  ├─ post.ts
│  │  │  │  ├─ report.ts
│  │  │  │  ├─ session.ts
│  │  │  │  ├─ stripe.ts
│  │  │  │  ├─ subscription.ts
│  │  │  │  └─ user.ts
│  │  │  ├─ trpc.ts
│  │  │  └─ utils
│  │  │     └─ tierProducts.ts
│  │  └─ tsconfig.json
│  ├─ auth
│  │  ├─ env.ts
│  │  ├─ eslint.config.js
│  │  ├─ package.json
│  │  ├─ src
│  │  │  └─ index.ts
│  │  └─ tsconfig.json
│  ├─ db
│  │  ├─ drizzle.config.ts
│  │  ├─ env.ts
│  │  ├─ eslint.config.js
│  │  ├─ migrations
│  │  ├─ package.json
│  │  ├─ src
│  │  │  ├─ index.ts
│  │  │  ├─ schema
│  │  │  │  ├─ billing.ts
│  │  │  │  ├─ company-admin-history.ts
│  │  │  │  ├─ company.ts
│  │  │  │  ├─ index.ts
│  │  │  │  ├─ login-attempts.ts
│  │  │  │  ├─ mouse-activity.ts
│  │  │  │  ├─ payment-method.ts
│  │  │  │  ├─ post.ts
│  │  │  │  ├─ report-metrics.ts
│  │  │  │  ├─ report.ts
│  │  │  │  ├─ subscription.ts
│  │  │  │  ├─ user.ts
│  │  │  │  ├─ userReports.ts
│  │  │  │  └─ userSessions.ts
│  │  │  └─ supabase
│  │  │     ├─ client.ts
│  │  │     ├─ dbConnect.ts
│  │  │     └─ server.ts
│  │  └─ tsconfig.json
│  ├─ ui
│  │  ├─ components.json
│  │  ├─ eslint.config.js
│  │  ├─ hooks
│  │  │  └─ use-mobile.tsx
│  │  ├─ package.json
│  │  ├─ src
│  │  │  ├─ accordion.tsx
│  │  │  ├─ alert-dialog.tsx
│  │  │  ├─ alert.tsx
│  │  │  ├─ avatar.tsx
│  │  │  ├─ badge.tsx
│  │  │  ├─ breadcrumb.tsx
│  │  │  ├─ button.tsx
│  │  │  ├─ calendar.tsx
│  │  │  ├─ card.tsx
│  │  │  ├─ carousel.tsx
│  │  │  ├─ chart.tsx
│  │  │  ├─ checkbox.tsx
│  │  │  ├─ command.tsx
│  │  │  ├─ dialog.tsx
│  │  │  ├─ dropdown-menu.tsx
│  │  │  ├─ form.tsx
│  │  │  ├─ hover-card.tsx
│  │  │  ├─ index.ts
│  │  │  ├─ input-otp.tsx
│  │  │  ├─ input.tsx
│  │  │  ├─ label.tsx
│  │  │  ├─ navigation-menu.tsx
│  │  │  ├─ pagination.tsx
│  │  │  ├─ popover.tsx
│  │  │  ├─ progress.tsx
│  │  │  ├─ scroll-area.tsx
│  │  │  ├─ select.tsx
│  │  │  ├─ separator.tsx
│  │  │  ├─ sheet.tsx
│  │  │  ├─ sidebar.tsx
│  │  │  ├─ skeleton.tsx
│  │  │  ├─ sonner.tsx
│  │  │  ├─ switch.tsx
│  │  │  ├─ table.tsx
│  │  │  ├─ tabs.tsx
│  │  │  ├─ textarea.tsx
│  │  │  ├─ theme.tsx
│  │  │  ├─ toast.tsx
│  │  │  ├─ toggle.tsx
│  │  │  └─ tooltip.tsx
│  │  ├─ tsconfig.json
│  │  └─ unused.css
│  └─ validators
│     ├─ eslint.config.js
│     ├─ package.json
│     ├─ src
│     │  └─ index.ts
│     └─ tsconfig.json
├─ pnpm-lock.yaml
├─ pnpm-workspace.yaml
├─ README.md
├─ tooling
│  ├─ eslint
│  │  ├─ base.js
│  │  ├─ nextjs.js
│  │  ├─ package.json
│  │  ├─ react.js
│  │  ├─ tsconfig.json
│  │  └─ types.d.ts
│  ├─ github
│  │  ├─ package.json
│  │  └─ setup
│  │     └─ action.yml
│  ├─ prettier
│  │  ├─ index.js
│  │  ├─ package.json
│  │  └─ tsconfig.json
│  ├─ tailwind
│  │  ├─ base.ts
│  │  ├─ eslint.config.js
│  │  ├─ native.ts
│  │  ├─ package.json
│  │  ├─ tsconfig.json
│  │  └─ web.ts
│  └─ typescript
│     ├─ base.json
│     ├─ internal-package.json
│     └─ package.json
├─ trigger.txt
├─ turbo
│  └─ generators
│     ├─ config.ts
│     └─ templates
│        ├─ eslint.config.js.hbs
│        ├─ package.json.hbs
│        └─ tsconfig.json.hbs
└─ turbo.json

```
