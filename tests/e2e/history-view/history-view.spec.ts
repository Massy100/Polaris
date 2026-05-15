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

async function waitForHistoryViewToLoad(page: Page) {
    await expect(page.getByText(/Cargando\.\.\./i)).toBeHidden({
        timeout: 45000,
    });

    await expect(page.getByText(/Estamos obteniendo la información/i)).toBeHidden({
        timeout: 45000,
    });
}

test('navega cursos históricos por profesor y por curso', async ({ page }) => {
    test.setTimeout(120_000);

    await goHome(page);

    await page.locator('a[href="/history-view"]').click();

    await expect(page).toHaveURL(/\/history-view$/);

    await expect(
        page.getByRole('heading', { name: /Cursos Históricos/i })
    ).toBeVisible({
        timeout: 15000,
    });

    await expect(page.getByText(/Historial Académico/i)).toBeVisible({
        timeout: 15000,
    });

    await waitForHistoryViewToLoad(page);

    await expect(
        page.getByRole('button', { name: /^Profesores$/i })
    ).toBeVisible({
        timeout: 15000,
    });

    await expect(
        page.getByText(/No hay profesor seleccionado/i)
    ).toBeVisible({
        timeout: 15000,
    });

    const freddyProfessorCard = page
        .locator('.hv-list-card')
        .filter({
            hasText: /FREDDY ALEJANDRO GONZÁLEZ ARMAS/i,
        })
        .first();

    await expect(freddyProfessorCard).toBeVisible({
        timeout: 25000,
    });

    await freddyProfessorCard.click();

    const professorDetail = page.locator('.hv-detail-content').first();

    await expect(professorDetail).toBeVisible({
        timeout: 15000,
    });

    await expect(professorDetail).toContainText(
        /FREDDY ALEJANDRO GONZÁLEZ ARMAS/i,
        {
            timeout: 15000,
        }
    );

    await expect(professorDetail.locator('.hv-history-list')).toBeVisible({
        timeout: 15000,
    });

    const professorHistoryCards = professorDetail.locator('.hv-history-card');
    const professorHistoryCount = await professorHistoryCards.count();

    if (professorHistoryCount > 0) {
        await expect(professorHistoryCards.first()).toBeVisible({
            timeout: 15000,
        });
    } else {
        await expect(
            professorDetail.getByText(/Sin cursos asociados/i)
        ).toBeVisible({
            timeout: 15000,
        });
    }

    await page.getByRole('button', { name: /^Cursos$/i }).click();

    await waitForHistoryViewToLoad(page);

    await expect(
        page.getByText(/No hay curso seleccionado/i)
    ).toBeVisible({
        timeout: 15000,
    });

    const arquitecturaCursoCard = page
        .locator('.hv-list-card')
        .filter({
            hasText: /ARQUITECTURA DEL COMPUTADOR/i,
        })
        .first();

    await expect(arquitecturaCursoCard).toBeVisible({
        timeout: 25000,
    });

    await arquitecturaCursoCard.click();

    const courseDetail = page.locator('.hv-detail-content').first();

    await expect(courseDetail).toBeVisible({
        timeout: 15000,
    });

    await expect(courseDetail).toContainText(
        /ARQUITECTURA DEL COMPUTADOR/i,
        {
            timeout: 15000,
        }
    );

    await expect(courseDetail.locator('.hv-history-list')).toBeVisible({
        timeout: 15000,
    });

    const courseHistoryCards = courseDetail.locator('.hv-history-card');
    const courseHistoryCount = await courseHistoryCards.count();

    if (courseHistoryCount > 0) {
        await expect(courseHistoryCards.first()).toBeVisible({
            timeout: 15000,
        });
    } else {
        await expect(
            courseDetail.getByText(/Sin docentes asociados/i)
        ).toBeVisible({
            timeout: 15000,
        });
    }

    const historyPagination = page.locator('.hv-sidebar-pagination').first();

    await expect(historyPagination).toBeVisible({
        timeout: 15000,
    });

    const historyPageSizeInput = historyPagination.locator('#pageSize');

    if (await historyPageSizeInput.isVisible().catch(() => false)) {
        await historyPageSizeInput.fill('1');
        await historyPageSizeInput.press('Enter');

        await expect(page.locator('.hv-list-card')).toHaveCount(1, {
            timeout: 15000,
        });
    }

    // await page.pause()
});