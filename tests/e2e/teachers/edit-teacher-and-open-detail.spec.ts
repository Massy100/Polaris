import { test, expect } from '@playwright/test';

test.use({
    storageState: 'tests/.auth/user.json',
});

test('edita correo institucional de docente y abre su vista individual', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/top-of-page');

    await expect(
        page.getByRole('heading', { name: /Sistema de Gestión Académica - Polaris/i })
    ).toBeVisible();

    await page.getByText(/Gestión de Docentes/i).click();

    await expect(page).toHaveURL(/user-management/);

    await expect(
        page.getByRole('heading', { name: 'Gestión de Docentes' })
    ).toBeVisible();

    await expect(page.getByText(/Cargando registros/i)).toBeHidden({
        timeout: 15000,
    });

    await page
        .getByPlaceholder(/Búsqueda por nombre/i)
        .fill("JORGE");

    await expect(page.getByText(/Cargando registros/i)).toBeHidden({
        timeout: 15000,
    });

    const teacherRow = page
        .getByRole('row')
        .filter({ hasText: /JORGE ESTUARDO TELLO MONZÓN/i })
        .filter({ hasText: /30460/ });

    await expect(teacherRow).toBeVisible({
        timeout: 15000,
    });

    await teacherRow
        .locator('button[title="Modificar Registro"]')
        .click();

    await expect(
        page.getByText('Actualizar Docente')
    ).toBeVisible();

    await page
        .getByPlaceholder('ejemplo@universidad.edu')
        .fill('jorgetello.e2e@universidad.edu.gt');

    await page
        .getByRole('button', { name: /Guardar Cambios/i })
        .click();

    await expect(page.getByText(/Cargando registros/i)).toBeHidden({
        timeout: 15000,
    });

    await expect(page.getByText('Actualizar Docente')).toBeHidden({
        timeout: 15000,
    });

    await expect(teacherRow).toContainText('jorgetello.e2e@universidad.edu.gt', {
        timeout: 15000,
    });

    await teacherRow.dblclick();

    await expect(page).toHaveURL(/\/individual-teacher-view\/23$/, {
        timeout: 25000,
    });

    await expect(page.getByText(/Cargando expediente del docente.../i)).toBeHidden({
        timeout: 15000,
    });

    await expect(page.getByText(/JORGE ESTUARDO TELLO MONZÓN/i)).toBeVisible({
        timeout: 25000,
    });
    await expect(page.getByText(/Expediente Docente/i)).toBeVisible();
    await expect(page.getByText(/Análisis por Sentimiento/i)).toBeVisible({
        timeout: 25000,
    });

    await page
        .getByRole('button', { name: /Volver al listado/i })
        .click();

    await expect(page).toHaveURL(/\/user-management$/, {
        timeout: 25000,
    });

    await expect(
        page.getByRole('heading', { name: 'Gestión de Docentes' })
    ).toBeVisible();

    await expect(page.getByText(/Cargando registros/i)).toBeHidden({
        timeout: 45000,
    });

    // await page
    //     .getByPlaceholder(/Búsqueda por nombre/i)
    //     .fill('GERMAN GABRIEL');

    // await expect(page.getByText(/Cargando registros/i)).toBeHidden({
    //     timeout: 15000,
    // });

    const germanRow = page
        .getByRole('row')
        .filter({ hasText: /GERMAN GABRIEL OROZCO PISQUIY/i })
        .filter({ hasText: /21408/ });

    await expect(germanRow).toBeVisible({
        timeout: 25000,
    });

    await germanRow.dblclick();

    await expect(page).toHaveURL(/\/individual-teacher-view\/21$/, {
        timeout: 25000,
    });

    await expect(page.getByText(/Cargando expediente del docente.../i)).toBeHidden({
        timeout: 15000,
    });

    await expect(page.getByText(/GERMAN GABRIEL OROZCO PISQUIY/i)).toBeVisible({
        timeout: 25000,
    });

    await expect(page.getByText(/Expediente Docente/i)).toBeVisible();

    await expect(page.getByText(/Análisis por Sentimiento/i)).toBeVisible({
        timeout: 25000,
    });

    const curso526 = page
        .locator('.itv-class-card')
        .filter({ hasText: /curso 5 - 26/i })
        .first();

    await expect(curso526).toBeVisible({
        timeout: 25000,
    });

    const notaValue = curso526.locator('.itv-note-value');

    await expect(curso526.getByText(/Nota:/i)).toBeVisible();

    await expect(notaValue).toHaveText('••••');

    await curso526
        .getByRole('button', { name: 'Mostrar nota' })
        .click();

    await expect(notaValue).toHaveText('Sin nota', {
        timeout: 10000,
    });

    await curso526
        .getByRole('button', { name: 'Ocultar nota' })
        .click();

    await expect(notaValue).toHaveText('••••', {
        timeout: 10000,
    });

    await curso526
        .getByRole('button', { name: /Analizar comentarios/i })
        .click();

    await expect(page.getByText(/Se están analizando los comentarios/i)).toBeVisible({
        timeout: 10000,
    });

    await expect(page.getByText(/Se están analizando los comentarios/i)).toBeHidden({
        timeout: 10000,
    });

    await curso526
        .getByRole('button', { name: /Ver comentarios/i })
        .click();

    await expect(curso526.getByText(/Comentarios Positivos/i)).toBeVisible({
        timeout: 25000,
    });

    await expect(curso526.getByText(/Comentarios Negativos/i)).toBeVisible({
        timeout: 25000,
    });

    // await page.pause();

});