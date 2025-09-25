import test from 'node:test';
import assert from 'node:assert/strict';

import router from './quiz.route.js';
import { getSingleQuizBySlug, getSingleQuizById } from '../controllers/quiz.controller.js';

const getRouteOrderIndex = (handler) => {
    const layers = router.stack.filter(layer => layer.route);
    return layers.findIndex(layer =>
        layer.route.stack.some(stackItem => stackItem.handle === handler)
    );
};

test('slug route is registered before id route to avoid path collisions', () => {
    const slugIndex = getRouteOrderIndex(getSingleQuizBySlug);
    const idIndex = getRouteOrderIndex(getSingleQuizById);

    assert.notEqual(slugIndex, -1, 'Slug route should be registered');
    assert.notEqual(idIndex, -1, 'ID route should be registered');
    assert.ok(
        slugIndex < idIndex,
        'Slug route must be registered before the more generic ID route'
    );
});
