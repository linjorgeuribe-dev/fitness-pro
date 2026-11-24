import { expect, test } from '@playwright/test'

test('nutrición, agua, sueño, medidas y foto de progreso', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await page.getByRole('button', { name: 'Reducir grasa corporal' }).click()
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Hombre' }).click()
  await page.getByLabel('Edad').fill('30'); await page.getByLabel('Estatura (cm)').fill('180'); await page.getByLabel('Peso (kg)').fill('80')
  await page.getByRole('button', { name: 'Crear mi rutina' }).click()
  await page.getByRole('link', { name: /Nutrición y cuerpo/ }).click()

  // Objetivos: 1780 kcal basal × 1.375 (3 días) = 2448 → −15 % ≈ 2080; proteína 2 g/kg = 160
  await expect(page.getByText('/ 2080')).toBeVisible()
  await expect(page.getByText('/ 160')).toBeVisible()

  await page.getByLabel('Alimento o comida').fill('Pechuga con arroz')
  await page.getByLabel('Prot. (g)').fill('40'); await page.getByLabel('Carb. (g)').fill('50'); await page.getByLabel('Grasa (g)').fill('10')
  await page.getByRole('button', { name: 'Agregar', exact: true }).click()
  await expect(page.getByText('450 kcal · P 40 · C 50 · G 10')).toBeVisible() // 40·4 + 50·4 + 10·9
  await page.getByRole('button', { name: '+500 ml' }).click(); await page.getByRole('button', { name: '+250 ml' }).click()
  await page.getByLabel('Horas de sueño (anoche)').fill('7.5')
  await page.getByRole('button', { name: 'Nivel de energía: 4 de 5' }).click()
  await page.waitForTimeout(400); await page.screenshot({ path: 'docs/capturas/14-nutricion.png' })

  // Persiste tras recargar y se refleja en inicio
  await page.reload()
  await expect(page.getByText('450 kcal · P 40 · C 50 · G 10')).toBeVisible()
  await expect(page.getByLabel('Horas de sueño (anoche)')).toHaveValue('7.5')
  await expect(page.getByRole('button', { name: 'Nivel de energía: 4 de 5' })).toHaveAttribute('aria-pressed', 'true')
  await page.goto('/'); await expect(page.getByText('Hoy: 450 kcal · 40 g proteína · 750 ml agua')).toBeVisible()

  // Medidas y % de grasa estimado
  await page.goto('/cuerpo'); await page.getByRole('tab', { name: 'Medidas' }).click()
  await page.getByLabel('Cintura').fill('85'); await page.getByLabel('Cuello').fill('38')
  await page.getByRole('button', { name: 'Guardar medidas' }).click()
  await expect(page.getByText('16.1%')).toBeVisible()
  await expect(page.getByText(/Cintura 85 · Cuello 38/)).toBeVisible()
  await page.waitForTimeout(300); await page.screenshot({ path: 'docs/capturas/15-medidas.png' })

  // Foto: se guarda localmente, se abre y se elimina
  await page.getByRole('tab', { name: 'Fotos' }).click()
  await page.getByLabel('Elegir foto de progreso').setInputFiles('public/icon-512.png')
  await expect(page.getByRole('button', { name: /Ver foto del/ })).toBeVisible()
  await page.reload(); await page.getByRole('tab', { name: 'Fotos' }).click()
  await page.getByRole('button', { name: /Ver foto del/ }).click()
  await page.getByRole('button', { name: 'Eliminar foto' }).click()
  await expect(page.getByText('Sin fotos todavía')).toBeVisible()

  // Quitar alimento
  await page.getByRole('tab', { name: 'Diario' }).click()
  await page.getByRole('button', { name: 'Quitar Pechuga con arroz' }).click()
  await expect(page.getByText('450 kcal · P 40')).toHaveCount(0)
  expect(errors).toEqual([])
})
