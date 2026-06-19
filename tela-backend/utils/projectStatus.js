import Milestone from '../models/Milestone.js';
import Project from '../models/Project.js';

export function deriveProjectStatus(milestones) {
  if (!milestones.length) return 'planning';

  const statuses = milestones.map((m) => m.status);
  const done = new Set(['approved', 'completed']);

  if (statuses.every((s) => done.has(s))) return 'completed';
  if (statuses.some((s) => s === 'under_review')) return 'under_review';
  if (statuses.some((s) => s === 'in_progress')) return 'in_progress';
  return 'planning';
}

export async function syncProjectStatus(projectId) {
  const milestones = await Milestone.find({ project: projectId });
  const status = deriveProjectStatus(milestones);
  await Project.findByIdAndUpdate(projectId, { status });
  return status;
}
