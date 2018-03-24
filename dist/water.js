// From http://www.redblobgames.com/maps/mapgen2/
// Copyright 2017 Red Blob Games <redblobgames@gmail.com>
// License: Apache v2.0 <http://www.apache.org/licenses/LICENSE-2.0.html>

'use strict';

var util = require('./util');

// NOTE: r_water, r_ocean, other fields are boolean valued so it
// could be more efficient to pack them as bit fields in Uint8Array

/* a region is water if the noise value is low */
exports.assign_r_water = function (r_water, mesh, noise, params) {
    r_water.length = mesh.numRegions;
    for (var r = 0; r < mesh.numRegions; r++) {
        if (mesh.r_ghost(r) || mesh.r_boundary(r)) {
            r_water[r] = true;
        } else {
            var nx = (mesh.r_x(r) - 500) / 500;
            var ny = (mesh.r_y(r) - 500) / 500;
            var distance = Math.max(Math.abs(nx), Math.abs(ny));
            var n = util.fbm_noise(noise, params.amplitudes, nx, ny);
            n = util.mix(n, 0.5, params.round);
            r_water[r] = n - (1.0 - params.inflate) * distance * distance < 0;
        }
    }
    return r_water;
};

/* a region is ocean if it is a water region connected to the ghost region,
   which is outside the boundary of the map; this could be any seed set but
   for islands, the ghost region is a good seed */
exports.assign_r_ocean = function (r_ocean, mesh, r_water) {
    r_ocean.length = mesh.numRegions;
    r_ocean.fill(false);
    var stack = [mesh.ghost_r()];
    var r_out = [];
    while (stack.length > 0) {
        var r1 = stack.pop();
        mesh.r_circulate_r(r_out, r1);
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = r_out[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var r2 = _step.value;

                if (r_water[r2] && !r_ocean[r2]) {
                    r_ocean[r2] = true;
                    stack.push(r2);
                }
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
    }
    return r_ocean;
};