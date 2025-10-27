import { createElement } from 'react';
import {
    HiOutlineCpuChip,
    HiOutlineListBullet,
    HiOutlineMusicalNote,
    HiOutlinePencilSquare,
    HiOutlineShieldCheck,
} from 'react-icons/hi2';

const ICON_COMPONENTS = {
    'main': HiOutlineShieldCheck,
    'scratchpad': HiOutlinePencilSquare,
    'now-playing': HiOutlineMusicalNote,
    'status': HiOutlineCpuChip,
    'queue': HiOutlineListBullet,
};

export function iconComponentForType(type) {
    return ICON_COMPONENTS[type] || null;
}

export function renderWindowIcon(type, className = 'h-4 w-4') {
    const Icon = iconComponentForType(type);
    if (!Icon) return null;
    return createElement(Icon, { className });
}
