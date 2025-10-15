import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs/promises';
import FileNode from '../models/fileNode.model.js';
import {
    deleteDirectoryIfExists,
    deleteIfExists,
    ensureStorageReady,
    getFoldersDir,
    joinStorageSegments,
    resolveStoragePath,
    sanitizeName,
    streamableUrlForNode,
} from '../utils/fileManagerUtils.js';

const formatNode = (node) => ({
    id: node._id,
    name: node.name,
    type: node.type,
    parentId: node.parent,
    size: node.size,
    mimeType: node.mimeType,
    extension: node.extension,
    updatedAt: node.updatedAt,
    createdAt: node.createdAt,
    previewUrl: streamableUrlForNode(node),
});

const buildBreadcrumbs = async (parent) => {
    const baseCrumbs = [{ id: null, name: 'All Files' }];
    if (!parent) {
        return baseCrumbs;
    }

    if (!parent.ancestors || parent.ancestors.length === 0) {
        return [...baseCrumbs, { id: parent._id, name: parent.name }];
    }

    const ancestorIds = parent.ancestors.map((id) => id.toString());
    const ancestors = await FileNode.find({ _id: { $in: ancestorIds } })
        .select('_id name')
        .lean();
    const map = new Map(ancestors.map((item) => [item._id.toString(), item]));
    const ordered = ancestorIds
        .map((id) => map.get(id))
        .filter(Boolean)
        .map((item) => ({ id: item._id, name: item.name }));

    return [...baseCrumbs, ...ordered, { id: parent._id, name: parent.name }];
};

export const listDirectory = async (req, res, next) => {
    try {
        await ensureStorageReady();
        const { parentId = null } = req.query;

        let parent = null;
        let filter;

        if (parentId) {
            parent = await FileNode.findById(parentId);
            if (!parent) {
                return res.status(404).json({ message: 'Parent folder not found' });
            }
            if (parent.type !== 'folder') {
                return res.status(400).json({ message: 'Parent must be a folder' });
            }
            filter = { parent: parent._id };
        } else {
            filter = { parent: null };
        }

        const items = await FileNode.find(filter)
            .collation({ locale: 'en', strength: 2 })
            .sort({ type: -1, name: 1 })
            .lean();

        const breadcrumbs = await buildBreadcrumbs(parent);

        return res.json({
            parent: parent ? formatNode(parent) : null,
            breadcrumbs,
            items: items.map(formatNode),
        });
    } catch (error) {
        return next(error);
    }
};

export const getFolderTree = async (req, res, next) => {
    try {
        const folders = await FileNode.find({ type: 'folder' })
            .select('_id name parent ancestors updatedAt')
            .sort({ name: 1 })
            .lean();

        const byParent = new Map();
        folders.forEach((folder) => {
            const parentId = folder.parent ? folder.parent.toString() : null;
            const arr = byParent.get(parentId) || [];
            arr.push({
                id: folder._id,
                name: folder.name,
                parentId: folder.parent,
                updatedAt: folder.updatedAt,
                children: [],
            });
            byParent.set(parentId, arr);
        });

        const attachChildren = (nodes, parentId = null) =>
            (nodes[parentId] || []).map((node) => ({
                ...node,
                children: attachChildren(nodes, node.id.toString()),
            }));

        const normalized = {};
        byParent.forEach((value, key) => {
            normalized[key ?? 'root'] = value;
        });

        const tree = attachChildren(normalized, 'root');

        return res.json({
            root: { id: null, name: 'All Files' },
            folders: tree,
        });
    } catch (error) {
        return next(error);
    }
};

export const createFolder = async (req, res, next) => {
    try {
        await ensureStorageReady();

        const { name, parentId = null } = req.body;
        const sanitized = sanitizeName(name);

        if (!sanitized) {
            return res.status(400).json({ message: 'Folder name is required' });
        }

        let parent = null;
        if (parentId) {
            parent = await FileNode.findById(parentId);
            if (!parent || parent.type !== 'folder') {
                return res.status(400).json({ message: 'Parent folder not found' });
            }
        }

        const duplicate = await FileNode.findOne({
            parent: parent ? parent._id : null,
            name: sanitized,
        })
            .collation({ locale: 'en', strength: 2 })
            .lean();

        if (duplicate) {
            return res.status(409).json({ message: 'A folder with that name already exists' });
        }

        const ancestors = parent ? [...parent.ancestors, parent._id] : [];

        const folder = new FileNode({
            name: sanitized,
            type: 'folder',
            parent: parent ? parent._id : null,
            ancestors,
            storagePath: '',
        });

        folder.storagePath = joinStorageSegments('folders', folder._id.toString());

        await fs.mkdir(path.join(getFoldersDir(), folder._id.toString()), { recursive: true });
        await folder.save();

        return res.status(201).json({ folder: formatNode(folder) });
    } catch (error) {
        return next(error);
    }
};

export const handleFileUpload = async (req, res, next) => {
    try {
        await ensureStorageReady();

        const { parentId = null } = req.body;
        const parent = req.uploadParent ?? null;

        if (parentId && !parent) {
            return res.status(400).json({ message: 'Parent folder not found' });
        }

        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const originalName = sanitizeName(file.originalname);
        const ext = path.extname(originalName);
        const baseName = sanitizeName(ext ? originalName.slice(0, -ext.length) : originalName) || 'Untitled';
        const extension = ext ? ext.slice(1).toLowerCase() : '';
        const displayName = extension ? `${baseName}.${extension}` : baseName;

        const duplicate = await FileNode.findOne({
            parent: parent ? parent._id : null,
            name: displayName,
        })
            .collation({ locale: 'en', strength: 2 })
            .lean();

        if (duplicate) {
            await fs.unlink(file.path);
            return res.status(409).json({ message: 'A file with that name already exists' });
        }

        const ancestors = parent ? [...parent.ancestors, parent._id] : [];

        const fileNode = new FileNode({
            name: displayName,
            type: 'file',
            parent: parent ? parent._id : null,
            ancestors,
            size: file.size,
            mimeType: file.mimetype,
            extension,
            storagePath: '',
        });

        const finalRelativePath = joinStorageSegments(
            'files',
            extension ? `${fileNode._id.toString()}.${extension}` : fileNode._id.toString()
        );

        try {
            await fs.rename(file.path, resolveStoragePath(finalRelativePath));
        } catch (renameError) {
            await fs.unlink(file.path).catch(() => {});
            throw renameError;
        }

        fileNode.storagePath = finalRelativePath;
        await fileNode.save();

        return res.status(201).json({ file: formatNode(fileNode) });
    } catch (error) {
        return next(error);
    }
};

const updateDescendantAncestors = async (folderId, previousAncestors, newAncestors) => {
    const descendants = await FileNode.find({ ancestors: folderId }).lean();
    if (!descendants.length) {
        return;
    }

    const folderIdString = folderId.toString();
    const prefix = [...previousAncestors, folderIdString];
    const replacement = [...newAncestors, folderIdString];

    await Promise.all(
        descendants.map((node) => {
            const current = node.ancestors.map((ancestorId) => ancestorId.toString());
            const idx = current.findIndex((id) => id === prefix[0]);
            let updatedAncestors;

            if (idx === -1) {
                updatedAncestors = current;
            } else {
                const remainder = current.slice(idx + prefix.length);
                updatedAncestors = [...replacement, ...remainder];
            }

            const parsedAncestors = updatedAncestors.map((value) =>
                new mongoose.Types.ObjectId(value)
            );

            return FileNode.updateOne(
                { _id: node._id },
                {
                    $set: {
                        ancestors: parsedAncestors,
                    },
                }
            );
        })
    );
};

export const updateNode = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, newParentId = null } = req.body;

        const node = await FileNode.findById(id);
        if (!node) {
            return res.status(404).json({ message: 'Item not found' });
        }

        let hasChanges = false;
        let parentChanged = false;
        let parent;

        if (typeof newParentId !== 'undefined') {
            if (newParentId) {
                parent = await FileNode.findById(newParentId);
                if (!parent || parent.type !== 'folder') {
                    return res.status(400).json({ message: 'Target folder not found' });
                }
            } else {
                parent = null;
            }

            if (newParentId && parent && parent.ancestors.map(String).includes(node._id.toString())) {
                return res.status(400).json({ message: 'Cannot move a folder into its descendant' });
            }

            const newParentObjectId = parent ? parent._id : null;
            if ((node.parent ?? null)?.toString() !== (newParentObjectId ?? null)?.toString()) {
                parentChanged = true;
                hasChanges = true;
            }
        } else if (node.parent) {
            parent = await FileNode.findById(node.parent);
        }

        let sanitizedName;
        if (typeof name === 'string') {
            sanitizedName = sanitizeName(name);
            if (!sanitizedName) {
                return res.status(400).json({ message: 'A valid name is required' });
            }

            if (node.type === 'file') {
                const ext = node.extension ? `.${node.extension}` : '';
                if (!sanitizedName.toLowerCase().endsWith(ext.toLowerCase()) && ext) {
                    sanitizedName = `${sanitizedName}${ext}`;
                }
            }

            if (sanitizedName !== node.name) {
                hasChanges = true;
            }
        }

        const effectiveParent = parentChanged ? parent : parent ?? (node.parent ? await FileNode.findById(node.parent) : null);
        const targetParentId = effectiveParent ? effectiveParent._id : null;

        if (hasChanges) {
            const duplicateFilter = {
                parent: targetParentId,
                name: sanitizedName ?? node.name,
                _id: { $ne: node._id },
            };
            const duplicate = await FileNode.findOne(duplicateFilter)
                .collation({ locale: 'en', strength: 2 })
                .lean();
            if (duplicate) {
                return res.status(409).json({ message: 'Another item with that name already exists here' });
            }
        } else {
            return res.json({ item: formatNode(node) });
        }

        const oldAncestors = node.ancestors.map((id) => id.toString());
        const newAncestors = parentChanged
            ? effectiveParent
                ? [...effectiveParent.ancestors, effectiveParent._id]
                : []
            : oldAncestors;

        const updates = {};
        if (sanitizedName && sanitizedName !== node.name) {
            updates.name = sanitizedName;
        }
        if (parentChanged) {
            updates.parent = targetParentId;
            updates.ancestors = newAncestors;
        }

        if (Object.keys(updates).length > 0) {
            await FileNode.updateOne({ _id: node._id }, { $set: updates });
        }

        if (parentChanged && node.type === 'folder') {
            await updateDescendantAncestors(node._id, oldAncestors, newAncestors);
        }

        const fresh = await FileNode.findById(node._id);
        return res.json({ item: formatNode(fresh) });
    } catch (error) {
        return next(error);
    }
};

export const deleteNode = async (req, res, next) => {
    try {
        const { id } = req.params;
        const node = await FileNode.findById(id);
        if (!node) {
            return res.status(404).json({ message: 'Item not found' });
        }

        const related = await FileNode.find({
            $or: [{ _id: node._id }, { ancestors: node._id }],
        }).lean();

        const fileNodes = related.filter((item) => item.type === 'file');
        const folderNodes = related.filter((item) => item.type === 'folder');

        await Promise.all(
            fileNodes.map((file) => deleteIfExists(resolveStoragePath(file.storagePath)))
        );

        await Promise.all(
            folderNodes.map((folder) =>
                deleteDirectoryIfExists(path.join(getFoldersDir(), folder._id.toString()))
            )
        );

        await FileNode.deleteMany({ _id: { $in: related.map((item) => item._id) } });

        return res.json({ success: true });
    } catch (error) {
        return next(error);
    }
};

export const downloadFile = async (req, res, next) => {
    try {
        const { id } = req.params;
        const node = await FileNode.findById(id);
        if (!node || node.type !== 'file') {
            return res.status(404).json({ message: 'File not found' });
        }

        const absolutePath = resolveStoragePath(node.storagePath);
        res.setHeader('Content-Type', node.mimeType || 'application/octet-stream');
        res.setHeader(
            'Content-Disposition',
            `inline; filename="${encodeURIComponent(node.name)}"`
        );
        return res.sendFile(absolutePath);
    } catch (error) {
        return next(error);
    }
};
