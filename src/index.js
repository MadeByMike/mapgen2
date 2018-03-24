/*
 * From http://www.redblobgames.com/maps/mapgen2/
 * Copyright 2017 Red Blob Games <redblobgames@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const util = require("./util");
const Water = require("./water");
const Elevation = require("./elevation");
const Rivers = require("./rivers");
const Moisture = require("./moisture");
const Biomes = require("./biomes");
const NoisyEdges = require("./noisy-edges");
const DualMesh = require("@redblobgames/dual-mesh");
const createMesh = require("@redblobgames/dual-mesh/dist/create");
const SimplexNoise = require("simplex-noise");
const defaultOptions = {
  seed: 10,
  persistence: 0,
  size: "medium",
  numRivers: 30,
  drainageSeed: 0,
  riverSeed: 0,
  noisyEdge: { length: 10, amplitude: 0.2 },
  biomeBias: {
    moisture: 0,
    north_temperature: 0,
    south_temperature: 0
  }
};
/**
 * Map generator
 *
 * Map coordinates are 0 ≤ x ≤ 1000, 0 ≤ y ≤ 1000.
 *
 * options
 */
class MapGen {
  constructor(options) {
    this.options = Object.assign(defaultOptions, options);

    const spacing = {
      tiny: 38,
      small: 26,
      medium: 18,
      large: 12.8,
      huge: 9
    };

    this.mesh = new DualMesh(
      createMesh({
        spacing: spacing[this.options.size],
        random: util.makeRandFloat(this.options.seed)
      })
    );

    this.s_lines = NoisyEdges.assign_s_segments(
      [],
      this.mesh,
      this.options.noisyEdge,
      util.makeRandInt(this.options.seed)
    );

    this.r_water = [];
    this.r_ocean = [];
    this.t_coastdistance = [];
    this.t_elevation = [];
    this.t_downslope_s = [];
    this.r_elevation = [];
    this.s_flow = [];
    this.r_waterdistance = [];
    this.r_moisture = [];
    this.r_coast = [];
    this.r_temperature = [];
    this.r_biome = [];
  }

  generate(newopts) {
    const options = newopts
      ? Object.assign(this.options, newopts)
      : this.options;

    const noise = new SimplexNoise(util.makeRandFloat(this.options.seed));

    const islandShape = Object.assign({
      round: 0.5,
      inflate: 0.4,
      amplitudes: Array.from({ length: 5 }, (_, octave) =>
        Math.pow(Math.pow(1 / 2, 1 + options.persistence), octave)
      )
    });

    Water.assign_r_water(this.r_water, this.mesh, noise, islandShape);
    Water.assign_r_ocean(this.r_ocean, this.mesh, this.r_water);

    Elevation.assign_t_elevation(
      this.t_elevation,
      this.t_coastdistance,
      this.t_downslope_s,
      this.mesh,
      this.r_ocean,
      this.r_water,
      util.makeRandInt(options.drainageSeed)
    );
    Elevation.redistribute_t_elevation(this.t_elevation, this.mesh);
    Elevation.assign_r_elevation(
      this.r_elevation,
      this.mesh,
      this.t_elevation,
      this.r_ocean
    );

    this.spring_t = Rivers.find_spring_t(
      this.mesh,
      this.r_water,
      this.t_elevation,
      this.t_downslope_s
    );
    util.randomShuffle(this.spring_t, util.makeRandInt(options.riverSeed));

    this.river_t = this.spring_t.slice(0, options.numRivers);
    Rivers.assign_s_flow(
      this.s_flow,
      this.mesh,
      this.t_downslope_s,
      this.river_t,
      this.t_elevation
    );

    Moisture.assign_r_moisture(
      this.r_moisture,
      this.r_waterdistance,
      this.mesh,
      this.r_water,
      Moisture.find_moisture_seeds_r(
        this.mesh,
        this.s_flow,
        this.r_ocean,
        this.r_water
      )
    );
    Moisture.redistribute_r_moisture(
      this.r_moisture,
      this.mesh,
      this.r_water,
      options.biomeBias.moisture,
      1 + options.biomeBias.moisture
    );

    Biomes.assign_r_coast(this.r_coast, this.mesh, this.r_ocean);
    Biomes.assign_r_temperature(
      this.r_temperature,
      this.mesh,
      this.r_ocean,
      this.r_water,
      this.r_elevation,
      this.r_moisture,
      options.biomeBias.north_temperature,
      options.biomeBias.south_temperature
    );
    Biomes.assign_r_biome(
      this.r_biome,
      this.mesh,
      this.r_ocean,
      this.r_water,
      this.r_coast,
      this.r_temperature,
      this.r_moisture
    );
  }
}

module.exports = MapGen;
