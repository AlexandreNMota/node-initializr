import { FileTree } from './components/FileTree';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { useConfigStore } from './store/configStore';

const PACKAGE_MANAGERS = ['npm', 'pnpm', 'yarn'] as const;

function isValidProjectName(name: string): boolean {
  return /^[a-z0-9-]+$/.test(name) && name.length > 0 && name.length <= 64;
}

function App() {
  const config = useConfigStore((state) => state.config);
  const setField = useConfigStore((state) => state.setField);
  const isNameValid = isValidProjectName(config.name);

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
