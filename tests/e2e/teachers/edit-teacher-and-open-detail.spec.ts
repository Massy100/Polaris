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

async function waitForTableLoad(page: Page) {
    await expect(page.getByText(/Cargando registros/i)).toBeHidden({
        timeout: 45000,
    });
}

test('edita correo institucional de docente y abre su vista individual', async ({ page }) => {
    test.setTimeout(120_000);

    await goHome(page);

    await page.getByText(/Gestión de Docentes/i).click();

    await expect(page).toHaveURL(/user-management/);

    await expect(
        page.getByRole('heading', { name: 'Gestión de Docentes' })
    ).toBeVisible();

    await waitForTableLoad(page);

    await page.getByPlaceholder(/Búsqueda por nombre/i).fill('JORGE');

    await waitForTableLoad(page);

    const teacherRow = page
        .getByRole('row')
        .filter({ hasText: /JORGE ESTUARDO TELLO MONZÓN/i })
        .filter({ hasText: /30460/ });

    await expect(teacherRow).toBeVisible({
        timeout: 15000,
    });

    await teacherRow.locator('button[title="Modificar Registro"]').click();

    await expect(page.getByText('Actualizar Docente')).toBeVisible();

    await page
        .getByPlaceholder('ejemplo@universidad.edu')
        .fill('jorgetello.completa.e2e@universidad.edu.gt');

    await page.getByRole('button', { name: /Guardar Cambios/i }).click();

    await waitForTableLoad(page);

    await expect(page.getByText('Actualizar Docente')).toBeHidden({
        timeout: 15000,
    });

    await expect(teacherRow).toContainText(
        'jorgetello.completa.e2e@universidad.edu.gt',
        {
            timeout: 15000,
        }
    );

    await teacherRow.dblclick();

    await expect(page).toHaveURL(/\/individual-teacher-view\/23$/, {
        timeout: 25000,
    });

    await expect(
        page.getByText(/Cargando expediente del docente.../i)
    ).toBeHidden({
        timeout: 15000,
    });

    await expect(page.getByText(/JORGE ESTUARDO TELLO MONZÓN/i)).toBeVisible({
        timeout: 25000,
    });

    await expect(page.getByText(/Expediente Docente/i)).toBeVisible();

    await expect(page.getByText(/Análisis por Sentimiento/i)).toBeVisible({
        timeout: 25000,
    });

    await page.getByRole('button', { name: /Volver al listado/i }).click();

    await expect(page).toHaveURL(/\/user-management$/, {
        timeout: 25000,
    });

    await expect(
        page.getByRole('heading', { name: 'Gestión de Docentes' })
    ).toBeVisible();

    await waitForTableLoad(page);

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

    await expect(
        page.getByText(/Cargando expediente del docente.../i)
    ).toBeHidden({
        timeout: 15000,
    });

    await expect(
        page.getByText(/GERMAN GABRIEL OROZCO PISQUIY/i)
    ).toBeVisible({
        timeout: 25000,
    });

    await expect(page.getByText(/Expediente Docente/i)).toBeVisible();

    await expect(page.getByText(/Análisis por Sentimiento/i)).toBeVisible({
        timeout: 25000,
    });

    await page.getByRole('button', { name: '2do. Semestre 2025' }).click();

    const curso526 = page
        .locator('.itv-class-card')
        .filter({ hasText: /curso 5/i })
        .first();

    await expect(curso526).toBeVisible({
        timeout: 30000,
    });

    const notaValue = curso526.locator('.itv-note-value');

    await expect(curso526.getByText(/Nota:/i)).toBeVisible();

    await expect(notaValue).toHaveText('••••');

    await curso526.getByRole('button', { name: 'Mostrar nota' }).click();

    await expect(notaValue).toHaveText('Sin nota', {
        timeout: 10000,
    });

    await curso526.getByRole('button', { name: 'Ocultar nota' }).click();

    await expect(notaValue).toHaveText('••••', {
        timeout: 10000,
    });

    await curso526
        .getByRole('button', { name: /Analizar comentarios/i })
        .click();

    const errorDialog = page
        .getByRole('dialog')
        .filter({
            hasText: /Error en el análisis/i,
        });

    await expect(errorDialog).toBeVisible({
        timeout: 15000,
    });

    await expect(
        errorDialog.getByText(/No hay comentarios para analizar/i)
    ).toBeVisible({
        timeout: 15000,
    });

    await errorDialog
        .getByRole('button', { name: 'Cerrar', exact: true })
        .last()
        .click();

    await expect(errorDialog).toBeHidden({
        timeout: 15000,
    });

    // await page.pause()
});