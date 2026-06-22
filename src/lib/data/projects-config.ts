import fs from "fs";
import path from "path";

const CONFIG_FILE = path.join(process.cwd(), "data", "projects.json");

export interface ProjectConfig {
  name: string;
  path: string;
}

interface ProjectsData {
  projects: ProjectConfig[];
}

/** Default projects — used on first run to seed the config file */
const DEFAULT_PROJECTS: ProjectConfig[] = [
  { name: "devpulse", path: path.join(process.cwd()) },
];

function readConfig(): ProjectsData {
  try {
    const dir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(CONFIG_FILE)) {
      // Seed with defaults on first run
      const initial: ProjectsData = { projects: DEFAULT_PROJECTS };
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
  } catch (err) {
    console.error("[projects-config] Failed to read config file:", err);
    return { projects: [] };
  }
}

function writeConfig(data: ProjectsData) {
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
}

/** Get all configured projects */
export function getProjects(): ProjectConfig[] {
  return readConfig().projects;
}

/** Add a new project. Returns false if name or path already exists. */
export function addProject(name: string, projectPath: string): boolean {
  const data = readConfig();
  const exists = data.projects.some(
    (p) => p.name === name || p.path === projectPath
  );
  if (exists) return false;
  data.projects.push({ name, path: projectPath });
  writeConfig(data);
  return true;
}

/** Remove a project by name */
export function removeProject(name: string): boolean {
  const data = readConfig();
  const before = data.projects.length;
  data.projects = data.projects.filter((p) => p.name !== name);
  if (data.projects.length === before) return false;
  writeConfig(data);
  return true;
}

/** Update a project's name or path */
export function updateProject(
  oldName: string,
  updates: { name?: string; path?: string }
): boolean {
  const data = readConfig();
  const project = data.projects.find((p) => p.name === oldName);
  if (!project) return false;
  if (updates.name) project.name = updates.name;
  if (updates.path) project.path = updates.path;
  writeConfig(data);
  return true;
}
