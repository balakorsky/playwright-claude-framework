import { test as base } from '@playwright/test';
import { ReqresClient } from '../clients/reqresClient';

type ApiFixtures = {
  reqresClient: ReqresClient;
};

export const test = base.extend<ApiFixtures>({
  reqresClient: async ({ request }, use) => {
    await use(new ReqresClient(request));
  },
});

export { expect } from '@playwright/test';
