/*
 * From http://www.redblobgames.com/maps/mapgen2/
 * Copyright 2017 Red Blob Games <redblobgames@gmail.com>
 * License: Apache v2.0 <http://www.apache.org/licenses/LICENSE-2.0.html>
 */

'use strict';

/**
 * Find regions adjacent to rivers; out_r should be a Set
 */

exports.find_riverbanks_r = function (out_r, mesh, s_flow) {
    for (var s = 0; s < mesh.numSolidSides; s++) {
        if (s_flow[s] > 0) {
            out_r.add(mesh.s_begin_r(s));
            out_r.add(mesh.s_end_r(s));
        }
    }
};

/**
 * Find lakeshores -- regions adjacent to lakes; out_r should be a Set
 */
exports.find_lakeshores_r = function (out_r, mesh, r_ocean, r_water) {
    for (var s = 0; s < mesh.numSolidSides; s++) {
        var r0 = mesh.s_begin_r(s),
            r1 = mesh.s_end_r(s);
        if (r_water[r0] && !r_ocean[r0]) {
            out_r.add(r0);
            out_r.add(r1);
        }
    }
};

/**
 * Find regions that have maximum moisture; returns a Set
 */
exports.find_moisture_seeds_r = function (mesh, s_flow, r_ocean, r_water) {
    var seeds_r = new Set();
    exports.find_riverbanks_r(seeds_r, mesh, s_flow);
    exports.find_lakeshores_r(seeds_r, mesh, r_ocean, r_water);
    return seeds_r;
};

/**
 * Assign moisture level. Oceans and lakes have moisture 1.0. Land
 * regions have moisture based on the distance to the nearest fresh
 * water. Lakeshores and riverbanks are distance 0. Moisture will be
 * 1.0 at distance 0 and go down to 0.0 at the maximum distance.
 */
exports.assign_r_moisture = function (r_moisture, r_waterdistance, mesh, r_water, seed_r /* Set */
) {
    r_waterdistance.length = mesh.numRegions;
    r_moisture.length = mesh.numRegions;
    r_waterdistance.fill(null);

    var out_r = [];
    var queue_r = Array.from(seed_r);
    var maxDistance = 1;
    queue_r.forEach(function (r) {
        r_waterdistance[r] = 0;
    });
    while (queue_r.length > 0) {
        var current_r = queue_r.shift();
        mesh.r_circulate_r(out_r, current_r);
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = out_r[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var neighbor_r = _step.value;

                if (!r_water[neighbor_r] && r_waterdistance[neighbor_r] === null) {
                    var newDistance = 1 + r_waterdistance[current_r];
                    r_waterdistance[neighbor_r] = newDistance;
                    if (newDistance > maxDistance) {
                        maxDistance = newDistance;
                    }
                    queue_r.push(neighbor_r);
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

    r_waterdistance.forEach(function (d, r) {
        r_moisture[r] = r_water[r] ? 1.0 : 1.0 - Math.pow(d / maxDistance, 0.5);
    });
};

/**
 * Redistribute moisture values evenly so that all moistures
 * from min_moisture to max_moisture are equally represented.
 */
exports.redistribute_r_moisture = function (r_moisture, mesh, r_water, min_moisture, max_moisture) {
    var land_r = [];
    for (var r = 0; r < mesh.numSolidRegions; r++) {
        if (!r_water[r]) {
            land_r.push(r);
        }
    }

    land_r.sort(function (r1, r2) {
        return r_moisture[r1] - r_moisture[r2];
    });

    for (var i = 0; i < land_r.length; i++) {
        r_moisture[land_r[i]] = min_moisture + (max_moisture - min_moisture) * i / (land_r.length - 1);
    }
};