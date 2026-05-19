import { test, expect } from '@playwright/test';
import path from 'path';

test.use({
    storageState: 'tests/.auth/user.json',
});

test('carga y guarda archivos de portafolio profesional y evaluaciones estudiantiles', async ({ page }) => {
    test.setTimeout(240_000);

    const portafolioFile = path.resolve(
        'tests/fixtures/bulk-upload/portafolio-e2e.csv'
    );

    const evaluacionesFile = path.resolve(
        'tests/fixtures/bulk-upload/evaluaciones-e2e.csv'
    );

    await page.goto('/top-of-page');

    await expect(
        page.getByRole('heading', { name: /Sistema de Gestión Académica - Polaris/i })
    ).toBeVisible();

    await page
        .locator('a[href="/bulk-upload"]')
        .click();

    await expect(page).toHaveURL(/\/bulk-upload$/);

    await expect(
        page.getByRole('heading', { name: /Importación de Expedientes Docentes/i })
    ).toBeVisible({
        timeout: 25000,
    });

    const fileInput = page.locator('input[type="file"]');

    await page
        .getByRole('button', { name: /Portafolio Profesional/i })
        .click();

    await expect(
        page.getByRole('heading', { name: /Carga de Portafolio Profesional/i })
    ).toBeVisible();

    await fileInput.setInputFiles(portafolioFile);

    await expect(
        page.getByText(/1 archivo\(s\) cargado\(s\) correctamente/i)
    ).toBeVisible({
        timeout: 20000,
    });

    await expect(
        page.locator('.bu-preview-card').getByText(/portafolio-e2e\.csv/i)
    ).toBeVisible();

    await expect(
        page.getByText(/Archivos Listos para Procesar/i)
    ).toBeVisible();

    const guardarPortafolioBtn = page.getByRole('button', {
        name: /Guardar Portafolio \(1\)/i,
    });

    await expect(guardarPortafolioBtn).toBeVisible();

    await guardarPortafolioBtn.click();

    await expect(
        page.getByRole('button', { name: /Guardando/i })
    ).toBeVisible({
        timeout: 20000,
    });

    await expect(
        page.getByText(/1 archivo\(s\) guardado\(s\) correctamente/i)
    ).toBeVisible({
        timeout: 30000,
    });

    await expect(
        page.locator('.bu-preview-card').getByText(/portafolio-e2e\.csv/i)
    ).toBeHidden({
        timeout: 25000,
    });

    await page
        .getByRole('button', { name: /Evaluaciones Estudiantiles/i })
        .click();

    await expect(
        page.getByRole('heading', { name: /Carga de Evaluaciones Estudiantiles/i })
    ).toBeVisible();

    await fileInput.setInputFiles(evaluacionesFile);

    await expect(
        page.getByText(/1 archivo\(s\) cargado\(s\) correctamente/i)
    ).toBeVisible({
        timeout: 20000,
    });

    await expect(
        page.locator('.bu-preview-card').getByText(/evaluaciones-e2e\.csv/i)
    ).toBeVisible();

    await expect(
        page.getByText(/Archivos Listos para Procesar/i)
    ).toBeVisible();

    const guardarEvaluacionesBtn = page.getByRole('button', {
        name: /Guardar Evaluaciones \(1\)/i,
    });

    await expect(guardarEvaluacionesBtn).toBeVisible();

    await guardarEvaluacionesBtn.click();

    await expect(
        page.getByRole('button', { name: /Guardando/i })
    ).toBeVisible({
        timeout: 20000,
    });

    await expect(
        page.getByText(/1 archivo\(s\) guardado\(s\) correctamente/i)
    ).toBeVisible({
        timeout: 30000,
    });

    await expect(
        page.locator('.bu-preview-card').getByText(/evaluaciones-e2e\.csv/i)
    ).toBeHidden({
        timeout: 25000,
    });

    // await page.pause();
});