import { test, expect } from '../../api/fixtures/apiFixtures';
import { ReqresClient } from '../../api/clients/reqresClient';
import { usersData, createUserCases, negativeGetUserCases, negativeListCases } from './data/users.data';
import { assertApiSuccess, assertStatus, assertSchema } from '../../api/helpers/apiAssertions';
import {
  UsersListResponseSchema,
  UserResponseSchema,
  UpdateUserResponseSchema,
  CreateUserResponseSchema,
} from '../../api/schemas/reqres.schemas';

const usersTests = [
  {
    name: 'get users list returns paginated data',
    tags: ['@smoke'],
    action: async (client: ReqresClient) => {
      const response = await test.step(`GET /users?page=${usersData.listPage}`, () =>
        client.getUsers(usersData.listPage),
      );
      await test.step('Assert schema and pagination', async () => {
        await assertApiSuccess(response, 200, [200, 401], (body) => {
          const list = assertSchema(UsersListResponseSchema, body);
          expect(list.data.length).toBeGreaterThan(0);
          expect(list.page).toBe(usersData.listPage);
        });
      });
    },
  },
  {
    name: 'get single user returns correct user',
    tags: ['@smoke'],
    action: async (client: ReqresClient) => {
      const response = await test.step(`GET /users/${usersData.existingUserId}`, () =>
        client.getUser(usersData.existingUserId),
      );
      await test.step('Assert user schema and fields', async () => {
        await assertApiSuccess(response, 200, [200, 401], (body) => {
          const { data } = assertSchema(UserResponseSchema, body);
          expect(data.id).toBe(usersData.existingUserId);
          expect(data.email).toBeDefined();
          expect(data.first_name).toBeDefined();
        });
      });
    },
  },
  {
    name: 'get non-existent user returns 404',
    tags: ['@regression'],
    action: async (client: ReqresClient) => {
      const response = await test.step(`GET /users/${usersData.nonExistentUserId}`, () =>
        client.getUser(usersData.nonExistentUserId),
      );
      await test.step('Assert 404 or 401', () => {
        assertStatus(response, [404, 401]);
      });
    },
  },
  {
    name: 'update user returns updated name and job',
    tags: ['@regression'],
    action: async (client: ReqresClient) => {
      const { name, job } = usersData.updatedUser;
      const response = await test.step(`PUT /users/${usersData.existingUserId}`, () =>
        client.updateUser(usersData.existingUserId, name, job),
      );
      await test.step('Assert updated fields in schema', async () => {
        await assertApiSuccess(response, 200, [200, 401], (body) => {
          const updated = assertSchema(UpdateUserResponseSchema, body);
          expect(updated.name).toBe(name);
          expect(updated.job).toBe(job);
          expect(updated.updatedAt).toBeDefined();
        });
      });
    },
  },
  {
    name: 'delete user returns 204',
    tags: ['@regression'],
    action: async (client: ReqresClient) => {
      const response = await test.step(`DELETE /users/${usersData.existingUserId}`, () =>
        client.deleteUser(usersData.existingUserId),
      );
      await test.step('Assert 204 or 401', () => {
        assertStatus(response, [204, 401]);
      });
    },
  },
];

test.describe('API Users Tests', { tag: '@api' }, () => {
  for (const usersTest of usersTests) {
    test(usersTest.name, { tag: usersTest.tags }, async ({ reqresClient }) => {
      await usersTest.action(reqresClient);
    });
  }
});

test.describe('Negative Users Tests', { tag: ['@api', '@regression'] }, () => {
  for (const { name, id } of negativeGetUserCases) {
    test(name, async ({ reqresClient }) => {
      const response = await test.step(`GET /users/${id}`, () => reqresClient.getUser(id));
      await test.step('Assert 404 or 401', () => assertStatus(response, [404, 401]));
    });
  }

  for (const { name, page } of negativeListCases) {
    test(name, async ({ reqresClient }) => {
      const response = await test.step(`GET /users?page=${page}`, () =>
        reqresClient.getUsers(page),
      );
      await test.step('Assert empty data array', async () => {
        await assertApiSuccess(response, 200, [200, 401], (body) => {
          const list = assertSchema(UsersListResponseSchema, body);
          expect(list.data).toHaveLength(0);
        });
      });
    });
  }
});

test.describe('Create User', { tag: '@api' }, () => {
  for (const { name, tags, user } of createUserCases) {
    test(name, { tag: tags }, async ({ reqresClient }) => {
      const response = await test.step(`POST /users (${user.name})`, () =>
        reqresClient.createUser(user.name, user.job),
      );
      await test.step('Assert created user schema and fields', async () => {
        await assertApiSuccess(response, 201, [201, 401], (body) => {
          const created = assertSchema(CreateUserResponseSchema, body);
          expect(created.name).toBe(user.name);
          expect(created.job).toBe(user.job);
          expect(created.id).toBeDefined();
          expect(created.createdAt).toBeDefined();
        });
      });
    });
  }
});
