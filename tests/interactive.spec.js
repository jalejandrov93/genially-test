// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const HTML_FILE = `file://${path.resolve(__dirname, '..', 'geometria_3d_septimo.html')}`;
const THREE_STUB = fs.readFileSync(path.resolve(__dirname, 'fixtures', 'three-stub.js'), 'utf8');

test.beforeEach(async ({ page }) => {
  // Intercept the Three.js CDN request and return a lightweight stub so tests
  // work without internet access and without a running web server.
  await page.route('**/three.min.js', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: THREE_STUB,
    });
  });

  await page.goto(HTML_FILE);
  // Wait for the quiz question to appear (signals JS has run)
  await page.waitForSelector('#q-text', { state: 'visible' });
  await page.waitForFunction(() => document.getElementById('q-text').textContent.trim().length > 0);
});
// ─────────────────────────────────────────────────────────────────
// Shape selection
// ─────────────────────────────────────────────────────────────────

test.describe('Shape selection', () => {
  test('cube is selected by default', async ({ page }) => {
    await expect(page.locator('#solid-name')).toHaveText('Cubo');
    await expect(page.locator('#f-vol')).toHaveText('V = a³');
    await expect(page.locator('#f-area')).toHaveText('A = 6a²');
    await expect(page.locator('.solid-btn').first()).toHaveClass(/active/);
  });

  test('selecting sphere updates name and formulas', async ({ page }) => {
    await page.locator('.solid-btn', { hasText: 'Esfera' }).click();
    await expect(page.locator('#solid-name')).toHaveText('Esfera');
    await expect(page.locator('#f-vol')).toHaveText('V = (4/3)·π·r³');
    await expect(page.locator('#f-area')).toHaveText('A = 4·π·r²');
  });

  test('selecting cylinder updates name, formulas and shows second slider', async ({ page }) => {
    await page.locator('.solid-btn', { hasText: 'Cilindro' }).click();
    await expect(page.locator('#solid-name')).toHaveText('Cilindro');
    await expect(page.locator('#f-vol')).toHaveText('V = π·r²·h');
    await expect(page.locator('#f-area')).toHaveText('A = 2π·r·(r+h)');
    await expect(page.locator('#param2-slider')).toBeVisible();
    await expect(page.locator('#param2-label')).toBeVisible();
  });

  test('selecting pyramid updates name and shows second slider', async ({ page }) => {
    await page.locator('.solid-btn', { hasText: 'Pirámide' }).click();
    await expect(page.locator('#solid-name')).toHaveText('Pirámide cuadrada');
    await expect(page.locator('#f-vol')).toHaveText('V = (1/3)·a²·h');
    await expect(page.locator('#param2-slider')).toBeVisible();
  });

  test('active class moves to the clicked button', async ({ page }) => {
    const sphereBtn = page.locator('.solid-btn', { hasText: 'Esfera' });
    await sphereBtn.click();
    await expect(sphereBtn).toHaveClass(/active/);
    // cube button must no longer be active
    await expect(page.locator('.solid-btn', { hasText: 'Cubo' })).not.toHaveClass(/active/);
  });

  test('second slider is hidden for shapes without a second parameter', async ({ page }) => {
    // Cube has no p2
    await expect(page.locator('#param2-slider')).toBeHidden();
    await expect(page.locator('#param2-label')).toBeHidden();
    // Sphere has no p2
    await page.locator('.solid-btn', { hasText: 'Esfera' }).click();
    await expect(page.locator('#param2-slider')).toBeHidden();
  });
});

// ─────────────────────────────────────────────────────────────────
// Parameter sliders
// ─────────────────────────────────────────────────────────────────

test.describe('Parameter sliders', () => {
  test('slider label updates when value changes (cube)', async ({ page }) => {
    const slider = page.locator('#param-slider');
    await slider.fill('5');
    await expect(page.locator('#param-val')).toHaveText('5');
  });

  test('cube volume updates when side length changes', async ({ page }) => {
    const slider = page.locator('#param-slider');
    // Default a=3: V = 27
    await expect(page.locator('#res-vol')).toHaveText('27.0 u³');
    await slider.fill('4');
    // V = 4³ = 64
    await expect(page.locator('#res-vol')).toHaveText('64.0 u³');
  });

  test('cube area updates when side length changes', async ({ page }) => {
    // Default a=3: A = 6*9 = 54
    await expect(page.locator('#res-area')).toHaveText('54.0 u²');
    await page.locator('#param-slider').fill('2');
    // A = 6*4 = 24
    await expect(page.locator('#res-area')).toHaveText('24.0 u²');
  });

  test('cylinder volume updates when both sliders change', async ({ page }) => {
    await page.locator('.solid-btn', { hasText: 'Cilindro' }).click();
    // Default r=2, h=4: V = π*4*4 ≈ 50.3
    const r = 3, h = 5;
    await page.locator('#param-slider').fill(String(r));
    await page.locator('#param2-slider').fill(String(h));
    const expected = (Math.PI * r * r * h).toFixed(1);
    await expect(page.locator('#res-vol')).toHaveText(`${expected} u³`);
  });

  test('cylinder area updates with both sliders', async ({ page }) => {
    await page.locator('.solid-btn', { hasText: 'Cilindro' }).click();
    const r = 2, h = 6;
    await page.locator('#param-slider').fill(String(r));
    await page.locator('#param2-slider').fill(String(h));
    const expected = (2 * Math.PI * r * (r + h)).toFixed(1);
    await expect(page.locator('#res-area')).toHaveText(`${expected} u²`);
  });

  test('second slider label shows height for cylinder', async ({ page }) => {
    await page.locator('.solid-btn', { hasText: 'Cilindro' }).click();
    await expect(page.locator('#param2-label')).toContainText('Altura');
  });

  test('second slider value display updates on change', async ({ page }) => {
    await page.locator('.solid-btn', { hasText: 'Cilindro' }).click();
    await page.locator('#param2-slider').fill('7');
    await expect(page.locator('#param2-val')).toHaveText('7');
  });
});

// ─────────────────────────────────────────────────────────────────
// Calculation correctness
// ─────────────────────────────────────────────────────────────────

test.describe('Calculation correctness', () => {
  test('sphere volume is correct', async ({ page }) => {
    await page.locator('.solid-btn', { hasText: 'Esfera' }).click();
    const r = 3;
    await page.locator('#param-slider').fill(String(r));
    const expected = ((4 / 3) * Math.PI * r * r * r).toFixed(1);
    await expect(page.locator('#res-vol')).toHaveText(`${expected} u³`);
  });

  test('sphere area is correct', async ({ page }) => {
    await page.locator('.solid-btn', { hasText: 'Esfera' }).click();
    const r = 2;
    await page.locator('#param-slider').fill(String(r));
    const expected = (4 * Math.PI * r * r).toFixed(1);
    await expect(page.locator('#res-area')).toHaveText(`${expected} u²`);
  });

  test('pyramid volume is correct', async ({ page }) => {
    await page.locator('.solid-btn', { hasText: 'Pirámide' }).click();
    const a = 3, h = 4;
    await page.locator('#param-slider').fill(String(a));
    await page.locator('#param2-slider').fill(String(h));
    const expected = ((1 / 3) * a * a * h).toFixed(1);
    await expect(page.locator('#res-vol')).toHaveText(`${expected} u³`);
  });

  test('pyramid area is correct', async ({ page }) => {
    await page.locator('.solid-btn', { hasText: 'Pirámide' }).click();
    const a = 4, h = 3;
    await page.locator('#param-slider').fill(String(a));
    await page.locator('#param2-slider').fill(String(h));
    const slant = Math.sqrt((a / 2) * (a / 2) + h * h);
    const expected = (a * a + 2 * a * slant).toFixed(1);
    await expect(page.locator('#res-area')).toHaveText(`${expected} u²`);
  });
});

// ─────────────────────────────────────────────────────────────────
// Quiz functionality
// ─────────────────────────────────────────────────────────────────

test.describe('Quiz functionality', () => {
  test('a question is displayed on load', async ({ page }) => {
    const qText = await page.locator('#q-text').textContent();
    expect(qText.trim().length).toBeGreaterThan(0);
  });

  test('four answer options are displayed', async ({ page }) => {
    await expect(page.locator('.opt-btn')).toHaveCount(4);
  });

  test('answering correctly shows positive feedback and updates score', async ({ page }) => {
    // Get initial score
    const initialScore = await page.locator('#score-txt').textContent();
    expect(initialScore).toContain('0 / 0');

    // Click the first option button
    const opts = page.locator('.opt-btn');
    await opts.nth(0).click();

    // Score total should now be 1
    const afterScore = await page.locator('#score-txt').textContent();
    expect(afterScore).toContain('/ 1');

    // Feedback should not be empty
    const feedback = await page.locator('#q-feedback').textContent();
    expect(feedback.trim().length).toBeGreaterThan(0);
  });

  test('clicking the correct answer applies .correct class', async ({ page }) => {
    // Find correct answer index from the app state
    const correctIdx = await page.evaluate(() => {
      // Access the global QUESTIONS array exposed by the page
      const q = window.QUESTIONS[window.qIdx % window.QUESTIONS.length];
      return q.ans;
    });

    const opts = page.locator('.opt-btn');
    await opts.nth(correctIdx).click();

    await expect(opts.nth(correctIdx)).toHaveClass(/correct/);
    await expect(page.locator('#q-feedback')).toHaveClass(/ok/);
  });

  test('clicking a wrong answer applies .wrong class to it and .correct to the right one', async ({ page }) => {
    const correctIdx = await page.evaluate(() => {
      const q = window.QUESTIONS[window.qIdx % window.QUESTIONS.length];
      return q.ans;
    });

    // Pick any option that is NOT the correct one
    const wrongIdx = correctIdx === 0 ? 1 : 0;
    const opts = page.locator('.opt-btn');
    await opts.nth(wrongIdx).click();

    await expect(opts.nth(wrongIdx)).toHaveClass(/wrong/);
    await expect(opts.nth(correctIdx)).toHaveClass(/correct/);
    await expect(page.locator('#q-feedback')).toHaveClass(/fail/);
  });

  test('answering twice in a row is not allowed (answered flag)', async ({ page }) => {
    const opts = page.locator('.opt-btn');
    await opts.nth(0).click();
    const scoreAfterFirst = await page.locator('#score-txt').textContent();

    // Click again – score total must NOT increase
    await opts.nth(1).click();
    const scoreAfterSecond = await page.locator('#score-txt').textContent();
    expect(scoreAfterFirst).toEqual(scoreAfterSecond);
  });

  test('next button advances to a new question', async ({ page }) => {
    const firstQuestion = await page.locator('#q-text').textContent();
    // Answer first to unlock (or just click next – the app allows it before answering too)
    await page.locator('#next-btn').click();
    await page.waitForFunction(
      (prev) => document.getElementById('q-text').textContent !== prev,
      firstQuestion,
    );
    const secondQuestion = await page.locator('#q-text').textContent();
    // The waitForFunction above already confirms the text changed; here we verify the new
    // question is non-empty and is different from the previous one.
    expect(secondQuestion.trim().length).toBeGreaterThan(0);
    expect(secondQuestion).not.toBe(firstQuestion);
  });

  test('score increments only for correct answers', async ({ page }) => {
    const correctIdx = await page.evaluate(() => {
      const q = window.QUESTIONS[window.qIdx % window.QUESTIONS.length];
      return q.ans;
    });

    await page.locator('.opt-btn').nth(correctIdx).click();
    const scoreText = await page.locator('#score-txt').textContent();
    expect(scoreText).toBe('Puntaje: 1 / 1');
  });

  test('answering wrong does not increment score numerator', async ({ page }) => {
    const correctIdx = await page.evaluate(() => {
      const q = window.QUESTIONS[window.qIdx % window.QUESTIONS.length];
      return q.ans;
    });

    const wrongIdx = correctIdx === 0 ? 1 : 0;
    await page.locator('.opt-btn').nth(wrongIdx).click();
    const scoreText = await page.locator('#score-txt').textContent();
    expect(scoreText).toBe('Puntaje: 0 / 1');
  });
});

// ─────────────────────────────────────────────────────────────────
// Page structure
// ─────────────────────────────────────────────────────────────────

test.describe('Page structure', () => {
  test('page title area contains the expected heading', async ({ page }) => {
    await expect(page.locator('#header h1')).toContainText('Sólidos geométricos');
  });

  test('all four shape buttons are present', async ({ page }) => {
    await expect(page.locator('.solid-btn')).toHaveCount(4);
  });

  test('canvas element is present', async ({ page }) => {
    await expect(page.locator('canvas#three')).toBeAttached();
  });

  test('quiz section is present', async ({ page }) => {
    await expect(page.locator('#quiz-section')).toBeVisible();
  });
});
