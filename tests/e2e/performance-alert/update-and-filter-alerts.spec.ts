import { test, expect, Page, Locator } from '@playwright/test';

test.use({
    storageState: 'tests/.auth/user.json',
});

async function getTeacherCard(page: Page, teacherName: string): Promise<Locator> {
    const card = page
        .locator('.pa-teacher-card')
        .filter({ hasText: teacherName })
        .first();

    await expect(card).toBeVisible({
        timeout: 15000,
    });

    return card;
}

test('actualiza estados de docentes y filtra por peligro', async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto('/top-of-page');

    await expect(
        page.getByRole('heading', { name: /Sistema de Gestión Académica - Polaris/i })
    ).toBeVisible();

    await page
        .locator('a[href="/performance-alert"]')
        .click();

    await expect(page).toHaveURL(/\/performance-alert$/);

    await expect(
        page.getByRole('heading', { name: /Alertas de Desempeño/i })
    ).toBeVisible();

    const searchInput = page.getByPlaceholder(/Buscar por nombre o materia/i);

    await expect(searchInput).toBeVisible();

    await searchInput.fill('An');

    const anaCard = await getTeacherCard(page, 'Ana Rodríguez Silva');
    const juanCard = await getTeacherCard(page, 'Juan Pérez Martínez');

    await expect(anaCard.locator('.pa-status-badge')).toContainText(/Advertencia/i);

    await anaCard
        .getByRole('button', { name: /^Bueno$/i })
        .click();

    await expect(anaCard.locator('.pa-status-badge')).toContainText(/Buen Desempeño/i);

    await expect(juanCard.locator('.pa-status-badge')).toContainText(/Buen Desempeño/i);

    await juanCard
        .getByRole('button', { name: /^Peligro$/i })
        .click();

    await expect(juanCard.locator('.pa-status-badge')).toContainText(/En Peligro/i);

    await searchInput.fill('');

    await expect(page.getByText(/María García López/i)).toBeVisible({
        timeout: 15000,
    });

    await page
        .locator('.pa-filter-select')
        .selectOption('danger');

    await expect(page.getByText(/Juan Pérez Martínez/i)).toBeVisible({
        timeout: 15000,
    });

    await expect(page.getByText(/Ana Rodríguez Silva/i)).toBeHidden({
        timeout: 15000,
    });

    const visibleCards = page.locator('.pa-teacher-card');

    const count = await visibleCards.count();

    for (let i = 0; i < count; i++) {
        await expect(
            visibleCards.nth(i).locator('.pa-status-badge')
        ).toContainText(/En Peligro/i);
    }

    // await page.pause();
});