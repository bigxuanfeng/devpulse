import { NextRequest, NextResponse } from "next/server";
import {
  getProjects,
  addProject,
  removeProject,
  updateProject,
} from "@/lib/data/projects-config";
import { execSync } from "child_process";

function isGitRepo(repoPath: string): boolean {
  try {
    execSync("git rev-parse --git-dir", { cwd: repoPath, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// GET - list all configured projects
export async function GET() {
  const projects = getProjects().map((p) => ({
    ...p,
    isGitRepo: isGitRepo(p.path),
  }));
  return NextResponse.json({ projects });
}

// POST - add a new project
export async function POST(req: NextRequest) {
  const { name, path: projectPath } = await req.json();

  if (!name || !projectPath) {
    return NextResponse.json(
      { error: "name and path are required" },
      { status: 400 }
    );
  }

  const gitRepo = isGitRepo(projectPath);
  const success = addProject(name, projectPath);

  if (!success) {
    return NextResponse.json(
      { error: "Project with this name or path already exists" },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true, isGitRepo: gitRepo });
}

// DELETE - remove a project by name
export async function DELETE(req: NextRequest) {
  const { name } = await req.json();

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const success = removeProject(name);

  if (!success) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

// PATCH - update a project
export async function PATCH(req: NextRequest) {
  const { oldName, name, path: projectPath } = await req.json();

  if (!oldName) {
    return NextResponse.json({ error: "oldName is required" }, { status: 400 });
  }

  const success = updateProject(oldName, {
    name: name,
    path: projectPath,
  });

  if (!success) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
