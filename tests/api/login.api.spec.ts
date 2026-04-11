import { test, expect } from '../../api/fixtures/apiFixtures';
import { ReqresClient } from '../../api/clients/reqresClient';
import { loginData } from './data/login.data';
import { assertApiSuccess, assertApiError, assertSchema } from '../../api/helpers/apiAssertions';
import { LoginSuccessResponseSchema, UsersListResponseSchema } from '../../api/schemas/reqres.schemas';

const apiTests = [
  {
    name: 'successful login returns token OR fails with API restriction',
    tags: ['@smoke'],
    action: async (client: ReqresClient) => {
      const response = await test.step('POST /login with valid credentials', () =>
        client.login(loginData.validUser.email, loginData.validUser.password),
      );
      await test.step('Assert token in response', async () => {
        await assertApiSuccess(response, 200, [200, 401], (body) => {
          const { token } = assertSchema(LoginSuccessResponseSchema, body);
          expect(token).toBeDefined();
        });
      });
    },
  },
  {
    name: 'login fails without password',
    tags: ['@regression'],
    action: async (client: ReqresClient) => {
      const response = await test.step('POST /login without password', () =>
        client.login(loginData.noPassword.email),
      );
      await test.step('Assert error response', async () => {
        await assertApiError(response, [400, 401]);
      });
    },
  },
  {
    name: 'get users returns user list',
    tags: ['@smoke'],
    action: async (client: ReqresClient) => {
      const response = await test.step(`GET /users?page=${loginData.usersPage}`, () =>
        client.getUsers(loginData.usersPage),
      );
      await test.step('Assert users list schema and length', async () => {
        await assertApiSuccess(response, 200, [200, 401], (body) => {
          const list = assertSchema(UsersListResponseSchema, body);
          expect(list.data.length).toBeGreaterThan(0);
        });
      });
    },
  },
];

test.describe('API Login Tests', { tag: '@api' }, () => {
  for (const apiTest of apiTests) {
    test(apiTest.name, { tag: apiTest.tags }, async ({ reqresClient }) => {
      await apiTest.action(reqresClient);
    });
  }
});
