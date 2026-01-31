#!/usr/bin/env node
/**
 * Browser login test for social@tin.info
 */
import { chromium } from 'playwright';

const BASE = 'https://growchief-production-fc59.up.railway.app';
const EMAIL = 'social@tin.info';
const PASSWORD = '88888888';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on('console', msg => console.log('Console:', msg.text()));
try {
  await page.goto(`${BASE}/auth/login`, { waitUntil: 'networkidle' });
  await page.fill('#email', EMAIL);
  await page.fill('#password', PASSWORD);
  const [loginResp] = await Promise.all([
    page.waitForResponse(r => r.url().includes('auth/login') && r.request().method() === 'POST'),
    page.click('button[type="submit"]')
  ]);
  console.log('Login API status:', loginResp.status());
  console.log('Login API body:', await loginResp.text());
  await page.waitForTimeout(3000);
  const url = page.url();
  console.log('Final URL:', url);
  if (!url.includes('/auth/login')) {
    console.log('Login successful - redirected away from login page');
  } else {
    const err = await page.locator('p').filter({ hasText: /invalid|error|wrong|incorrect/i }).first().textContent().catch(() => '');
    console.log('Login failed. Error:', err || '(stayed on login page)');
  }
} finally {
  await browser.close();
}
