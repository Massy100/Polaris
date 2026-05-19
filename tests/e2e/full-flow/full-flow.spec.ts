import { test, expect, Page, Locator } from '@playwright/test';
import path from 'path';

test.use({
    acceptDownloads: true,
});

async function login(page: Page) {
    await page.goto('/sign-in');

    await expect(page).toHaveURL(/sign-in/);

    await expect(
        page.getByText(/Sistema De Gestión Académica/i)
    ).toBeVisible();

    await expect(
        page.getByText(/Universidad Rafael Landívar/i)
    ).toBeVisible();

    await expect(
        page.getByText(/El conocimiento/i)
    ).toBeVisible();

    await page
        .getByLabel(/email/i)
        // Add a email that enter into the App
        .fill("");

    await page
        .getByRole('button', { name: /continue|continuar/i })
        .click();

    await page
        .locator('input[name="password"]')
        // Add a password that enter into the App
        .fill("");

    await page
        .getByRole('button', {
            name: /continue|continuar|sign in|iniciar sesión/i,
        })
        .click();

    await page.pause();

    await expect(page).toHaveURL(/top-of-page/, {
        timeout: 15000,
    });

    await expect(
        page.getByRole('heading', {
            name: /Sistema de Gestión Académica - Polaris/i,
        })
    ).toBeVisible({
        timeout: 25000,
    });
}

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

async function waitForHistoryViewToLoad(page: Page) {
    await expect(page.getByText(/Cargando\.\.\./i)).toBeHidden({
        timeout: 45000,
    });

    await expect(page.getByText(/Estamos obteniendo la información/i)).toBeHidden({
        timeout: 45000,
    });
}

async function fillInputByFieldLabel(
    modal: Locator,
    label: string,
    value: string
) {
    const field = modal
        .locator('.cm-form-field')
        .filter({
            hasText: new RegExp(`^${label.replace('*', '\\*')}`, 'i'),
        })
        .first();

    await field.locator('input').fill(value);
}

async function createCoordinator(
    page: Page,
    coordinator: {
        firstName: string;
        lastName: string;
        username: string;
        code: string;
        email: string;
        department: string;
        role: string;
    }
) {
    await page.getByRole('button', { name: /Añadir Coordinador/i }).click();

    await expect(page.getByText(/Nuevo Coordinador/i)).toBeVisible({
        timeout: 15000,
    });

    const modal = page.locator('.cm-form').first();

    await fillInputByFieldLabel(modal, 'Nombres', coordinator.firstName);
    await fillInputByFieldLabel(modal, 'Apellidos', coordinator.lastName);
    await fillInputByFieldLabel(modal, 'Nombre de Usuario', coordinator.username);
    await fillInputByFieldLabel(modal, 'Código', coordinator.code);
    await fillInputByFieldLabel(modal, 'Correo Institucional', coordinator.email);
    await fillInputByFieldLabel(modal, 'Departamento', coordinator.department);
    await fillInputByFieldLabel(modal, 'Rol', coordinator.role);

    await page.getByRole('button', { name: /Guardar Cambios/i }).click();

    await waitForTableLoad(page);

    await expect(
        page.getByRole('row').filter({
            hasText: `${coordinator.firstName} ${coordinator.lastName}`,
        })
    ).toBeVisible({
        timeout: 30000,
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

async function runHistoryViewFlow(page: Page) {
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

    const pageSizeInput = historyPagination.locator('#pageSize');

    if (await pageSizeInput.isVisible().catch(() => false)) {
        await pageSizeInput.fill('1');
        await pageSizeInput.press('Enter');

        await expect(page.locator('.hv-list-card')).toHaveCount(1, {
            timeout: 15000,
        });
    }
}

test('Flujo semicompleto de Polaris', async ({ page }) => {
    test.setTimeout(900_000);

    const stamp = Date.now();

    await login(page);

    // BULK UPLOAD - descargar las plantillas

    await goHome(page);

    await page.locator('a[href="/bulk-upload"]').click();

    await expect(page).toHaveURL(/\/bulk-upload$/);

    await expect(
        page.getByRole('heading', {
            name: /Importación de Expedientes Docentes/i,
        })
    ).toBeVisible({
        timeout: 25000,
    });

    await page
        .getByRole('button', { name: /Portafolio Profesional/i })
        .click();

    await expect(
        page.getByRole('heading', {
            name: /Carga de Portafolio Profesional/i,
        })
    ).toBeVisible();

    const portafolioDownloadPromise = page.waitForEvent('download');

    await page
        .getByRole('button', { name: /Descargar Plantilla/i })
        .click();

    const portafolioDownload = await portafolioDownloadPromise;

    expect(portafolioDownload.suggestedFilename()).toBe(
        'plantilla_credenciales.csv'
    );

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
        page.getByRole('heading', {
            name: /Carga de Evaluaciones Estudiantiles/i,
        })
    ).toBeVisible();

    const evaluacionesDownloadPromise = page.waitForEvent('download');

    await page
        .getByRole('button', { name: /Descargar Plantilla/i })
        .click();

    const evaluacionesDownload = await evaluacionesDownloadPromise;

    expect(evaluacionesDownload.suggestedFilename()).toBe(
        'plantilla_evaluaciones.csv'
    );

    await evaluacionesDownload.saveAs(
        path.join('test-results', evaluacionesDownload.suggestedFilename())
    );

    await expect(page.getByText(/Plantilla descargada/i)).toBeVisible({
        timeout: 10000,
    });

    // BULK UPLOAD - carga de los archivos

    const portafolioFile = path.resolve(
        'tests/fixtures/bulk-upload/portafolio-e2e.csv'
    );

    const evaluacionesFile = path.resolve(
        'tests/fixtures/bulk-upload/evaluaciones-e2e.csv'
    );

    const fileInput = page.locator('input[type="file"]');

    await page
        .getByRole('button', { name: /Portafolio Profesional/i })
        .click();

    await expect(
        page.getByRole('heading', {
            name: /Carga de Portafolio Profesional/i,
        })
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

    await expect(page.getByText(/Archivos Listos para Procesar/i)).toBeVisible();

    const guardarPortafolioBtn = page.getByRole('button', {
        name: /Guardar Portafolio \(1\)/i,
    });

    await expect(guardarPortafolioBtn).toBeVisible();

    await guardarPortafolioBtn.click();

    await expect(page.getByRole('button', { name: /Guardando/i })).toBeVisible({
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
        page.getByRole('heading', {
            name: /Carga de Evaluaciones Estudiantiles/i,
        })
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

    await expect(page.getByText(/Archivos Listos para Procesar/i)).toBeVisible();

    const guardarEvaluacionesBtn = page.getByRole('button', {
        name: /Guardar Evaluaciones \(1\)/i,
    });

    await expect(guardarEvaluacionesBtn).toBeVisible();

    await guardarEvaluacionesBtn.click();

    await expect(page.getByRole('button', { name: /Guardando/i })).toBeVisible({
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

    // GESTIÓN DE OBSERVACIONES

    await goHome(page);

    await page.getByText(/Gestión de Observaciones/i).click();

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
    await expect(pendingDialog).toBeVisible({ timeout: 15000 });

    await pendingDialog
        .getByPlaceholder(/Buscar por nombre o código/i)
        .fill('Ve');

    const veronicaRow = pendingDialog
        .getByText(/Código:\s*18504/i)
        .locator('xpath=ancestor::div[.//button[normalize-space()="Evaluar"]][1]');

    await expect(veronicaRow).toBeVisible({ timeout: 15000 });

    await veronicaRow.getByRole('button', { name: /^Evaluar$/i }).click();

    const evalDialog = page
        .getByRole('dialog')
        .filter({ hasText: /Configurar Sesión de Observación/i });

    await expect(evalDialog).toBeVisible({ timeout: 15000 });

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

    // PERFORMANCE ALERT

    await goHome(page);

    await page.locator('a[href="/performance-alert"]').click();

    await expect(page).toHaveURL(/\/performance-alert$/);

    await expect(
        page.getByRole('heading', { name: /Alertas de Desempeño/i })
    ).toBeVisible();

    const searchInput = page.getByPlaceholder(/Buscar por nombre o materia/i);

    await expect(searchInput).toBeVisible();

    await searchInput.fill('V');

    await page.getByRole('button', { name: /Siguiente/i }).click();

    const linaCard = await getTeacherCard(page, 'LINA VILLAGRÁN COMPARINI de BARILLAS');
    const veroCard = await getTeacherCard(page, 'VERÓNICA ELIZABETH COJULÚN LÓPEZ');

    await expect(linaCard.locator('.pa-status-badge')).toContainText(
        /En Peligro/i
    );

    await linaCard.getByRole('button', { name: /^Bueno$/i }).click();

    await expect(linaCard.locator('.pa-status-badge')).toContainText(
        /Buen Desempeño/i
    );

    await expect(veroCard.locator('.pa-status-badge')).toContainText(
        /En Peligro/i
    );

    await veroCard.getByRole('button', { name: /^Bueno$/i }).click();

    await expect(veroCard.locator('.pa-status-badge')).toContainText(
        /Buen Desempeño/i
    );

    await searchInput.fill('');

    await expect(page.getByText(/VERÓNICA ELIZABETH COJULÚN LÓPEZ/i)).toBeVisible({
        timeout: 15000,
    });

    await page.locator('.pa-filter-select').selectOption('good');

    await expect(page.getByText(/VERÓNICA ELIZABETH COJULÚN LÓPEZ/i)).toBeVisible({
        timeout: 15000,
    });

    await expect(page.getByText(/LINA VILLAGRÁN COMPARINI de BARILLAS/i)).toBeVisible({
        timeout: 15000,
    });

    const visibleCards = page.locator('.pa-teacher-card');
    const visibleCardsCount = await visibleCards.count();

    for (let i = 0; i < visibleCardsCount; i++) {
        await expect(
            visibleCards.nth(i).locator('.pa-status-badge')
        ).toContainText(/Buen Desempeño/i);
    }

    // RANKING INSTITUCIONAL

    await goHome(page);

    await page.locator('a[href="/institutional-ranking"]').click();

    await expect(page).toHaveURL(/\/institutional-ranking$/);

    await expect(
        page.getByRole('heading', { name: /Ranking de Docentes/i })
    ).toBeVisible();

    await waitForRankingToLoad(page);

    const rankingRows = page.locator('tbody tr.ir-tr-clickable');

    await expect(rankingRows.nth(3)).toBeVisible({
        timeout: 25000,
    });

    await rankingRows.nth(3).click();

    await expect(page).toHaveURL(/\/individual-teacher-view\/24$/, {
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

    await expect(rankingRows.nth(4)).toBeVisible({
        timeout: 25000,
    });

    await rankingRows.nth(4).click();

    await expect(page).toHaveURL(/\/individual-teacher-view\/21$/, {
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

    // SETTINGS

    await goHome(page);

    const categoryName = `Categoria E2E ${stamp}`;
    const categoryDescription =
        'Categoría creada automáticamente por prueba E2E';

    await goToSettingsFromSidebar(page);

    // Mi perfil

    await openSettingsCard(page, /Mi Perfil/i);

    await expect(page).toHaveURL(/\/settings\/profile$/, {
        timeout: 15000,
    });

    await expect(
        page.getByRole('heading', {
            name: /^Mi Perfil$/,
            level: 1,
        })
    ).toBeVisible({
        timeout: 30000,
    });

    await expect(
        page.getByRole('heading', {
            name: /^Información Personal$/,
            level: 2,
        })
    ).toBeVisible({
        timeout: 30000,
    });

    await expect(page.getByText(/Nombre/i)).toBeVisible({
        timeout: 15000,
    });
    await expect(page.getByText(/Apellido/i)).toBeVisible({
        timeout: 15000,
    });
    await expect(page.getByText(/Correo electrónico/i)).toBeVisible({
        timeout: 15000,
    });
    await expect(page.getByText(/Teléfono/i)).toBeVisible({
        timeout: 15000,
    });
    await expect(page.getByText(/Rol en el sistema/i)).toBeVisible({
        timeout: 15000,
    });

    await page.getByRole('button', { name: /Seguridad/i }).click();

    await expect(
        page.getByRole('heading', {
            name: /^Cambiar Contraseña$/,
            level: 2,
        })
    ).toBeVisible();

    await expect(page.getByText(/Contraseña actual/i)).toBeVisible();
    await expect(page.getByText(/Confirmar nueva contraseña/i)).toBeVisible();

    await page.getByRole('button', { name: /Preferencias/i }).click();

    await expect(
        page.getByRole('heading', {
            name: /^Preferencias del Sistema$/,
            level: 2,
        })
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
        page.getByText(
            /Carga de Pensum Realizada/i
        )
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
        page.getByText(
            /Historial de Biblioteca|Sin plantillas disponibles/i
        )
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

    await expect(
        page.getByText(/Cursos registrados:/i)
    ).toBeVisible();

    await expect(
        page.getByText(/Estado de la Base:/i)
    ).toBeVisible();

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

    await page
        .getByRole('button', { name: /Guardar Configuración/i })
        .click();

    await expect(
        page.getByText(
            /Guardando.../i
        )
    ).toBeVisible({
        timeout: 45000,
    });

    await goToSettingsFromSidebar(page);

    // DOCENTES

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

    await expect(teacherRow).toContainText('jorgetello.completa.e2e@universidad.edu.gt', {
        timeout: 15000,
    });

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

    // HISTORICOS
    await runHistoryViewFlow(page);

    // await page.pause();
});