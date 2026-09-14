# Neo.space (`admin.neo.space`) Email & DNS Setup Guide

This guide walks you through configuring **business email** and **website hosting** for `businessintel.co.site` inside your Neo dashboard.

---

## Part 1: Setting Up Your Business Email (`licensing@businessintel.co.site`)

1. **Log in to Neo Admin**:
   - Open [https://admin.neo.space](https://admin.neo.space) and log into your account.
2. **Create / Verify Mailbox**:
   - In the sidebar, click **Email Accounts** (or **Users & Mailboxes**).
   - Verify that **`licensing@businessintel.co.site`** is created.
   - (Optional) Create an alias or second mailbox for **`support@businessintel.co.site`**.
3. **Configure Email Forwarding to Your Personal Inbox**:
   - In the mailbox settings for `licensing@businessintel.co.site`, click **Forwarding / Auto-forward**.
   - Enter your personal email address (e.g. your personal Gmail/ProtonMail).
   - Check *"Keep a copy in Neo inbox"*.
   - **Result**: Any prospective client clicking "Email Licensing Team" or emailing you about an invoice will notify you on your personal phone/email inbox instantly.

---

## Part 2: Hosting Your Website

### Path A: If You Choose Neo’s Built-In Site Builder (Fastest)
1. In `admin.neo.space`, click **Neo Site** (or **Website Builder**).
2. Choose a modern business layout.
3. Open [`website/NEO_BUILDER_COPY.md`](./NEO_BUILDER_COPY.md) and copy-paste each section (Hero headline, 3 superpowers, pricing tiers, contact).
4. Upload `website/assets/app-icon.png` as the site logo and `website/assets/bpmn-architecture-light.svg` for the architecture visual.
5. Click **Publish**. Neo will automatically attach your domain `businessintel.co.site`.

---

### Path B: If You Choose the Custom Code Landing Page (GitHub Pages)
The custom landing page in `website/` has been built with an interactive simulator, responsive dark-mode styling, and automated GitHub Pages workflow.

1. **Enable GitHub Pages on your repository**:
   - Go to `https://github.com/pkoryaka/nativelingo/settings/pages`.
   - Under **Build and deployment** $\rightarrow$ **Source**, choose **GitHub Actions**.
   - Under **Custom domain**, type: `businessintel.co.site` and click **Save**.
2. **Configure DNS in Neo (`admin.neo.space`)**:
   - In `admin.neo.space`, go to **Domains** $\rightarrow$ **DNS Management** for `businessintel.co.site`.
   - **CRITICAL**: Do **NOT** touch the `MX`, `SPF`, or `DKIM` records (this keeps your Neo business email working 100%).
   - Edit the web record:
     - **CNAME Record**: Host `www` $\rightarrow$ Target `pkoryaka.github.io`
     - **A Records** (for apex `@` domain, point to GitHub Pages IP addresses):
       - `185.199.108.153`
       - `185.199.109.153`
       - `185.199.110.153`
       - `185.199.111.153`
3. Push to GitHub (`git push`). The workflow in `.github/workflows/deploy-pages.yml` will automatically build and publish your custom landing page to `businessintel.co.site` with free SSL!
