import { expect, test, type Page } from '@playwright/test'

const shot = async (page: Page, name: string) => (await page.waitForTimeout(450), page.screenshot({ path: `docs/capturas/${name}.png` }))

async function onboard(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '¿Qué quieres lograr?' })).toBeVisible()
  await shot(page, '01-onboarding')
  await page.getByRole('button', { name: 'Ganar masa muscular' }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: /Intermedio/ }).click()
  await page.getByRole('button', { name: '4 días' }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Gimnasio completo' }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByLabel('Nombre (opcional)').fill('Jorge')
  await page.getByRole('button', { name: 'Crear mi rutina' }).click()
  await expect(page.getByRole('heading', { name: /Jorge/ })).toBeVisible()
}

test('flujo crítico: onboarding → entrenar → registrar → persistir → finalizar → progreso', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await onboard(page)
  await expect(page.getByText('Torso A')).toBeVisible()
  await shot(page, '02-inicio')

  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await expect(page).toHaveURL(/workout/)
  await expect(page.getByRole('heading', { name: 'Torso A' })).toBeVisible()

  // Registrar serie 1 del primer ejercicio
  await page.getByLabel(/Peso serie 1/).first().fill('60')
  await page.getByLabel('Repeticiones serie 1').first().fill('10')
  await page.getByLabel('RIR serie 1').first().selectOption('2')
  await page.getByRole('button', { name: 'Completar serie 1' }).first().click()
  await expect(page.getByRole('timer', { name: 'Descanso' })).toBeVisible()
  await shot(page, '03-entrenamiento-en-vivo')
  await page.getByRole('button', { name: 'Sumar 15 segundos' }).click()
  await page.getByRole('button', { name: 'Saltar' }).click()
  await expect(page.getByRole('timer')).toHaveCount(0)

  // Serie 2: al completar sin escribir, hereda peso y repeticiones de la serie anterior
  await page.getByRole('button', { name: 'Completar serie 2' }).first().click()
  await expect(page.getByLabel(/Peso serie 2/).first()).toHaveValue('60')
  await page.getByRole('button', { name: 'Saltar' }).click()
  await expect(page.getByText(/· 2\/\d+ series/)).toBeVisible()

  // Persistencia: recargar a mitad de la sesión no pierde nada
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Torso A' })).toBeVisible()
  await expect(page.getByLabel(/Peso serie 1/).first()).toHaveValue('60')
  await expect(page.getByRole('button', { name: 'Desmarcar serie 1' }).first()).toBeVisible()

  // Técnica sin salir de la sesión
  await page.getByRole('button', { name: 'Técnica' }).click()
  await expect(page.getByRole('heading', { name: 'Ejecución paso a paso' })).toBeVisible()
  await page.getByRole('dialog').getByRole('button', { name: 'Cerrar' }).click()

  // Sustituir el ejercicio abierto
  // Sustituir: las 2 series hechas se quedan con el ejercicio original y las pendientes pasan al sustituto
  const before = await page.locator('section').first().locator('.line-clamp-2').first().innerText()
  const count = await page.locator('section').count()
  await page.getByRole('button', { name: 'Sustituir' }).click()
  await page.getByRole('dialog').locator('button.flex').first().click()
  await expect(page.locator('section')).toHaveCount(count + 1)
  await expect(page.locator('section').first().locator('.line-clamp-2').first()).toHaveText(before)
  await expect(page.locator('section').nth(1).locator('.line-clamp-2').first()).not.toHaveText(before)

  // Pausar / reanudar
  await page.getByRole('button', { name: 'Pausar' }).click()
  await expect(page.getByText('en pausa')).toBeVisible()
  await page.getByRole('button', { name: 'Reanudar' }).click()

  // Finalizar
  await page.getByRole('button', { name: 'Finalizar' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Finalizar' }).click()
  await expect(page).toHaveURL(/session\//)
  await expect(page.getByText('1,200')).toBeVisible() // 60×10 × 2 series
  await shot(page, '04-resumen')
  await page.getByRole('button', { name: 'Listo' }).click()

  // La rutina avanzó al día siguiente y el historial persiste
  await expect(page.getByText('Pierna A')).toBeVisible()
  await page.getByRole('link', { name: 'Progreso', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Historial' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Torso A/ })).toBeVisible()
  await shot(page, '05-progreso')
  const dl = page.waitForEvent('download')
  await page.getByRole('button', { name: 'CSV' }).click()
  expect((await dl).suggestedFilename()).toMatch(/\.csv$/)
  expect(errors, errors.join('\n')).toEqual([])
})

test('explorar: búsqueda, filtros, mapa muscular y detalle', async ({ page }) => {
  await onboard(page)
  await page.getByRole('link', { name: 'Explorar', exact: true }).click()
  await expect(page.getByText('868 ejercicios')).toBeVisible()
  await page.getByLabel('Buscar ejercicio').fill('sentadilla barra')
  await expect(page.getByText(/^\d+ ejercicios$/)).not.toHaveText('868 ejercicios')
  await expect(page.getByRole('link', { name: /Sentadilla con barra/ }).first()).toBeVisible()
  await shot(page, '06-explorar')
  await page.getByLabel('Buscar ejercicio').fill('zzzz')
  await expect(page.getByText('Sin resultados')).toBeVisible()
  await page.getByLabel('Buscar ejercicio').fill('')

  await page.getByRole('tab', { name: 'Mapa muscular' }).click()
  await shot(page, '07-mapa-muscular')
  await page.getByRole('button', { name: 'Pecho' }).first().click()
  await expect(page.getByRole('button', { name: /Pecho/ }).first()).toBeVisible()
  await page.getByRole('button', { name: /^Filtros/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Mancuernas' }).click()
  await page.getByRole('dialog').getByRole('button', { name: /^Ver \d+/ }).click()
  await page.locator('a[href^="/explore/"]').first().click()
  await expect(page.getByRole('heading', { name: 'Ejecución paso a paso' })).toBeVisible()
  await expect(page.locator('ol li').first()).toBeVisible()
  const img = page.locator('img[src*="/media/ex/"]').first()
  await expect(img).toBeVisible()
  expect(await img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true)
  await shot(page, '08-detalle-ejercicio')
})

test('rutinas: generar, editar, duplicar y eliminar', async ({ page }) => {
  await onboard(page)
  await page.getByRole('link', { name: 'Entrenar', exact: true }).click()
  await page.getByRole('button', { name: 'Generar rutina' }).click()
  await page.getByRole('dialog').getByRole('button', { name: '3 días' }).click()
  await page.getByRole('dialog').getByRole('button', { name: '30 min' }).click()
  await page.getByRole('button', { name: 'Crear rutina' }).click()
  await expect(page).toHaveURL(/routine\//)
  await expect(page.getByLabel('Nombre del día 1')).toHaveValue('Cuerpo completo A')
  await shot(page, '09-rutina')
  const series = page.getByLabel('Series').first()
  await series.fill('5'); await expect(series).toHaveValue('5')
  await page.reload(); await expect(page.getByLabel('Series').first()).toHaveValue('5')
  await page.getByRole('button', { name: 'Duplicar' }).click()
  await expect(page.getByRole('heading', { name: /\(copia\)/ })).toBeVisible()
  await page.getByRole('button', { name: 'Eliminar' }).click()
  await page.getByRole('button', { name: 'Eliminar rutina' }).click()
  await expect(page).toHaveURL(/train/)
  await expect(page.getByRole('link', { name: /\(copia\)/ })).toHaveCount(0)
})

test('herramientas, tema y borrado de datos', async ({ page }) => {
  await onboard(page)
  await page.getByRole('link', { name: 'Perfil', exact: true }).click()
  await page.getByRole('tab', { name: 'herramientas' }).click()
  await page.getByLabel('Peso total (kg)').fill('100')
  await expect(page.getByText('Por lado:')).toBeVisible()
  await page.getByLabel('Peso (kg)').fill('100'); await page.getByLabel('Repeticiones').fill('5')
  await expect(page.getByText('116.7')).toBeVisible()
  await shot(page, '10-herramientas')
  await page.getByRole('tab', { name: 'Ajustes y datos' }).click()
  await page.getByRole('button', { name: 'Claro' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await shot(page, '11-tema-claro')
  await page.getByRole('button', { name: 'Borrar datos de este dispositivo' }).click()
  await page.getByRole('button', { name: 'Borrar todo', exact: true }).click()
  await expect(page.getByRole('heading', { name: '¿Qué quieres lograr?' })).toBeVisible()
})

test('sin conexión: la app abre y permite registrar un entrenamiento', async ({ page, context }) => {
  await onboard(page)
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.waitForFunction(() => !!navigator.serviceWorker.controller || true)
  await page.reload(); await page.evaluate(() => navigator.serviceWorker.ready)
  await page.waitForTimeout(1500) // precache
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: /Jorge/ })).toBeVisible()
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click()
  await page.getByLabel(/Peso serie 1/).first().fill('50')
  await page.getByRole('button', { name: 'Completar serie 1' }).first().click()
  await expect(page.getByRole('timer', { name: 'Descanso' })).toBeVisible()
  await page.goto('/explore'); await expect(page.getByText('868 ejercicios')).toBeVisible()
  await context.setOffline(false)
})

test('rutina propia: elegir ejercicios, editar días, entrenar y borrar desde la lista', async ({ page }) => {
  await onboard(page)
  await page.getByRole('link', { name: 'Entrenar', exact: true }).click()
  await page.getByRole('button', { name: 'Crear la mía' }).click()
  await page.getByLabel('Nombre').fill('Pierna y glúteo')
  await page.getByRole('button', { name: '2 días' }).click()
  await page.getByRole('button', { name: 'Elegir ejercicios' }).click()
  await expect(page).toHaveURL(/routine\//)
  await expect(page.getByLabel('Nombre del día 2')).toHaveValue('Día 2')

  // Día 1: elegir 3, quitar 1 dentro del mismo selector
  await page.getByLabel('Nombre del día 1').fill('Pierna')
  await page.getByRole('button', { name: 'Agregar ejercicios' }).first().click()
  const dlg = page.getByRole('dialog')
  await dlg.getByLabel('Buscar ejercicio').fill('sentadilla con barra')
  await dlg.locator('button.text-left[aria-pressed]').filter({ hasText: /^Sentadilla con barra/ }).first().click()
  await dlg.getByLabel('Buscar ejercicio').fill('prensa de piernas')
  await dlg.locator('button.text-left[aria-pressed]').filter({ hasText: 'Prensa de piernas' }).first().click()
  await dlg.getByLabel('Buscar ejercicio').fill('hip thrust')
  await dlg.locator('button.text-left[aria-pressed]').filter({ hasText: 'Hip thrust con barra' }).first().click()
  await expect(dlg.getByText('3 ejercicios elegidos')).toBeVisible()
  await expect(dlg.locator('button.text-left[aria-pressed="true"]')).toHaveCount(1)
  await dlg.locator('button.text-left[aria-pressed="true"]').click() // quita el hip thrust
  await expect(dlg.getByText('2 ejercicios elegidos')).toBeVisible()
  await shot(page, '16-elegir-ejercicios')
  // Elegir por grupo muscular: el filtro se queda puesto mientras se agregan varios…
  await dlg.getByLabel('Buscar ejercicio').fill('')
  await dlg.locator('button.rounded-full', { hasText: /^Glúteos$/ }).first().click()
  const total = await dlg.getByText(/^\d+ ejercicios$/).innerText()
  await dlg.locator('button.text-left[aria-pressed="false"]').nth(0).click()
  await expect(dlg.getByText('3 ejercicios elegidos')).toBeVisible()
  await dlg.locator('button.text-left[aria-pressed="false"]').nth(0).click()
  await expect(dlg.getByText('4 ejercicios elegidos')).toBeVisible()
  await expect(dlg.getByText(/^\d+ ejercicios$/)).toHaveText(total)
  await expect(dlg.locator('button.rounded-full[aria-pressed="true"]', { hasText: /^Glúteos$/ })).toHaveCount(1)
  await dlg.locator('button.text-left[aria-pressed="true"]').nth(0).click()
  await expect(dlg.getByText('3 ejercicios elegidos')).toBeVisible()
  await dlg.locator('button.text-left[aria-pressed="true"]').nth(0).click()
  await expect(dlg.getByText('2 ejercicios elegidos')).toBeVisible()
  await dlg.getByRole('button', { name: 'Listo' }).click()
  // …y sigue puesto al abrir el selector de otro día
  await page.getByRole('button', { name: 'Agregar ejercicios' }).nth(1).click()
  await expect(dlg.locator('button.rounded-full[aria-pressed="true"]', { hasText: /^Glúteos$/ })).toHaveCount(1)
  await expect(dlg.getByText(/^\d+ ejercicios$/)).toHaveText(total)
  await dlg.getByRole('button', { name: 'Listo' }).click()
  await expect(page.getByText('Prensa de piernas')).toBeVisible()
  await expect(page.getByText('Hip thrust con barra')).toHaveCount(0)

  // Días: agregar uno y quitar otro
  await page.getByRole('button', { name: 'Agregar día' }).click()
  await expect(page.getByLabel('Nombre del día 3')).toBeVisible()
  await page.getByRole('button', { name: 'Quitar día' }).nth(1).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Quitar día' }).click()
  await expect(page.getByLabel('Nombre del día 3')).toHaveCount(0)

  // Persiste y se puede entrenar con ella
  await page.reload()
  await expect(page.getByLabel('Nombre del día 1')).toHaveValue('Pierna')
  await page.getByRole('button', { name: 'Iniciar' }).first().click()
  await expect(page.getByRole('heading', { name: 'Pierna' })).toBeVisible()
  await expect(page.getByText('Prensa de piernas')).toBeVisible()
  await page.getByRole('button', { name: 'Descartar entrenamiento' }).click()
  await page.getByRole('button', { name: 'Descartar', exact: true }).click()

  // Borrar desde la lista, con confirmación
  await expect(page).toHaveURL(/train/)
  await page.getByRole('button', { name: 'Eliminar rutina Pierna y glúteo' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.getByRole('link', { name: /Pierna y glúteo/ })).toBeVisible()
  await page.getByRole('button', { name: 'Eliminar rutina Pierna y glúteo' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar rutina' }).click()
  await expect(page.getByRole('link', { name: /Pierna y glúteo/ })).toHaveCount(0)
  await shot(page, '17-mis-rutinas')
})

test('entreno libre: agregar varios ejercicios seguidos sin que el selector se cierre', async ({ page }) => {
  await onboard(page)
  await page.getByRole('link', { name: 'Entrenar', exact: true }).click()
  await page.getByRole('button', { name: 'Entreno libre' }).click()
  await page.getByRole('button', { name: 'Agregar ejercicio' }).click()
  const dlg = page.getByRole('dialog')
  await dlg.locator('button.rounded-full', { hasText: /^Bíceps$/ }).first().click()
  for (let i = 1; i <= 3; i++) { await dlg.locator('button.text-left[aria-pressed="false"]').nth(0).click(); await expect(dlg.getByText(new RegExp(`^${i} ejercicios? en la sesión$`))).toBeVisible() }
  await expect(dlg.locator('button.rounded-full[aria-pressed="true"]', { hasText: /^Bíceps$/ })).toHaveCount(1)
  await dlg.locator('button.text-left[aria-pressed="true"]').nth(0).click() // quitar uno sin series hechas
  await expect(dlg.getByText('2 ejercicios en la sesión')).toBeVisible()
  await dlg.getByRole('button', { name: 'Listo' }).click()
  await expect(page.locator('section')).toHaveCount(2)
  // Un ejercicio con series hechas no se quita al tocarlo de nuevo
  await page.getByRole('button', { name: 'Completar serie 1' }).first().click()
  await page.getByRole('button', { name: 'Saltar' }).click()
  await page.getByRole('button', { name: 'Agregar ejercicio' }).click()
  await dlg.locator('button.text-left[aria-pressed="true"]').nth(0).click() // tiene una serie hecha: se conserva
  await page.waitForTimeout(300); await expect(dlg.getByText('2 ejercicios en la sesión')).toBeVisible()
  await dlg.locator('button.text-left[aria-pressed="true"]').nth(1).click() // sin series: se quita
  await expect(dlg.getByText('1 ejercicio en la sesión')).toBeVisible()
  await dlg.getByRole('button', { name: 'Listo' }).click()
  await expect(page.locator('section')).toHaveCount(1)
})
