const VALID_ENVS = ['dev', 'staging', 'prod'] as const;
type Environment = (typeof VALID_ENVS)[number];

const ENV = (process.env.TEST_ENV ?? 'dev') as Environment;

if (!VALID_ENVS.includes(ENV)) {
  throw new Error(`Unknown TEST_ENV: "${ENV}". Valid values: ${VALID_ENVS.join(', ')}`);
}

const configs: Record<Environment, { baseUrl: string }> = {
  dev: { baseUrl: 'https://reqres.in/api/' },
  staging: { baseUrl: 'https://reqres.in/api/' },
  prod: { baseUrl: 'https://reqres.in/api/' },
};

export const config = configs[ENV];
export { ENV };
