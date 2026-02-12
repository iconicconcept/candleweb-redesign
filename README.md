# 🚀 Project Setup Guide

Welcome to the team! This document will guide you through understanding, running, testing, and deploying the project.

## 📦 Tech Stack

- **Monorepo Tool:** [TurboRepo](https://turbo.build/repo)
- **Frontend Framework:** [Next.js](https://nextjs.org/)
- **Package Manager:** `pnpm@7.18.2` or if you want to try a newer version
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)

## 🔧 Installing pnpm

To install the required pnpm version:

```bash
# Install pnpm globally (if you don't have it)
npm install -g pnpm

# Install specific version (recommended)
npm install -g pnpm@7.18.2

# Verify installation
pnpm --version
# Should output: 7.18.2

## 🗂 Directory Structure

```

root/
├── apps/
│ └── client/ # Next.js frontend application
├── packages/
│ └── ui/ # Shared UI components
├── turbo.json # TurboRepo configuration
├── pnpm-workspace.yaml

````

## 🛠 Getting Started

1. **Install dependencies:**

   ```bash
   pnpm install
````

2. **Run development server:**

   ```bash
   pnpm dev
   ```

   This runs the app in development mode. Navigate to `http://localhost:3000`.

## 📊 Testing in Sandbox

To point the app to the sandbox environment:

1. Open the file:

   ```
   apps/client/lib/axiosApi.ts
   ```

2. Locate the URI line and **uncomment** the sandbox URI:

   ```ts
   // const uri = "https://sandbox.example.com/api";
   ```

3. Comment out or remove the production URI if necessary.

## 🚀 Deploying to Production

1. In the same file `apps/client/lib/axiosApi.ts`, **change the URI** to the **main/production URI**:

   ```ts
   const uri = "https://yourproductiondomain.com/api";
   ```

2. Build the project from the root directory:

   ```bash
   pnpm build
   ```

3. Export the Next.js app:

   ```bash
   cd apps/client
   pnpm next export
   ```

4. A folder named `out` will be generated in `apps/client`.

5. Compress the contents of the `out` folder into a `.zip` file.

6. Upload the `.zip` file to the **cPanel File Manager** inside the `public_html` directory.

7. Extract the contents after uploading.

## 📊 Optional Improvements

- You are welcome to try upgrading dependencies or the Node package manager (pnpm) to improve performance or compatibility. Please ensure everything works after upgrades.
