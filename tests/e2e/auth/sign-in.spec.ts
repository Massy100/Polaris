import { test, expect } from '@playwright/test';

test('muestra la pantalla de inicio de sesión', async ({ page }) => {
    await page.goto('/sign-in');

    await expect(page).toHaveURL(/sign-in/);

    await expect(
        page.getByText(/Sistema De Gestión Académica/i)
    ).toBeVisible();

    await expect(
        page.getByText(/Universidad Rafael Landívar/i)
    ).toBeVisible();

    await expect(
        page.getByText(/El conocimiento/i)
    ).toBeVisible();
});

test('usuario puede iniciar sesión con Clerk', async ({ page }) => {
    await page.goto('/sign-in');

    await page
        .getByLabel(/email/i)
        // Add a email that enter into the App
        .fill("");

    await page
        .getByRole('button', { name: /continue|continuar/i })
        .click();

    await page
        .locator('input[name="password"]')
        // Add a password that enter into the App
        .fill("");

    await page
        .getByRole('button', { name: /continue|continuar|sign in|iniciar sesión/i })
        .click();

    await page.pause();

    await expect(page).toHaveURL(/top-of-page/, { timeout: 15000 });

    await page.context().storageState({
        path: 'tests/.auth/user.json',
    });
});