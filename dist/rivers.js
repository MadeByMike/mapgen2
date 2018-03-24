/*
 * From http://www.redblobgames.com/maps/mapgen2/
 * Copyright 2017 Red Blob Games <redblobgames@gmail.com>
 * License: Apache v2.0 <http://www.apache.org/licenses/LICENSE-2.0.html>
 */

'use strict';

var MIN_SPRING_ELEVATION = 0.3;
var MAX_SPRING_ELEVATION = 0.9;

/**
 * Find candidates for river sources
 *
 * Unlike the assign_* functions this does not write into an existing array
 */
exports.find_spring_t = function (mesh, r_water, t_elevation, t_downslope_s) {
    var t_water = function t_water(t) {
        return r_water[mesh.s_begin_r(3 * t)] || r_water[mesh.s_begin_r(3 * t + 1)] || r_water[mesh.s_begin_r(3 * t + 2)];
    };

    var spring_t = new Set();
    // Add everything above some elevation, but not lakes
    for (var t = 0; t < mesh.numSolidTriangles; t++) {
        if (t_elevation[t] >= MIN_SPRING_ELEVATION && t_elevation[t] <= MAX_SPRING_ELEVATION && !t_water(t)) {
            spring_t.add(t);
        }
    }
    return Array.from(spring_t);
};

exports.assign_s_flow = function (s_flow, mesh, t_downslope_s, river_t) {
    // Each river in river_t contributes 1 flow down to the coastline
    s_flow.length = mesh.numSides;
    s_flow.fill(0);
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = river_t[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var t = _step.value;

            for (;;) {
                var s = t_downslope_s[t];
                if (s === -1) {
                    break;
                }
                s_flow[s]++;
                var next_t = mesh.s_outer_t(s);
                if (next_t === t) {
                    break;
                }
                t = next_t;
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

    return s_flow;
};