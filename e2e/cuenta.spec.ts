import { expect, test, type Browser, type Page } from '@playwright/test'

const email = `e2e-${Date.now()}@example.com`, password = 'clave-de-prueba-1'
async function device(browser: Browser) { const ctx = await browser.newContext(); const page = await ctx.newPage(); const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message)); return { ctx, page, errors } }
const settings = async (page: Page) => { await page.goto('/profile'); await page.getByRole('tab', { name: 'Ajustes y datos' }).click() }
const syncNow = async (page: Page) => { await settings(page); await page.getByRole('button', { name: 'Sincronizar ahora' }).click(); await expect(page.getByText('Sincronizado.')).toBeVisible() }

test('cuenta: registrar en un dispositivo, entrar en otro y sincronizar en ambos sentidos', async ({ browser }) => {
  // Dispositivo A: onboarding, un entrenamiento y crear cuenta
  const A = await device(browser)
  await A.page.goto('/')
  for (let i = 0; i < 3; i++) await A.page.getByRole('button', { name: 'Continuar' }).click()
  await A.page.getByLabel('Nombre (opcional)').fill('Ana')
  await A.page.getByRole('button', { name: 'Crear mi rutina' }).click()
  await A.page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await A.page.getByLabel(/Peso serie 1/).first().fill('40')
  await A.page.getByRole('button', { name: 'Completar serie 1' }).first().click()
  await A.page.getByRole('button', { name: 'Finalizar' }).click()
  await A.page.getByRole('dialog').getByRole('button', { name: 'Finalizar' }).click()
  await expect(A.page).toHaveURL(/session\//)

  await settings(A.page)
  await A.page.getByLabel('Correo', { exact: true }).fill(email)
  await A.page.locator('form input[type=password]').first().fill('corta')
  await A.page.getByRole('button', { name: 'Crear cuenta y sincronizar' }).click()
  await expect(A.page.getByText(/Sesión iniciada como/)).toHaveCount(0) // el navegador exige 10 caracteres
  await A.page.locator('form input[type=password]').first().fill(password)
  await A.page.getByRole('button', { name: 'Crear cuenta y sincronizar' }).click()
  await expect(A.page.getByText(`Sesión iniciada como ${email}`)).toBeVisible()
  await expect(A.page.getByText(/Última sincronización/)).toBeVisible()
  await A.page.screenshot({ path: 'docs/capturas/13-cuenta.png' })

  // Dispositivo B: «Ya tengo cuenta» desde el onboarding → llegan perfil, rutina e historial
  const B = await device(browser)
  await B.page.goto('/')
  await B.page.getByRole('button', { name: /Ya tengo cuenta/ }).click()
  await B.page.getByLabel('Correo', { exact: true }).fill(email)
  await B.page.locator('form input[type=password]').first().fill('equivocada-123')
  await B.page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()
  await expect(B.page.getByRole('alert')).toHaveText('Correo o contraseña incorrectos.')
  await B.page.locator('form input[type=password]').first().fill(password)
  await B.page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()
  await expect(B.page.getByRole('heading', { name: /Ana/ })).toBeVisible()
  await B.page.goto('/progress')
  await expect(B.page.getByRole('link', { name: /Cuerpo completo A/ })).toBeVisible()

  // B registra peso corporal y elimina la rutina → A lo recibe
  await B.page.getByLabel(/Peso de hoy/).fill('80'); await B.page.getByRole('button', { name: 'Guardar' }).click()
  await B.page.goto('/train'); await B.page.locator('a[href^="/routine/"]').first().click()
  await B.page.getByRole('button', { name: 'Eliminar' }).click(); await B.page.getByRole('button', { name: 'Eliminar rutina' }).click()
  await expect(B.page.getByText('Sin rutinas todavía')).toBeVisible()
  await syncNow(B.page)
  await syncNow(A.page)
  await A.page.goto('/train'); await expect(A.page.getByText('Sin rutinas todavía')).toBeVisible()
  await A.page.goto('/progress'); await expect(A.page.getByRole('link', { name: /Cuerpo completo A/ })).toBeVisible() // el historial sigue

  // La sesión sobrevive a recargar; cerrar sesión conserva los datos locales
  await A.page.reload(); await settings(A.page)
  await expect(A.page.getByText(`Sesión iniciada como ${email}`)).toBeVisible()
  await A.page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(A.page.getByRole('button', { name: 'Crear cuenta y sincronizar' })).toBeVisible()
  await A.page.goto('/progress'); await expect(A.page.getByRole('link', { name: /Cuerpo completo A/ })).toBeVisible()

  // Eliminar la cuenta desde B: exige contraseña; después ya no se puede entrar
  await settings(B.page)
  await B.page.getByRole('button', { name: 'Eliminar cuenta' }).click()
  await B.page.getByLabel('Confirma tu contraseña').fill(password)
  await B.page.getByRole('dialog').getByRole('button', { name: 'Eliminar cuenta' }).click()
  await expect(B.page.getByRole('button', { name: 'Crear cuenta y sincronizar' })).toBeVisible()
  await B.page.getByRole('button', { name: 'Ya tengo cuenta', exact: true }).click()
  await B.page.getByLabel('Correo', { exact: true }).fill(email); await B.page.locator('form input[type=password]').first().fill(password)
  await B.page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()
  await expect(B.page.getByRole('alert')).toHaveText('Correo o contraseña incorrectos.')
  expect([...A.errors, ...B.errors]).toEqual([])
  await A.ctx.close(); await B.ctx.close()
})
