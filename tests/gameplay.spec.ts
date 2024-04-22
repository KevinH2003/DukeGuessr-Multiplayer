import { test, expect } from '@playwright/test';

test('gameplay', async ({ page, context }) => {
  function generateRandomString(length) {
    let result = '';
    const characters = '0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
  
  const randomString = generateRandomString(10);
  const PORT = 31775

  const page2 = await context.newPage();
  await page.goto(`http://localhost:${PORT}/api/login?key=security-disabled&name=Tester1&preferred_username=tester1`);
  await page.waitForTimeout(1000)

  await page.getByLabel('Number of Rounds:').fill('3');
  await page.getByLabel('Game ID (Leave Blank For').click();
  await page.getByLabel('Game ID (Leave Blank For').fill(randomString);
  await page.getByRole('button', { name: 'Start Game' }).click();
  await page.waitForTimeout(1000)

  await page2.goto(`http://localhost:${PORT}/api/login?key=security-disabled&name=Tester2&preferred_username=tester2`)
  await page2.waitForTimeout(1000)

  await page2.goto(`http://localhost:${PORT}/game/${randomString}`)
  await page2.waitForTimeout(1000)

  let firstButtonInRow = await page.$('.button-row .button-container:first-child .button');
  for (let i = 0; i < 3; i++) {
    firstButtonInRow = await page.$('.button-row .button-container:first-child .button');
    await firstButtonInRow?.click()
    await page.getByRole('button', { name: 'Submit Guess!' }).click();

    const buttonIndex = i + 1;
    const buttonSelector = `.button-row .button-container:nth-child(${buttonIndex}) .button`;
    const button = await page2.$(buttonSelector);
    if (button) {
      await button.click();
      await page2.waitForTimeout(1000); // pause for 1 second
      await page2.getByRole('button', { name: 'Submit Guess!' }).click();
    } else {
      throw new Error(`Button ${buttonIndex} not found on page2.`);
    }
  }
  await page.waitForTimeout(1000);

  const pageContent = await page.content();
  expect(pageContent).toContain('tester1');
  expect(pageContent).toContain('tester2');

  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Start Game' }).click();
})