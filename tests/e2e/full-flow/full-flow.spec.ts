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

    // COORDINADORES

    await goHome(page);

    await page.getByText(/Gestión de Coordinadores/i).click();

    await expect(page).toHaveURL(/\/coord-management$/);

    await expect(
        page.getByRole('heading', { name: /Gestión de Coordinadores/i })
    ).toBeVisible();

    await waitForTableLoad(page);

    const coordinatorOne = {
        firstName: 'Coordinador E2E',
        lastName: `Uno ${stamp}`,
        username: `coord_e2e_uno_${stamp}`,
        code: `E2E-${stamp}-1`,
        email: `coord.e2e.uno.${stamp}@universidad.edu.gt`,
        department: 'Facultad de Ingeniería',
        role: 'Coordinador',
    };

    const coordinatorTwo = {
        firstName: 'Coordinador E2E',
        lastName: `Dos ${stamp}`,
        username: `coord_e2e_dos_${stamp}`,
        code: `E2E-${stamp}-2`,
        email: `coord.e2e.dos.${stamp}@universidad.edu.gt`,
        department: 'Facultad de Ingeniería',
        role: 'Coordinador',
    };

    await createCoordinator(page, coordinatorOne);
    await createCoordinator(page, coordinatorTwo);

    await page
        .getByPlaceholder(/Búsqueda por nombre/i)
        .fill('Coordinador E2E');

    await expect(
        page.getByRole('row').filter({ hasText: coordinatorOne.lastName })
    ).toBeVisible({
        timeout: 15000,
    });

    await expect(
        page.getByRole('row').filter({ hasText: coordinatorTwo.lastName })
    ).toBeVisible({
        timeout: 15000,
    });

    const coordinatorPageSizeInput = page.locator('#pageSize');

    await expect(coordinatorPageSizeInput).toBeVisible();

    await coordinatorPageSizeInput.fill('1');
    await coordinatorPageSizeInput.press('Enter');

    await expect(page.getByText(/Página 1 de 2/i)).toBeVisible({
        timeout: 15000,
    });

    const coordinatorRows = page.locator('tbody tr.cm-tr');

    await expect(coordinatorRows).toHaveCount(1, {
        timeout: 15000,
    });

    await page.getByRole('button', { name: /Siguiente/i }).click();

    await expect(page.getByText(/Página 2 de 2/i)).toBeVisible({
        timeout: 15000,
    });

    await expect(coordinatorRows).toHaveCount(1, {
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

    await searchInput.fill('An');

    const anaCard = await getTeacherCard(page, 'Ana Rodríguez Silva');
    const juanCard = await getTeacherCard(page, 'Juan Pérez Martínez');

    await expect(anaCard.locator('.pa-status-badge')).toContainText(
        /Advertencia/i
    );

    await anaCard.getByRole('button', { name: /^Bueno$/i }).click();

    await expect(anaCard.locator('.pa-status-badge')).toContainText(
        /Buen Desempeño/i
    );

    await expect(juanCard.locator('.pa-status-badge')).toContainText(
        /Buen Desempeño/i
    );

    await juanCard.getByRole('button', { name: /^Peligro$/i }).click();

    await expect(juanCard.locator('.pa-status-badge')).toContainText(
        /En Peligro/i
    );

    await searchInput.fill('');

    await expect(page.getByText(/María García López/i)).toBeVisible({
        timeout: 15000,
    });

    await page.locator('.pa-filter-select').selectOption('danger');

    await expect(page.getByText(/Juan Pérez Martínez/i)).toBeVisible({
        timeout: 15000,
    });

    await expect(page.getByText(/Ana Rodríguez Silva/i)).toBeHidden({
        timeout: 15000,
    });

    const visibleCards = page.locator('.pa-teacher-card');
    const visibleCardsCount = await visibleCards.count();

    for (let i = 0; i < visibleCardsCount; i++) {
        await expect(
            visibleCards.nth(i).locator('.pa-status-badge')
        ).toContainText(/En Peligro/i);
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

    await expect(rankingRows.nth(5)).toBeVisible({
        timeout: 25000,
    });

    await rankingRows.nth(5).click();

    await expect(page).toHaveURL(/\/individual-teacher-view\/18$/, {
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

    await expect(page).toHaveURL(/\/individual-teacher-view\/20$/, {
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
        page.getByText(
            /Configuración guardada|guardada correctamente|activada correctamente/i
        )
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

    const failedAccessCheckbox = failedAccessCard.locator(
        'input[type="checkbox"]'
    );

    await failedAccessCard.locator('.profile-toggle-track').click();

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

    await expect(
        page.getByText(/Se están analizando los comentarios/i)
    ).toBeVisible({
        timeout: 10000,
    });

    await expect(
        page.getByText(/Se están analizando los comentarios/i)
    ).toBeHidden({
        timeout: 15000,
    });

    await curso526.getByRole('button', { name: /Ver comentarios/i }).click();

    await expect(curso526.getByText(/Comentarios Positivos/i)).toBeVisible({
        timeout: 25000,
    });

    await expect(curso526.getByText(/Comentarios Negativos/i)).toBeVisible({
        timeout: 25000,
    });

    await page.pause();
});