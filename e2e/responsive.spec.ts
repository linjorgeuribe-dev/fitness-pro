import { expect, test } from '@playwright/test'
test('escritorio: navegación lateral y sin desbordes horizontales', async ({ page }) => {
  await page.goto('/')
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Crear mi rutina' }).click()
  await expect(page.getByRole('navigation', { name: 'Principal' })).toBeVisible()
  for (const p of ['/', '/explore', '/train', '/progress', '/profile']) {
    await page.goto(p); await page.waitForLoadState('networkidle')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), p).toBe(true)
  }
  await page.goto('/progress'); await page.screenshot({ path: 'docs/capturas/12-escritorio-progreso.png' })
})
