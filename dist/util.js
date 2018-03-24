"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*
 * From http://www.redblobgames.com/maps/mapgen2/
 * Copyright 2017 Red Blob Games <redblobgames@gmail.com>
 * License: Apache v2.0 <http://www.apache.org/licenses/LICENSE-2.0.html>
 */

/**
 * Return value, unless it's undefined, then return orElse
 */
exports.fallback = function (value, orElse) {
  return value !== undefined ? value : orElse;
};

/**
 * Add several noise values together
 */
exports.fbm_noise = function (noise, amplitudes, nx, ny) {
  var sum = 0,
      sumOfAmplitudes = 0;
  for (var octave = 0; octave < amplitudes.length; octave++) {
    var frequency = 1 << octave;
    sum += amplitudes[octave] * noise.noise2D(nx * frequency, ny * frequency, octave);
    sumOfAmplitudes += amplitudes[octave];
  }
  return sum / sumOfAmplitudes;
};

/**
 * Like GLSL. Return t clamped to the range [lo,hi] inclusive
 */
exports.clamp = function (t, lo, hi) {
  if (t < lo) {
    return lo;
  }
  if (t > hi) {
    return hi;
  }
  return t;
};

/**
 * Like GLSL. Return a mix of a and b; all a when is 0 and all b when
 * t is 1; extrapolates when t outside the range [0,1]
 */
exports.mix = function (a, b, t) {
  return a * (1.0 - t) + b * t;
};

/**
 * Componentwise mix for arrays of equal length; output goes in 'out'
 */
exports.mixp = function (out, p, q, t) {
  out.length = p.length;
  for (var i = 0; i < p.length; i++) {
    out[i] = exports.mix(p[i], q[i], t);
  }
  return out;
};

/**
 * Like GLSL.
 */
exports.smoothstep = function (a, b, t) {
  // https://en.wikipedia.org/wiki/Smoothstep
  if (t <= a) {
    return 0;
  }
  if (t >= b) {
    return 1;
  }
  t = (t - a) / (b - a);
  return (3 - 2 * t) * t * t;
};

/**
 * Circumcenter of a triangle with vertices a,b,c
 */
exports.circumcenter = function (a, b, c) {
  // https://en.wikipedia.org/wiki/Circumscribed_circle#Circumcenter_coordinates
  var ad = a[0] * a[0] + a[1] * a[1],
      bd = b[0] * b[0] + b[1] * b[1],
      cd = c[0] * c[0] + c[1] * c[1];
  var D = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
  var Ux = 1 / D * (ad * (b[1] - c[1]) + bd * (c[1] - a[1]) + cd * (a[1] - b[1]));
  var Uy = 1 / D * (ad * (c[0] - b[0]) + bd * (a[0] - c[0]) + cd * (b[0] - a[0]));
  return [Ux, Uy];
};

/**
 * Intersection of line p1--p2 and line p3--p4,
 * between 0.0 and 1.0 if it's in the line segment
 */
exports.lineIntersection = function (x1, y1, x2, y2, x3, y3, x4, y4) {
  // from http://paulbourke.net/geometry/pointlineplane/
  var ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
  var ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
  return { ua: ua, ub: ub };
};

/**
 * in-place shuffle of an array - Fisher-Yates
 * https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
 */
exports.randomShuffle = function (array, randInt) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = randInt(i + 1);
    var swap = array[i];
    array[i] = array[j];
    array[j] = swap;
  }
  return array;
};

var hashInt = function hashInt(x) {
  var A;
  if ((typeof Uint32Array === "undefined" ? "undefined" : _typeof(Uint32Array)) === undefined) {
    A = [0];
  } else {
    A = new Uint32Array(1);
  }
  A[0] = x | 0;
  A[0] -= A[0] << 6;
  A[0] ^= A[0] >>> 17;
  A[0] -= A[0] << 9;
  A[0] ^= A[0] << 4;
  A[0] -= A[0] << 3;
  A[0] ^= A[0] << 10;
  A[0] ^= A[0] >>> 15;
  return A[0];
};

exports.makeRandInt = function (seed) {
  var i = 0;
  return function (N) {
    i++;
    return hashInt(seed + i) % N;
  };
};

exports.makeRandFloat = function (seed) {
  var randInt = exports.makeRandInt(seed);
  var divisor = 0x10000000;
  return function () {
    return randInt(divisor) / divisor;
  };
};