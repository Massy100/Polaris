import { test, expect, Page, Locator } from '@playwright/test';

test.use({
    storageState: 'tests/.auth/user.json',
});

async function goHome(page: Page) {
    await page.goto('/top-of-page');

    await expect(
        page.getByRole('heading', {
            name: /Sistema de Gestión Académica - Polaris/i,
        })
    ).toBeVisible({
        timeout: 25000,
    });
}

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

test('actualiza estados de docentes y filtra por buen desempeño', async ({ page }) => {
    test.setTimeout(120_000);

    await goHome(page);

    await page.getByRole('button', { name: /Alertas de Desempeño/i }).click();

    await expect(page).toHaveURL(/\/performance-alert$/, {
        timeout: 15000,
    });

    await expect(
        page.getByRole('heading', { name: /Alertas de Desempeño/i })
    ).toBeVisible();

    const searchInput = page.getByPlaceholder(/Buscar por nombre o materia/i);

    await expect(searchInput).toBeVisible();

    await searchInput.fill('V');

    const nextButton = page.getByRole('button', { name: /Siguiente/i });

    await expect(nextButton).toBeVisible({
        timeout: 15000,
    });

    if (await nextButton.isEnabled()) {
        await nextButton.click();
    }

    const linaCard = await getTeacherCard(
        page,
        'LINA VILLAGRÁN COMPARINI de BARILLAS'
    );

    const veroCard = await getTeacherCard(
        page,
        'VERÓNICA ELIZABETH COJULÚN LÓPEZ'
    );

    await expect(linaCard.locator('.pa-status-badge')).toContainText(/En Peligro/i);

    await linaCard.getByRole('button', { name: /^Bueno$/i }).click();

    await expect(linaCard.locator('.pa-status-badge')).toContainText(
        /Buen Desempeño/i
    );

    await expect(veroCard.locator('.pa-status-badge')).toContainText(/En Peligro/i);

    await veroCard.getByRole('button', { name: /^Bueno$/i }).click();

    await expect(veroCard.locator('.pa-status-badge')).toContainText(
        /Buen Desempeño/i
    );

    await searchInput.fill('');

    await expect(
        page.getByText(/VERÓNICA ELIZABETH COJULÚN LÓPEZ/i)
    ).toBeVisible({
        timeout: 15000,
    });

    await page.locator('.pa-filter-select').selectOption('good');

    await expect(
        page.getByText(/VERÓNICA ELIZABETH COJULÚN LÓPEZ/i)
    ).toBeVisible({
        timeout: 15000,
    });

    await expect(
        page.getByText(/LINA VILLAGRÁN COMPARINI de BARILLAS/i)
    ).toBeVisible({
        timeout: 15000,
    });

    const visibleCards = page.locator('.pa-teacher-card');
    const visibleCardsCount = await visibleCards.count();

    for (let i = 0; i < visibleCardsCount; i++) {
        await expect(
            visibleCards.nth(i).locator('.pa-status-badge')
        ).toContainText(/Buen Desempeño/i);
    }

    // await page.pause()
});