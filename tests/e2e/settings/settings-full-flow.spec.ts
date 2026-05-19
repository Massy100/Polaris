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

async function fillCategoryModal(
    page: Page,
    categoryName: string,
    categoryDescription: string
) {
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

async function getCriterionCard(
    page: Page,
    criterionName: RegExp
): Promise<Locator> {
    const criterion = page
        .locator('.wc-criteria-list > *')
        .filter({ hasText: criterionName })
        .first();

    await expect(criterion).toBeVisible({
        timeout: 15000,
    });

    return criterion;
}

async function setCriterionPercentage(
    page: Page,
    criterionName: RegExp,
    value: string
) {
    const criterion = await getCriterionCard(page, criterionName);

    const input = criterion.locator('input[type="number"]').first();

    await expect(input).toBeVisible({
        timeout: 15000,
    });

    await input.fill(value);
    await input.press('Tab');

    await expect(input).toHaveValue(value, {
        timeout: 10000,
    });
}

test('flujo completo de configuración y pesos', async ({ page }) => {
    test.setTimeout(240_000);

    const categoryName = `Categoria E2E ${Date.now()}`;
    const categoryDescription =
        'Categoría creada automáticamente por prueba E2E';

    await goHome(page);
    await goToSettingsFromSidebar(page);

    // Mi Perfil
    await openSettingsCard(page, /Mi Perfil/i);

    await expect(page).toHaveURL(/\/settings\/profile$/, {
        timeout: 15000,
    });

    await expect(
        page.getByRole('heading', { name: /^Mi Perfil$/, level: 1 })
    ).toBeVisible({
        timeout: 30000,
    });

    await expect(
        page.getByRole('heading', { name: /^Información Personal$/, level: 2 })
    ).toBeVisible({
        timeout: 30000,
    });

    await expect(page.getByText(/Nombre/i)).toBeVisible();
    await expect(page.getByText(/Apellido/i)).toBeVisible();
    await expect(page.getByText(/Correo electrónico/i)).toBeVisible();
    await expect(page.getByText(/Teléfono/i)).toBeVisible();
    await expect(page.getByText(/Rol en el sistema/i)).toBeVisible();

    await page.getByRole('button', { name: /Seguridad/i }).click();

    await expect(
        page.getByRole('heading', { name: /^Cambiar Contraseña$/, level: 2 })
    ).toBeVisible();

    await expect(page.getByText(/Contraseña actual/i)).toBeVisible();
    await expect(page.getByText(/Confirmar nueva contraseña/i)).toBeVisible();

    await page.getByRole('button', { name: /Preferencias/i }).click();

    await expect(
        page.getByRole('heading', { name: /^Preferencias del Sistema$/, level: 2 })
    ).toBeVisible();

    await expect(page.getByText(/Notificaciones por correo/i)).toBeVisible();
    await expect(page.getByText(/Alertas del sistema/i)).toBeVisible();
    await expect(page.getByText(/Reporte semanal/i)).toBeVisible();
    await expect(page.getByText(/Autenticación de dos factores/i)).toBeVisible();

    await backToSettings(page);

    // Estructura Académica
    await openSettingsCard(page, /Estructura Académica/i);

    await expect(page).toHaveURL(/\/pensum$/, {
        timeout: 15000,
    });

    await expect(
        page.getByRole('heading', {
            name: /^Estructura Académica \(Pensum\)$/,
            level: 1,
        })
    ).toBeVisible({
        timeout: 30000,
    });

    await expect(page.getByText(/Sincronizando con el servidor/i)).toBeHidden({
        timeout: 45000,
    });

    await expect(
        page.getByRole('heading', {
            name: /^Carga de Pensum Realizada$/,
            level: 2,
        })
    ).toBeVisible({
        timeout: 30000,
    });

    await goToSettingsFromSidebar(page);

    // Biblioteca de Plantillas
    await openSettingsCard(page, /Biblioteca de Plantillas/i);

    await expect(page).toHaveURL(/\/settings\/templates$/, {
        timeout: 15000,
    });

    await expect(
        page.getByRole('heading', {
            name: /^Biblioteca de Plantillas$/,
            level: 1,
        })
    ).toBeVisible({
        timeout: 30000,
    });

    await expect(
        page.getByText(
            /Gestione los formatos de evaluación y observación docente disponibles en el sistema/i
        )
    ).toBeVisible();

    await expect(
        page.getByText(/Historial de Biblioteca|Sin plantillas disponibles/i)
    ).toBeVisible({
        timeout: 45000,
    });

    await backToSettings(page);

    // Mantenimiento de Datos
    await openSettingsCard(page, /Mantenimiento de Datos/i);

    await expect(page).toHaveURL(/\/settings\/maintenance$/, {
        timeout: 15000,
    });

    await expect(
        page.getByRole('heading', {
            name: /^Mantenimiento y Restauración$/,
            level: 1,
        })
    ).toBeVisible({
        timeout: 30000,
    });

    await expect(
        page.getByText(/Panel administrativo para la gestión de la integridad de datos/i)
    ).toBeVisible();

    await expect(page.getByText(/Biblioteca de Plantillas de Evaluación/i)).toBeVisible({
        timeout: 30000,
    });

    await expect(page.getByText(/Gestión del Pensum/i)).toBeVisible();
    await expect(page.getByText(/Estado de Integridad/i)).toBeVisible();

    await expect(
        page.getByText(/No hay plantillas cargadas en el sistema|Estructura de la Plantilla/i)
    ).toBeVisible({
        timeout: 45000,
    });

    await expect(page.getByText(/Cursos registrados:/i)).toBeVisible();
    await expect(page.getByText(/Estado de la Base:/i)).toBeVisible();

    await backToSettings(page);

    // Pesos y Fórmulas
    await openSettingsCard(page, /Pesos y Fórmulas/i);

    await expect(page).toHaveURL(/\/weights-config$/, {
        timeout: 15000,
    });

    await expect(
        page.getByRole('heading', {
            name: /^Pesos y Fórmulas$/,
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

    await page.getByRole('button', { name: /Restablecer/i }).click();
    await page.getByRole('button', { name: /Sí, restablecer/i }).click();

    await setCriterionPercentage(page, /Dominio del tema/i, '10');

    await page.getByRole('button', { name: /Agregar Categoría/i }).click();

    await fillCategoryModal(page, categoryName, categoryDescription);

    await expect(
        page
            .locator('.wc-criteria-list > *')
            .filter({ hasText: categoryName })
            .first()
    ).toBeVisible({
        timeout: 15000,
    });

    await setCriterionPercentage(page, new RegExp(categoryName, 'i'), '10');

    await expect(page.locator('.wc-summary-value')).toHaveText('100%', {
        timeout: 15000,
    });

    await expect(
        page.getByRole('button', { name: /Guardar Configuración/i })
    ).toBeEnabled({
        timeout: 15000,
    });

    await page.getByRole('button', { name: /Guardar Configuración/i }).click();

    await expect(
        page.getByText(
            /Guardando.../i
        )
    ).toBeVisible({
        timeout: 45000,
    });

    // await page.pause()
});