import { test, expect, Page, Locator } from '@playwright/test';

test.use({
    storageState: 'tests/.auth/user.json',
});

async function goToSettingsFromSidebar(page: Page) {
    await page
        .locator('nav')
        .getByRole('button', { name: /^Configuración$/i })
        .click();

    await expect(page).toHaveURL(/\/settings$/, {
        timeout: 15000,
    });

    await expect(
        page.getByRole('heading', { name: /Ajustes del Sistema/i })
    ).toBeVisible({
        timeout: 15000,
    });
}

async function backToSettings(page: Page) {
    await page
        .getByRole('button', { name: /^Configuración$/i })
        .last()
        .click();

    await expect(page).toHaveURL(/\/settings$/, {
        timeout: 15000,
    });

    await expect(
        page.getByRole('heading', { name: /Ajustes del Sistema/i })
    ).toBeVisible({
        timeout: 15000,
    });
}

async function openSettingsCard(page: Page, name: RegExp) {
    const card = page
        .locator('.settings-card')
        .filter({ hasText: name })
        .first();

    await expect(card).toBeVisible({
        timeout: 15000,
    });

    await card.click();
}

async function fillCategoryModal(page: Page, categoryName: string, categoryDescription: string) {
    await expect(
        page.getByRole('heading', { name: /^Agregar Nueva Categoría$/i })
    ).toBeVisible({
        timeout: 15000,
    });

    await page
        .getByPlaceholder(/Ej: Publicaciones científicas/i)
        .fill(categoryName);

    await page
        .getByPlaceholder(/Describe en qué consiste este criterio de evaluación/i)
        .fill(categoryDescription);

    const addButton = page
        .getByRole('button', { name: /^Agregar Categoría$/i })
        .last();

    await expect(addButton).toBeEnabled({
        timeout: 15000,
    });

    await addButton.click();

    await expect(
        page.getByRole('heading', { name: /^Agregar Nueva Categoría$/i })
    ).toBeHidden({
        timeout: 15000,
    });
}

async function getCriterionCard(page: Page, criterionName: RegExp): Promise<Locator> {
    const criterion = page
        .locator('.wc-criteria-list > *')
        .filter({ hasText: criterionName })
        .first();

    await expect(criterion).toBeVisible({
        timeout: 15000,
    });

    return criterion;
}

async function setCriterionPercentage(page: Page, criterionName: RegExp, value: string) {
    const criterion = await getCriterionCard(page, criterionName);

    const input = criterion
        .locator('input[type="number"]')
        .first();

    await expect(input).toBeVisible({
        timeout: 15000,
    });

    await input.fill(value);
    await input.press('Tab');

    await expect(input).toHaveValue(value, {
        timeout: 10000,
    });
}

test('flujo completo de configuración, pesos, alertas y auditoría', async ({ page }) => {
    test.setTimeout(240_000);

    const categoryName = `Categoria E2E ${Date.now()}`;
    const categoryDescription = 'Categoría creada automáticamente por prueba E2E';

    await page.goto('/top-of-page');

    await expect(
        page.getByRole('heading', { name: /Sistema de Gestión Académica - Polaris/i })
    ).toBeVisible({
        timeout: 15000,
    });

    await goToSettingsFromSidebar(page);

    // Mi Perfil
    await openSettingsCard(page, /Mi Perfil/i);

    await expect(page).toHaveURL(/\/settings\/profile$/, {
        timeout: 15000,
    });

    await expect(
        page.getByRole('heading', { name: /Mi Perfil|Perfil/i })
    ).toBeVisible({
        timeout: 15000,
    });

    await backToSettings(page);

    // Gestión de Importaciones
    await openSettingsCard(page, /Gestión de Importaciones/i);

    await expect(page).toHaveURL(/\/settings\/data-import$/, {
        timeout: 15000,
    });

    await expect(
        page.getByRole('heading', {
            name: /^Gestión de Importaciones$/,
            level: 1,
        })
    ).toBeVisible({
        timeout: 15000,
    });

    await backToSettings(page);

    // Pesos y Fórmulas
    await openSettingsCard(page, /Pesos y Fórmulas/i);

    await expect(page).toHaveURL(/\/weights-config$/, {
        timeout: 15000,
    });

    await expect(
        page.getByRole('heading', {
            name: /^Sistema de Evaluación Docente$/,
            level: 1,
        })
    ).toBeVisible({
        timeout: 30000,
    });

    await expect(
        page.getByRole('heading', {
            name: /^Configuración de Pesos y Fórmulas$/,
            level: 2,
        })
    ).toBeVisible({
        timeout: 30000,
    });

    await expect(page.getByText(/Cargando configuración/i)).toBeHidden({
        timeout: 45000,
    });

    await page
        .getByRole('button', { name: /Agregar Categoría/i })
        .click();

    await fillCategoryModal(page, categoryName, categoryDescription);

    const newCategoryCriterion = page
        .locator('.wc-criteria-list > *')
        .filter({ hasText: categoryName })
        .first();

    await expect(newCategoryCriterion).toBeVisible({
        timeout: 15000,
    });

    await setCriterionPercentage(page, /Evaluación de alumnos/i, '30');

    await setCriterionPercentage(page, new RegExp(categoryName, 'i'), '10');

    await expect(page.locator('.wc-summary-value')).toHaveText('100%', {
        timeout: 15000,
    });

    await expect(
        page.getByRole('button', { name: /Guardar Configuración/i })
    ).toBeEnabled({
        timeout: 15000,
    });

    await page
        .getByRole('button', { name: /Guardar Configuración/i })
        .click();

    await expect(
        page.getByText(/Guardando/i)
    ).toBeVisible({
        timeout: 10000,
    }).catch(() => {
    });

    await expect(
        page.getByText(/Configuración guardada|guardada correctamente|activada correctamente/i)
    ).toBeVisible({
        timeout: 45000,
    });

    await goToSettingsFromSidebar(page);

    // Reglas de Notificación
    await openSettingsCard(page, /Reglas de Notificación/i);

    await expect(page).toHaveURL(/\/settings\/alert-config$/, {
        timeout: 15000,
    });

    await expect(
        page.getByRole('heading', { name: /Reglas de Notificación/i })
    ).toBeVisible({
        timeout: 15000,
    });

    const failedAccessCard = page
        .locator('.alert-config-card')
        .filter({ hasText: /Intentos de Acceso Fallidos/i })
        .first();

    await expect(failedAccessCard).toBeVisible({
        timeout: 15000,
    });

    const failedAccessCheckbox = failedAccessCard.locator('input[type="checkbox"]');

    await failedAccessCard
        .locator('.profile-toggle-track')
        .click();

    await expect(failedAccessCheckbox).toBeChecked({
        timeout: 10000,
    });

    await page
        .getByRole('button', { name: /Guardar Configuración/i })
        .click();

    await expect(
        page.getByText(/Configuración de alertas guardada/i)
    ).toBeVisible({
        timeout: 10000,
    });

    await backToSettings(page);

    // Auditoría y Equipo
    await openSettingsCard(page, /Auditoría y Equipo/i);

    await expect(page).toHaveURL(/\/settings\/audit$/, {
        timeout: 15000,
    });

    await expect(
        page.getByRole('heading', { name: /Auditoría y Equipo/i })
    ).toBeVisible({
        timeout: 15000,
    });

    await expect(page.getByText(/Historial de Cambios/i)).toBeVisible({
        timeout: 15000,
    });

    await expect(page.getByText(/Equipo Admin/i)).toBeVisible({
        timeout: 15000,
    });

    await page.pause();
});