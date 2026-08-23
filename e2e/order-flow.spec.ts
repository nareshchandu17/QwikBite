import { test, expect } from '@playwright/test';

test.describe('Order Flow E2E', () => {
  const timestamp = Date.now();
  const testEmail = `test_${timestamp}@student.university.edu`;
  const testPassword = 'Password123!';

  test('should complete the full order flow end-to-end', async ({ page }) => {
    test.setTimeout(60000); // Allow 60s for the full E2E flow
    
    // 1. Load Homepage and Navigate to Sign Up
    await page.goto('/');
    await expect(page.locator('text=qwikBite').first()).toBeVisible();
    
    // 1. Force open sign up by navigating to the standalone route
    await page.goto('/customer/signup');
    await page.waitForTimeout(1000); 
    
    // 2. Register Account
    await page.waitForSelector('input[name="name"]');
    await page.getByLabel('Full Name').fill(`Student ${timestamp}`);
    await page.getByLabel('Registration Number').fill(`REG${timestamp}`);
    await page.getByLabel('Email address').fill(testEmail);
    await page.getByLabel('Password', { exact: true }).fill(testPassword);
    
    await page.getByRole('button', { name: /Create Account/i }).click();

    // 2b. Sign in with the newly created account
    await page.waitForURL('**/signin', { timeout: 15000 });
    await page.getByLabel('Student Email').fill(testEmail);
    await page.getByLabel('Password', { exact: true }).fill(testPassword);
    await page.getByRole('button', { name: /Get My Food Ready/i }).click();

    // 3. Navigate to Menu (Wait for automatic redirect to /customer or /customer/home)
    await page.waitForURL('**/customer**', { timeout: 15000 });
    await page.goto('/customer/menu');
    await expect(page.getByText('Menu', { exact: true }).first()).toBeVisible();
    
    // 4. Click "Order Now" on a menu item
    // Use JS evaluate to click to avoid any image overlap issues in headless mode
    const orderNowBtn = page.getByRole('button', { name: 'Order Now' }).first();
    await orderNowBtn.waitFor({ state: 'visible' });
    await orderNowBtn.evaluate((node: HTMLElement) => node.click());

    // 5. Time Slot Selection in Modal
    await expect(page.getByRole('heading', { name: /Select Pickup Time/i })).toBeVisible();
    
    // Select a time slot that is available (not cursor-not-allowed)
    // We can just look for the first available time string (e.g. "8:30-9:00" or similar)
    const slotOption = page.locator('.grid > div:not(.cursor-not-allowed)').filter({ hasText: /-/ }).first();
    await slotOption.waitFor({ state: 'visible' });
    await slotOption.evaluate((node: HTMLElement) => node.click());
    await expect(slotOption).toHaveClass(/bg-amber-50/);
    
    // Confirm Pickup Time
    await page.getByRole('button', { name: /Confirm Pickup Time/i }).click();

    // 7. Order Summary Page
    await page.waitForURL('**/order-summary', { timeout: 10000 });
    await page.getByRole('button', { name: /Proceed to Payment/i }).click();

    // 8. Payment Page
    await page.waitForURL('**/payment', { timeout: 10000 });
    await expect(page.getByText(/Secure Payment/i)).toBeVisible();
    
    // Select Cash on Delivery
    await page.getByText('Cash on Delivery').click();
    
    // Click Pay/Place Order (using generic selector for the big action button)
    await page.locator('button:has-text("Pay")').click();

    // 8. Verify Confirmation
    await page.waitForURL('**/success', { timeout: 15000 });
    await expect(page.getByText(/Order Confirmed|successful/i).first()).toBeVisible();
  });
});
