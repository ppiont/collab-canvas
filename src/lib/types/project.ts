/**
 * Project, Canvas, and Permission Types
 */

/** Project entity */
export interface Project {
    id: string;
    name: string;
    ownerId: string;
    createdAt: number;
    updatedAt: number;
}

/** Canvas entity */
export interface Canvas {
    id: string;
    projectId: string;
    name: string;
    thumbnailUrl?: string;
    createdBy: string;
    createdAt: number;
    updatedAt: number;
}

/** User role in a project */
export type ProjectRole = 'owner' | 'editor' | 'viewer';

/** Permission entity */
export interface Permission {
    id: string;
    projectId: string;
    userId: string;
    role: ProjectRole;
    grantedAt: number;
    grantedBy: string;
}

/** Project with user's role */
export interface ProjectWithRole extends Project {
    userRole: ProjectRole;
}

/** Canvas with metadata */
export interface CanvasWithMetadata extends Canvas {
    shapeCount?: number;
    lastModified?: number;
    collaboratorCount?: number;
}

