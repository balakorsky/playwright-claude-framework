export const usersData = {
  listPage: 1,
  existingUserId: 2,
  nonExistentUserId: 999,
  updatedUser: {
    name: 'Jane Doe',
    job: 'Senior QA Engineer',
  },
};

export const negativeGetUserCases = [
  { name: 'get user with id 0 returns 404', id: 0 },
  { name: 'get user with negative id returns 404', id: -1 },
];

export const negativeListCases = [
  { name: 'get users on out-of-range page returns empty list', page: 999 },
];

export const createUserCases = [
  {
    name: 'creates user with name and job',
    tags: ['@smoke'],
    user: { name: 'John Doe', job: 'QA Engineer' },
  },
  {
    name: 'creates user with different role',
    tags: ['@regression'],
    user: { name: 'Alice Smith', job: 'Developer' },
  },
  {
    name: 'creates user with special characters in name',
    tags: ['@regression'],
    user: { name: "O'Brien-López", job: 'Designer' },
  },
  {
    name: 'creates user with long name',
    tags: ['@regression'],
    user: { name: 'Alexander Bartholomew Christophersen', job: 'Project Manager' },
  },
];
