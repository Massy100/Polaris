import { test, expect, Locator, Page } from '@playwright/test';

test.use({
    storageState: 'tests/.auth/user.json',
});

async function fillInputByFieldLabel(modal: Locator, label: string, value: string) {
    const field = modal
        .locator('.cm-form-field')
        .filter({ hasText: new RegExp(`^${label.replace('*', '\\*')}`, 'i') })
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

    // await expect(page.getByText(/Nuevo Coordinador/i)).toBeHidden({
    //     timeout: 30000,
    // });

    await expect(page.getByText(/Cargando registros/i)).toBeHidden({
        timeout: 45000,
    });

    await expect(
        page.getByRole('row').filter({
            hasText: `${coordinator.firstName} ${coordinator.lastName}`,
        })
    ).toBeVisible({
        timeout: 30000,
    });
}

test('crea coordinadores y valida paginación de 1 registro por página', async ({ page }) => {
    test.setTimeout(120_000);

    const stamp = Date.now();

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

    await page.goto('/top-of-page');

    await expect(
        page.getByRole('heading', { name: /Sistema de Gestión Académica - Polaris/i })
    ).toBeVisible();

    await page.getByText(/Gestión de Coordinadores/i).click();

    await expect(page).toHaveURL(/\/coord-management$/);

    await expect(
        page.getByRole('heading', { name: /Gestión de Coordinadores/i })
    ).toBeVisible();

    await expect(page.getByText(/Cargando registros/i)).toBeHidden({
        timeout: 45000,
    });

    await createCoordinator(page, coordinatorOne);
    await createCoordinator(page, coordinatorTwo);

    await page
        .getByPlaceholder(/Búsqueda por nombre/i)
        .fill(`Coordinador E2E`);

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

    const pageSizeInput = page.locator('#pageSize');

    await expect(pageSizeInput).toBeVisible();
    await pageSizeInput.fill('1');
    await pageSizeInput.press('Enter');

    await expect(page.getByText(/Página 1 de 2/i)).toBeVisible({
        timeout: 15000,
    });

    const dataRows = page.locator('tbody tr.cm-tr');

    await expect(dataRows).toHaveCount(1, {
        timeout: 15000,
    });

    await page.getByRole('button', { name: /Siguiente/i }).click();

    await expect(page.getByText(/Página 2 de 2/i)).toBeVisible({
        timeout: 15000,
    });

    await expect(dataRows).toHaveCount(1, {
        timeout: 15000,
    });

    await page.pause();
});