import { test, expect } from '@playwright/test';
import path from 'path';

test.use({
    storageState: 'tests/.auth/user.json',
    acceptDownloads: true,
});

test('descarga plantillas de portafolio profesional y evaluaciones estudiantiles', async ({ page }) => {
    test.setTimeout(120_000);

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
        timeout: 15000,
    });

    await page
        .getByRole('button', { name: /Portafolio Profesional/i })
        .click();

    await expect(
        page.getByRole('heading', { name: /Carga de Portafolio Profesional/i })
    ).toBeVisible();

    const portafolioDownloadPromise = page.waitForEvent('download');

    await page
        .getByRole('button', { name: /Descargar Plantilla/i })
        .click();

    const portafolioDownload = await portafolioDownloadPromise;

    expect(portafolioDownload.suggestedFilename()).toBe('plantilla_credenciales.csv');

    await portafolioDownload.saveAs(
        path.join('test-results', portafolioDownload.suggestedFilename())
    );

    await expect(page.getByText(/Plantilla descargada/i)).toBeVisible({
        timeout: 10000,
    });

    await page
        .getByRole('button', { name: /Evaluaciones Estudiantiles/i })
        .click();

    await expect(
        page.getByRole('heading', { name: /Carga de Evaluaciones Estudiantiles/i })
    ).toBeVisible();

    const evaluacionesDownloadPromise = page.waitForEvent('download');

    await page
        .getByRole('button', { name: /Descargar Plantilla/i })
        .click();

    const evaluacionesDownload = await evaluacionesDownloadPromise;

    expect(evaluacionesDownload.suggestedFilename()).toBe('plantilla_evaluaciones.csv');

    await evaluacionesDownload.saveAs(
        path.join('test-results', evaluacionesDownload.suggestedFilename())
    );

    await expect(page.getByText(/Plantilla descargada/i)).toBeVisible({
        timeout: 10000,
    });

    // await page.pause();
});