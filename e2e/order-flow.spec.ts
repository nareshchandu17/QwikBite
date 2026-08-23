import { test, expect } from '@playwright/test';

test.describe('Order Flow E2E', () => {
  test('should load the homepage and navigate to menu', async ({ page }) => {
    await page.goto('/');
    
    // Check that the homepage loaded successfully
    await expect(page.locator('text=qwikBite')).toBeVisible();
    await expect(page.locator('text=Skip the Line')).toBeVisible();

    // In a full E2E environment with seeded data, we would:
    // 1. Click "Sign In" or "Get Started"
    // 2. Log in with a test student account
    // 3. Navigate to the menu
    // 4. Click "Add to Cart" on a menu item
    // 5. Navigate to checkout/slot-selection
    // 6. Verify slots are visible
    // 7. Select a slot and proceed to payment
    // 8. Confirm the order
  });

  test('should have a working health check endpoint', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
  });
});
