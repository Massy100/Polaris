import { test, expect, Page } from '@playwright/test';

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

async function waitForRankingToLoad(page: Page) {
    await expect(page.getByText(/Cargando clasificación/i)).toBeHidden({
        timeout: 45000,
    });
}

async function goBackToRanking(page: Page) {
    await page.getByRole('button', { name: /Volver al listado/i }).click();

    await expect(page).toHaveURL(/\/institutional-ranking$/, {
        timeout: 25000,
    });

    await waitForRankingToLoad(page);

    await expect(
        page.getByRole('heading', { name: /Ranking de Docentes/i })
    ).toBeVisible();
}

async function setRankingPageSize(page: Page, size: string) {
    const pageSizeInput = page.locator('#pageSize');

    await expect(pageSizeInput).toBeVisible({
        timeout: 15000,
    });

    await pageSizeInput.fill(size);
    await pageSizeInput.press('Enter');

    await waitForRankingToLoad(page);
}

test('navega desde ranking institucional hacia detalle y valida paginación', async ({ page }) => {
    test.setTimeout(120_000);

    await goHome(page);

    await page.getByRole('button', { name: /Ranking Institucional/i }).click();

    await expect(page).toHaveURL(/\/institutional-ranking$/, {
        timeout: 15000,
    });

    await expect(
        page.getByRole('heading', { name: /Ranking de Docentes/i })
    ).toBeVisible();

    await waitForRankingToLoad(page);

    const rankingRows = page.locator('tbody tr.ir-tr-clickable');

    await expect(rankingRows.nth(4)).toBeVisible({
        timeout: 25000,
    });

    await rankingRows.nth(4).click();

    await expect(page).toHaveURL(/\/individual-teacher-view\/21$/, {
        timeout: 25000,
    });

    await expect(page.getByText(/Expediente Docente/i)).toBeVisible({
        timeout: 25000,
    });

    await goBackToRanking(page);

    await setRankingPageSize(page, '5');

    await expect(page.getByText(/Página 1 de/i)).toBeVisible({
        timeout: 15000,
    });

    await expect(rankingRows).toHaveCount(5, {
        timeout: 15000,
    });

    await expect(rankingRows.nth(3)).toBeVisible({
        timeout: 25000,
    });

    await rankingRows.nth(3).click();

    await expect(page).toHaveURL(/\/individual-teacher-view\/24$/, {
        timeout: 25000,
    });

    await expect(page.getByText(/Expediente Docente/i)).toBeVisible({
        timeout: 35000,
    });

    await goBackToRanking(page);

    await setRankingPageSize(page, '5');

    await expect(rankingRows).toHaveCount(5, {
        timeout: 15000,
    });

    await page.getByRole('button', { name: /Siguiente/i }).click();

    await expect(page.getByText(/Página 2 de/i)).toBeVisible({
        timeout: 15000,
    });

    await waitForRankingToLoad(page);

    await page.getByRole('button', { name: /Siguiente/i }).click();

    await expect(page.getByText(/Página 3 de/i)).toBeVisible({
        timeout: 15000,
    });

    await waitForRankingToLoad(page);

    // await page.pause()
});