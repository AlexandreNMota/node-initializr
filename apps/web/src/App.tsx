import { FileTree } from './components/FileTree';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { useConfigStore } from './store/configStore';
import type { GenerateConfig } from '@node-initializr/shared';
import { checkCompatibility } from './lib/compatibility';
import { useGenerate } from './hooks/useGenerate';
const PACKAGE_MANAGERS = ['npm', 'pnpm', 'yarn'] as const;
const FRAMEWORKS = [
  { value: 'express', label: 'Express', description: 'Minimal HTTP server' },
  { value: 'fastify', label: 'Fastify', description: 'High-performance API' },
  { value: 'nestjs', label: 'NestJS', description: 'Structured application framework' },
  { value: 'hono', label: 'Hono', description: 'Small web framework' },
] as const;

const LANGUAGES = [
  { value: 'typescript', label: 'TypeScript', description: 'Typed Node.js project' },
  { value: 'javascript', label: 'JavaScript', description: 'Plain Node.js project' },
] as const;

const ARCHITECTURES = [
  {
    value: 'modular',
    label: 'Modular Monolith',
    description: 'Feature modules in a single deployable app.',
  },
  {
    value: 'clean',
    label: 'Clean Architecture',
    description: 'Domain, application, and infrastructure layers.',
  },
  {
    value: 'mvc',
    label: 'MVC',
    description: 'Controllers, models, and views separated by role.',
  },
] as const;

const DATABASES = [
  { value: 'none', label: 'None', description: 'No database integration' },
  { value: 'postgresql', label: 'PostgreSQL', description: 'Relational database' },
  { value: 'mysql', label: 'MySQL', description: 'Relational database' },
  { value: 'mongodb', label: 'MongoDB', description: 'Document database' },
  { value: 'sqlite', label: 'SQLite', description: 'Local relational database' },
] as const;

const ORMS = [
  { value: 'none', label: 'None', description: 'No ORM' },
  { value: 'prisma', label: 'Prisma', description: 'Type-safe ORM' },
  { value: 'typeorm', label: 'TypeORM', description: 'Decorator-based ORM' },
  { value: 'drizzle', label: 'Drizzle', description: 'SQL query builder' },
  { value: 'mongoose', label: 'Mongoose', description: 'MongoDB object modeling' },
] as const;

const MESSAGING_OPTIONS = [
  { value: 'none', label: 'None', description: 'No messaging queue' },
  { value: 'rabbitmq', label: 'RabbitMQ', description: 'Message broker' },
  { value: 'bullmq', label: 'BullMQ', description: 'Redis-backed jobs' },
] as const;

const AUTH_OPTIONS = [
  { value: 'none', label: 'None', description: 'No auth layer' },
  { value: 'jwt', label: 'JWT', description: 'Token-based authentication' },
  { value: 'clerk', label: 'Clerk', description: 'Managed authentication' },
] as const;

const DEPENDENCY_OPTIONS = [
  { value: 'redis', label: 'Redis', description: 'Cache and queues' },
  { value: 'swagger', label: 'Swagger', description: 'API documentation' },
  { value: 'jest', label: 'Jest', description: 'Unit testing setup' },
  { value: 'docker', label: 'Docker', description: 'Container files' },
  { value: 'github-actions', label: 'GitHub Actions', description: 'CI workflow' },
  { value: 'eslint', label: 'ESLint', description: 'Linting setup' },
  { value: 'pino', label: 'Pino', description: 'Structured logger' },
  { value: 'winston', label: 'Winston', description: 'Logger alternative' },
] as const;

function isValidProjectName(name: string): boolean {
  return /^[a-z0-9-]+$/.test(name) && name.length > 0 && name.length <= 64;
}

function isOrmDisabled(database: GenerateConfig['database'], orm: GenerateConfig['orm']): boolean {
  if (orm === 'none') {
    return false;
  }

  if (database === 'none') {
    return true;
  }

  if (orm === 'mongoose' && database !== 'mongodb') {
    return true;
  }

  if (orm === 'drizzle' && database === 'mongodb') {
    return true;
  }

  return false;
}

function App() {
  const config = useConfigStore((state) => state.config);
  const setField = useConfigStore((state) => state.setField);
  const addDependency = useConfigStore((state) => state.addDependency);
  const removeDependency = useConfigStore((state) => state.removeDependency);
  const isNameValid = isValidProjectName(config.name);
  const compatibilityErrors = checkCompatibility(config);
  const hasBullMqWithoutRedis =
    config.messaging === 'bullmq' && !config.dependencies.includes('redis');
  const { generate, isLoading, error } = useGenerate();
  const hasCompatibilityErrors = compatibilityErrors.length > 0;
  const isGenerateDisabled = !isNameValid || hasCompatibilityErrors || isLoading;

  async function handleGenerate(): Promise<void> {
    await generate(config);
  }
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_440px]">
        <section
          className="flex min-w-0 justify-center px-5 py-8 sm:px-8 lg:px-10 lg:py-10"
          aria-label="Project configuration"
        >
          <div className="w-full max-w-3xl">
            <header className="mb-8 border-b border-slate-200 pb-7">
              <p className="mb-2 text-xs font-bold uppercase text-blue-600">Node Initializr</p>
              <h1 className="max-w-2xl text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
                Configure your project
              </h1>
            </header>

            <section
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              aria-labelledby="project-section-title"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 id="project-section-title" className="text-lg font-semibold text-slate-950">
                    Project
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Name the package and choose the install command.
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="project-name">Project name</Label>
                <Input
                  id="project-name"
                  value={config.name}
                  onChange={(event) => setField('name', event.target.value)}
                  aria-invalid={!isNameValid}
                  aria-describedby={isNameValid ? undefined : 'project-name-error'}
                  className={
                    !isNameValid ? 'border-red-600 focus-visible:ring-red-600/20' : undefined
                  }
                />
              </div>

              {!isNameValid ? (
                <p id="project-name-error" className="mt-2 text-sm text-red-700">
                  Use kebab-case with lowercase letters, numbers, and hyphens.
                </p>
              ) : null}

              <fieldset className="mt-6">
                <legend className="mb-3 text-sm font-medium text-slate-700">Package manager</legend>

                <div className="inline-flex gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 shadow-xs">
                  {PACKAGE_MANAGERS.map((packageManager) => {
                    const isSelected = config.packageManager === packageManager;

                    return (
                      <Button
                        key={packageManager}
                        type="button"
                        variant={isSelected ? 'default' : 'ghost'}
                        aria-pressed={isSelected}
                        className={
                          isSelected
                            ? 'bg-slate-950 px-4 text-white shadow-sm hover:bg-slate-900'
                            : 'px-4 text-slate-600 hover:bg-white hover:text-slate-950'
                        }
                        onClick={() => setField('packageManager', packageManager)}
                      >
                        {packageManager}
                      </Button>
                    );
                  })}
                </div>
              </fieldset>
            </section>

            <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-950">Stack</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Choose the runtime framework and source language.
                </p>
              </div>

              <fieldset>
                <legend className="mb-3 text-sm font-medium text-slate-700">Framework</legend>

                <div className="grid gap-3 sm:grid-cols-2">
                  {FRAMEWORKS.map((framework) => {
                    const isSelected = config.framework === framework.value;

                    return (
                      <button
                        key={framework.value}
                        type="button"
                        aria-pressed={isSelected}
                        className={
                          isSelected
                            ? 'rounded-lg border border-slate-950 bg-slate-950 p-4 text-left text-white shadow-sm'
                            : 'rounded-lg border border-slate-200 bg-white p-4 text-left text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50'
                        }
                        onClick={() => setField('framework', framework.value)}
                      >
                        <span className="block text-sm font-semibold">{framework.label}</span>
                        <span
                          className={
                            isSelected
                              ? 'mt-1 block text-sm text-slate-300'
                              : 'mt-1 block text-sm text-slate-500'
                          }
                        >
                          {framework.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="mt-6">
                <legend className="mb-3 text-sm font-medium text-slate-700">Language</legend>

                <div className="grid gap-3 sm:grid-cols-2">
                  {LANGUAGES.map((language) => {
                    const isSelected = config.language === language.value;

                    return (
                      <button
                        key={language.value}
                        type="button"
                        aria-pressed={isSelected}
                        className={
                          isSelected
                            ? 'rounded-lg border border-blue-700 bg-blue-700 p-4 text-left text-white shadow-sm'
                            : 'rounded-lg border border-slate-200 bg-white p-4 text-left text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50'
                        }
                        onClick={() => setField('language', language.value)}
                      >
                        <span className="block text-sm font-semibold">{language.label}</span>
                        <span
                          className={
                            isSelected
                              ? 'mt-1 block text-sm text-blue-100'
                              : 'mt-1 block text-sm text-slate-500'
                          }
                        >
                          {language.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </section>

            <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-950">Architecture</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Shape the folders generated inside src.
                </p>
              </div>

              <div className="grid gap-3">
                {ARCHITECTURES.map((architecture) => {
                  const isSelected = config.architecture === architecture.value;

                  return (
                    <button
                      key={architecture.value}
                      type="button"
                      aria-pressed={isSelected}
                      className={
                        isSelected
                          ? 'rounded-lg border border-slate-950 bg-slate-950 p-4 text-left text-white shadow-sm'
                          : 'rounded-lg border border-slate-200 bg-white p-4 text-left text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50'
                      }
                      onClick={() => setField('architecture', architecture.value)}
                    >
                      <span className="block text-sm font-semibold">{architecture.label}</span>
                      <span
                        className={
                          isSelected
                            ? 'mt-1 block text-sm text-slate-300'
                            : 'mt-1 block text-sm text-slate-500'
                        }
                      >
                        {architecture.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-950">Data</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Pick a database and the persistence layer.
                </p>
              </div>

              <fieldset>
                <legend className="mb-3 text-sm font-medium text-slate-700">Database</legend>

                <div className="grid gap-3 sm:grid-cols-2">
                  {DATABASES.map((database) => {
                    const isSelected = config.database === database.value;

                    return (
                      <button
                        key={database.value}
                        type="button"
                        aria-pressed={isSelected}
                        className={
                          isSelected
                            ? 'rounded-lg border border-slate-950 bg-slate-950 p-4 text-left text-white shadow-sm'
                            : 'rounded-lg border border-slate-200 bg-white p-4 text-left text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50'
                        }
                        onClick={() => {
                          setField('database', database.value);

                          if (database.value === 'none') {
                            setField('orm', 'none');
                          }
                        }}
                      >
                        <span className="block text-sm font-semibold">{database.label}</span>
                        <span
                          className={
                            isSelected
                              ? 'mt-1 block text-sm text-slate-300'
                              : 'mt-1 block text-sm text-slate-500'
                          }
                        >
                          {database.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="mt-6">
                <legend className="mb-3 text-sm font-medium text-slate-700">ORM</legend>

                {config.database === 'none' ? (
                  <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Select a database to enable ORM options.
                  </p>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  {ORMS.map((orm) => {
                    const isSelected = config.orm === orm.value;
                    const isDisabled = isOrmDisabled(config.database, orm.value);

                    return (
                      <button
                        key={orm.value}
                        type="button"
                        aria-pressed={isSelected}
                        disabled={isDisabled}
                        className={
                          isSelected
                            ? 'rounded-lg border border-blue-700 bg-blue-700 p-4 text-left text-white shadow-sm'
                            : 'rounded-lg border border-slate-200 bg-white p-4 text-left text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400'
                        }
                        onClick={() => setField('orm', orm.value)}
                      >
                        <span className="block text-sm font-semibold">{orm.label}</span>
                        <span
                          className={
                            isSelected
                              ? 'mt-1 block text-sm text-blue-100'
                              : 'mt-1 block text-sm text-slate-500'
                          }
                        >
                          {orm.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {compatibilityErrors.length > 0 ? (
                <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {compatibilityErrors.map((error) => (
                    <p key={error.field + '-' + error.message}>{error.message}</p>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-950">Integrations</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Add authentication, messaging, and supporting dependencies.
                </p>
              </div>

              <fieldset>
                <legend className="mb-3 text-sm font-medium text-slate-700">Messaging</legend>

                <div className="grid gap-3 sm:grid-cols-3">
                  {MESSAGING_OPTIONS.map((messaging) => {
                    const isSelected = config.messaging === messaging.value;

                    return (
                      <button
                        key={messaging.value}
                        type="button"
                        aria-pressed={isSelected}
                        className={
                          isSelected
                            ? 'rounded-lg border border-slate-950 bg-slate-950 p-4 text-left text-white shadow-sm'
                            : 'rounded-lg border border-slate-200 bg-white p-4 text-left text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50'
                        }
                        onClick={() => setField('messaging', messaging.value)}
                      >
                        <span className="block text-sm font-semibold">{messaging.label}</span>
                        <span
                          className={
                            isSelected
                              ? 'mt-1 block text-sm text-slate-300'
                              : 'mt-1 block text-sm text-slate-500'
                          }
                        >
                          {messaging.description}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {hasBullMqWithoutRedis ? (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    BullMQ requires Redis. Enable Redis in Dependencies.
                  </div>
                ) : null}
              </fieldset>

              <fieldset className="mt-6">
                <legend className="mb-3 text-sm font-medium text-slate-700">Authentication</legend>

                <div className="grid gap-3 sm:grid-cols-3">
                  {AUTH_OPTIONS.map((auth) => {
                    const isSelected = config.auth === auth.value;

                    return (
                      <button
                        key={auth.value}
                        type="button"
                        aria-pressed={isSelected}
                        className={
                          isSelected
                            ? 'rounded-lg border border-blue-700 bg-blue-700 p-4 text-left text-white shadow-sm'
                            : 'rounded-lg border border-slate-200 bg-white p-4 text-left text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50'
                        }
                        onClick={() => setField('auth', auth.value)}
                      >
                        <span className="block text-sm font-semibold">{auth.label}</span>
                        <span
                          className={
                            isSelected
                              ? 'mt-1 block text-sm text-blue-100'
                              : 'mt-1 block text-sm text-slate-500'
                          }
                        >
                          {auth.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="mt-6">
                <legend className="mb-3 text-sm font-medium text-slate-700">Dependencies</legend>

                <div className="grid gap-3 sm:grid-cols-2">
                  {DEPENDENCY_OPTIONS.map((dependency) => {
                    const isSelected = config.dependencies.includes(dependency.value);
                    const isRedisSuggestion = dependency.value === 'redis' && hasBullMqWithoutRedis;

                    return (
                      <button
                        key={dependency.value}
                        type="button"
                        aria-pressed={isSelected}
                        className={
                          isSelected
                            ? 'rounded-lg border border-blue-700 bg-blue-700 p-4 text-left text-white shadow-sm'
                            : isRedisSuggestion
                              ? 'rounded-lg border border-amber-300 bg-amber-50 p-4 text-left text-amber-900 shadow-sm'
                              : 'rounded-lg border border-slate-200 bg-white p-4 text-left text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50'
                        }
                        onClick={() => {
                          if (isSelected) {
                            removeDependency(dependency.value);
                          } else {
                            addDependency(dependency.value);
                          }
                        }}
                      >
                        <span className="block text-sm font-semibold">{dependency.label}</span>
                        <span
                          className={
                            isSelected
                              ? 'mt-1 block text-sm text-blue-100'
                              : isRedisSuggestion
                                ? 'mt-1 block text-sm text-amber-800'
                                : 'mt-1 block text-sm text-slate-500'
                          }
                        >
                          {isRedisSuggestion ? 'Required for BullMQ' : dependency.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </section>
            <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Generate</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Download a ready-to-run project as a zip file.
                  </p>
                </div>

                <Button
                  type="button"
                  disabled={isGenerateDisabled}
                  className="min-w-44"
                  onClick={handleGenerate}
                >
                  {isLoading ? 'Generating...' : 'Generate & Download'}
                </Button>
              </div>

              {!isNameValid ? (
                <p className="mt-4 text-sm text-red-700">Fix the project name before generating.</p>
              ) : null}

              {hasCompatibilityErrors ? (
                <p className="mt-4 text-sm text-red-700">
                  Resolve compatibility issues before generating.
                </p>
              ) : null}

              {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
            </section>
          </div>
        </section>

        <aside className="border-t border-slate-200 bg-white px-5 py-8 sm:px-8 lg:border-l lg:border-t-0 lg:px-8 lg:py-10">
          <div className="mb-6">
            <p className="mb-2 text-xs font-bold uppercase text-blue-600">Preview</p>
            <h2 className="text-xl font-semibold text-slate-950">File tree</h2>
          </div>

          <FileTree config={config} />
        </aside>
      </div>
    </main>
  );
}

export default App;
