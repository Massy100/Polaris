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

test('gestiona flujo básico de observaciones y abre evaluación', async ({ page }) => {
    test.setTimeout(120_000);

    await goHome(page);

    await page.getByRole('button', { name: /Observaciones/i }).click();

    await expect(page).toHaveURL(/\/observations$/, {
        timeout: 15000,
    });

    await expect(
        page.getByRole('heading', {
            name: /^Gestión de Observaciones$/,
            level: 1,
        })
    ).toBeVisible({
        timeout: 30000,
    });

    await page.getByRole('button', { name: /Ver lista completa/i }).click();

    const pendingDialog = page.getByRole('dialog');

    await expect(pendingDialog).toBeVisible({
        timeout: 15000,
    });

    await pendingDialog
        .getByPlaceholder(/Buscar por nombre o código/i)
        .fill('Ve');

    const veronicaRow = pendingDialog
        .getByText(/Código:\s*18504/i)
        .locator('xpath=ancestor::div[.//button[normalize-space()="Evaluar"]][1]');

    await expect(veronicaRow).toBeVisible({
        timeout: 15000,
    });

    await veronicaRow.getByRole('button', { name: /^Evaluar$/i }).click();

    const evalDialog = page
        .getByRole('dialog')
        .filter({ hasText: /Configurar Sesión de Observación/i });

    await expect(evalDialog).toBeVisible({
        timeout: 15000,
    });

    const teacherSelect = evalDialog.getByRole('combobox').first();
    const courseSelect = evalDialog.getByRole('combobox').nth(1);

    await expect(teacherSelect).toHaveValue('17');
    await expect(courseSelect).toHaveValue('16');

    await evalDialog
        .locator('.url-field')
        .filter({ hasText: /Hora de Clase/i })
        .locator('input')
        .fill('10:20');

    await evalDialog
        .locator('.url-field')
        .filter({ hasText: /Instrumento de Evaluación/i })
        .locator('select')
        .selectOption('4');

    await evalDialog
        .getByRole('button', { name: /Comenzar Evaluación/i })
        .click();

    await expect(page).toHaveURL(/\/observations\/evaluate\?/, {
        timeout: 15000,
    });

    await expect(page).toHaveURL(/teacher_id=17/);
    await expect(page).toHaveURL(/template_id=4/);
    await expect(page).toHaveURL(/course_id=15/);

    await expect(
        page.getByRole('button', { name: /Cancelar Evaluación/i })
    ).toBeVisible({
        timeout: 30000,
    });

    await page.getByRole('button', { name: /Cancelar Evaluación/i }).click();

    await expect(page).toHaveURL(/\/observations$/, {
        timeout: 15000,
    });

    // await page.pause()
});