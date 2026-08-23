# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: order-flow.spec.ts >> Order Flow E2E >> should complete the full order flow end-to-end
- Location: e2e\order-flow.spec.ts:8:7

# Error details

```
Error: expect(locator).toHaveClass(expected) failed

Locator: locator('.grid > div:not(.cursor-not-allowed)').filter({ hasText: /-/ }).first()
Expected pattern: /bg-amber-50/
Received string:  "p-3 rounded-xl transition-all border-2 bg-white border-transparent hover:border-amber-200 shadow-sm cursor-pointer"
Timeout: 5000ms

Call log:
  - Expect "toHaveClass" with timeout 5000ms
  - waiting for locator('.grid > div:not(.cursor-not-allowed)').filter({ hasText: /-/ }).first()
    7 × locator resolved to <div class="bg-white rounded-2xl overflow-hidden shadow-lg transition-all duration-300 border border-gray-100 hover:-translate-y-1 relative group h-full flex flex-col menu-card  hover:shadow-md h-full flex flex-col">…</div>
      - unexpected value "bg-white rounded-2xl overflow-hidden shadow-lg transition-all duration-300 border border-gray-100 hover:-translate-y-1 relative group h-full flex flex-col menu-card  hover:shadow-md h-full flex flex-col"
    6 × locator resolved to <div class="p-3 rounded-xl transition-all border-2 bg-white border-transparent hover:border-amber-200 shadow-sm cursor-pointer">…</div>
      - unexpected value "p-3 rounded-xl transition-all border-2 bg-white border-transparent hover:border-amber-200 shadow-sm cursor-pointer"

```

```yaml
- text: 8:30-9:00 🟢 Fast Delivery
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Order Flow E2E', () => {
  4  |   const timestamp = Date.now();
  5  |   const testEmail = `test_${timestamp}@student.university.edu`;
  6  |   const testPassword = 'Password123!';
  7  | 
  8  |   test('should complete the full order flow end-to-end', async ({ page }) => {
  9  |     test.setTimeout(60000); // Allow 60s for the full E2E flow
  10 |     
  11 |     // 1. Load Homepage and Navigate to Sign Up
  12 |     await page.goto('/');
  13 |     await expect(page.locator('text=qwikBite').first()).toBeVisible();
  14 |     
  15 |     // 1. Force open sign up by navigating to the standalone route
  16 |     await page.goto('/customer/signup');
  17 |     await page.waitForTimeout(1000); 
  18 |     
  19 |     // 2. Register Account
  20 |     await page.waitForSelector('input[name="name"]');
  21 |     await page.getByLabel('Full Name').fill(`Student ${timestamp}`);
  22 |     await page.getByLabel('Registration Number').fill(`REG${timestamp}`);
  23 |     await page.getByLabel('Email address').fill(testEmail);
  24 |     await page.getByLabel('Password', { exact: true }).fill(testPassword);
  25 |     
  26 |     await page.getByRole('button', { name: /Create Account/i }).click();
  27 | 
  28 |     // 2b. Sign in with the newly created account
  29 |     await page.waitForURL('**/signin', { timeout: 15000 });
  30 |     await page.getByLabel('Student Email').fill(testEmail);
  31 |     await page.getByLabel('Password', { exact: true }).fill(testPassword);
  32 |     await page.getByRole('button', { name: /Get My Food Ready/i }).click();
  33 | 
  34 |     // 3. Navigate to Menu (Wait for automatic redirect to /customer or /customer/home)
  35 |     await page.waitForURL('**/customer**', { timeout: 15000 });
  36 |     await page.goto('/customer/menu');
  37 |     await expect(page.getByText('Menu', { exact: true }).first()).toBeVisible();
  38 |     
  39 |     // 4. Click "Order Now" on a menu item
  40 |     // Use JS evaluate to click to avoid any image overlap issues in headless mode
  41 |     const orderNowBtn = page.getByRole('button', { name: 'Order Now' }).first();
  42 |     await orderNowBtn.waitFor({ state: 'visible' });
  43 |     await orderNowBtn.evaluate((node: HTMLElement) => node.click());
  44 | 
  45 |     // 5. Time Slot Selection in Modal
  46 |     await expect(page.getByRole('heading', { name: /Select Pickup Time/i })).toBeVisible();
  47 |     
  48 |     // Select a time slot that is available (not cursor-not-allowed)
  49 |     // We can just look for the first available time string (e.g. "8:30-9:00" or similar)
  50 |     const slotOption = page.locator('.grid > div:not(.cursor-not-allowed)').filter({ hasText: /-/ }).first();
  51 |     await slotOption.waitFor({ state: 'visible' });
  52 |     await slotOption.evaluate((node: HTMLElement) => node.click());
> 53 |     await expect(slotOption).toHaveClass(/bg-amber-50/);
     |                              ^ Error: expect(locator).toHaveClass(expected) failed
  54 |     
  55 |     // Confirm Pickup Time
  56 |     await page.getByRole('button', { name: /Confirm Pickup Time/i }).click();
  57 | 
  58 |     // 7. Order Summary Page
  59 |     await page.waitForURL('**/order-summary', { timeout: 10000 });
  60 |     await page.getByRole('button', { name: /Proceed to Payment/i }).click();
  61 | 
  62 |     // 8. Payment Page
  63 |     await page.waitForURL('**/payment', { timeout: 10000 });
  64 |     await expect(page.getByText(/Secure Payment/i)).toBeVisible();
  65 |     
  66 |     // Select Cash on Delivery
  67 |     await page.getByText('Cash on Delivery').click();
  68 |     
  69 |     // Click Pay/Place Order (using generic selector for the big action button)
  70 |     await page.locator('button:has-text("Pay")').click();
  71 | 
  72 |     // 8. Verify Confirmation
  73 |     await page.waitForURL('**/success', { timeout: 15000 });
  74 |     await expect(page.getByText(/Order Confirmed|successful/i).first()).toBeVisible();
  75 |   });
  76 | });
  77 | 
```