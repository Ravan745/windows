const { KazagumoPlayer } = require('kazagumo');

module.exports = class PlayerExtends extends KazagumoPlayer {
  constructor(...args) {
    super(...args);

    this.filter = false;
    this.speedAmount = 1;
    this.rateAmount = 1;
    this.pitchAmount = 1;
    this.nightcore = false;
    this.vaporwave = false;
    this.bassboostLevel = '';
    this.lofi = false;
    this.slow = false;
    this.darth = false;
    this.dance = false;
    this._8d = false;
    this.pop = false;
    this.party = false;
    this.bass = false;
    this.radio = false;
    this.treblebass = false;
    this.soft = false;
    this.electronic = false;
    this.rock = false;
    this.earrape = false;
    this.karaoke = false;
    this.message = null;
    this.autoplay = false;
  }

  async setNowplayingMessage(message) {
      if (this.message && this.message.deletable) await this.message.delete().catch(() => { });
      return this.message = message;
  }

  setShuffle() {
      this.queue.shuffle();
      return this;
  }

  setSpeed(amount) {
      if (!amount) return console.error('[Function Error]: Please provide a valid number.');
      this.filter = true;
      this.speedAmount = Math.max(Math.min(amount, 5), 0.05);

      this.shoukaku.filters.timescale = {
          speed: this.speedAmount,
          rate: this.rateAmount,
          pitch: this.pitchAmount
      };

      return this;
  }

  setEarrape(value) {
      if (typeof value !== 'boolean') return;
      this.earrape = value;

      if (this.earrape) {
          this.filter = true;
          this.shoukaku.filters.equalizer = [
              { band: 0, gain: 0.25 },
              { band: 1, gain: 0.5 },
              { band: 2, gain: -0.5 },
              { band: 3, gain: -0.25 },
              { band: 4, gain: 0 },
              { band: 5, gain: -0.0125 },
              { band: 6, gain: -0.025 },
              { band: 7, gain: -0.0175 },
              { band: 8, gain: 0 },
              { band: 9, gain: 0 },
              { band: 10, gain: 0.0125 },
              { band: 11, gain: 0.025 },
              { band: 12, gain: 0.375 },
              { band: 13, gain: 0.125 },
              { band: 14, gain: 0.125 },
          ];
      } else {
          this.shoukaku.filters.equalizer = [];
          this.earrape = false;
      }

      return this;
  }

  setPitch(amount) {
      if (typeof amount !== 'number') return console.error('[Function Error]: Please provide a valid number.');
      this.filter = true;
      this.pitchAmount = Math.max(Math.min(amount, 5), 0.05);
      this.shoukaku.filters.timescale = {
          speed: this.speedAmount,
          pitch: this.pitchAmount,
          rate: this.rateAmount,
      };

      return this;
  }

  setBassboost(level) {
      if (typeof level !== 'string') return;

      this.filter = true;
      this.bassboostLevel = level;
      let gain = 0.0;
      if (level === 'none') gain = 0.0;
      else if (level === 'low') gain = 0.10;
      else if (level === 'medium') gain = 0.15;
      else if (level === 'high') gain = 0.25;

      this.shoukaku.filters.equalizer = new Array(3).fill(null).map((_, i) => ({ band: i, gain: gain }));
      return this;
  }

  setPop(value) {
      if (typeof value !== 'boolean') return;
      this.pop = value;
      if (this.pop) {
          this.filter = true;
          this.shoukaku.filters.equalizer = [
              { band: 0, gain: -0.25 },
              { band: 1, gain: 0.48 },
              { band: 2, gain: 0.59 },
              { band: 3, gain: 0.72 },
              { band: 4, gain: 0.56 },
              { band: 5, gain: 0.15 },
              { band: 6, gain: -0.24 },
              { band: 7, gain: -0.24 },
              { band: 8, gain: -0.16 },
              { band: 9, gain: -0.16 },
              { band: 10, gain: 0 },
              { band: 11, gain: 0 },
              { band: 12, gain: 0 },
              { band: 13, gain: 0 },
              { band: 14, gain: 0 },
          ];
      } else {
          this.shoukaku.filters.equalizer = [];
      }
      return this;
  }

  setParty(value) {
      if (typeof value !== 'boolean') return;
      this.party = value;

      if (this.party) {
          this.filter = true;
          this.shoukaku.filters.equalizer = [
              { band: 0, gain: -1.16 },
              { band: 1, gain: 0.28 },
              { band: 2, gain: 0.42 },
              { band: 3, gain: 0.5 },
              { band: 4, gain: 0.36 },
              { band: 5, gain: 0 },
              { band: 6, gain: -0.3 },
              { band: 7, gain: -0.21 },
              { band: 8, gain: -0.21 },
          ];
      } else {
          this.shoukaku.filters.equalizer = [];
      }

      return this;
  }

  setBass(value) {
      if (typeof value !== 'boolean') return;
      this.bass = value;
      if (this.bass) {
          this.filter = true;
          this.shoukaku.filters.equalizer = [
              { band: 0, gain: 0.6 },
              { band: 1, gain: 0.7 },
              { band: 2, gain: 0.8 },
              { band: 3, gain: 0.55 },
              { band: 4, gain: 0.25 },
              { band: 5, gain: 0 },
              { band: 6, gain: -0.25 },
              { band: 7, gain: -0.45 },
              { band: 8, gain: -0.55 },
              { band: 9, gain: -0.7 },
              { band: 10, gain: -0.3 },
              { band: 11, gain: -0.25 },
              { band: 12, gain: 0 },
              { band: 13, gain: 0 },
              { band: 14, gain: 0 },
          ];
      } else {
          this.shoukaku.filters.equalizer = [];
      }
      return this;
  }

  setRadio(value) {
      if (typeof value !== 'boolean') return;
      this.radio = value;

      if (this.radio) {
          this.filter = true;
          this.shoukaku.filters.equalizer = [
              { band: 0, gain: 0.65 },
              { band: 1, gain: 0.45 },
              { band: 2, gain: -0.45 },
              { band: 3, gain: -0.65 },
              { band: 4, gain: -0.35 },
              { band: 5, gain: 0.45 },
              { band: 6, gain: 0.55 },
              { band: 7, gain: 0.6 },
              { band: 8, gain: 0.6 },
              { band: 9, gain: 0.6 },
              { band: 10, gain: 0 },
              { band: 11, gain: 0 },
              { band: 12, gain: 0 },
              { band: 13, gain: 0 },
              { band: 14, gain: 0 },
          ];
      } else {
          this.shoukaku.filters.equalizer = [];
      }

      return this;
  }

  setTreblebass(value) {
      if (typeof value !== 'boolean') return;
      this.treblebass = value;

      if (this.treblebass) {
          this.filter = true;
          this.shoukaku.filters.equalizer = [
              { band: 0, gain: 0.6 },
              { band: 1, gain: 0.67 },
              { band: 2, gain: 0.67 },
              { band: 3, gain: 0 },
              { band: 4, gain: -0.5 },
              { band: 5, gain: 0.15 },
              { band: 6, gain: -0.45 },
              { band: 7, gain: 0.23 },
              { band: 8, gain: 0.35 },
              { band: 9, gain: 0.45 },
              { band: 10, gain: 0.55 },
              { band: 11, gain: 0.6 },
              { band: 12, gain: 0.55 },
              { band: 13, gain: 0 },
              { band: 14, gain: 0 },
          ];
      } else {
          this.shoukaku.filters.equalizer = [];
      }

      return this;
  }

  setSoft(value) {
      if (typeof value !== 'boolean') return;
      this.soft = value;

      if (this.soft) {
          this.filter = true;
          this.shoukaku.filters.equalizer = [
              { band: 0, gain: 0 },
              { band: 1, gain: 0 },
              { band: 2, gain: 0 },
              { band: 3, gain: 0 },
              { band: 4, gain: 0 },
              { band: 5, gain: 0 },
              { band: 6, gain: 0 },
              { band: 7, gain: 0 },
              { band: 8, gain: -0.25 },
              { band: 9, gain: -0.25 },
              { band: 10, gain: -0.25 },
              { band: 11, gain: -0.25 },
              { band: 12, gain: -0.25 },
              { band: 13, gain: -0.25 },
              { band: 14, gain: -0.25 },
          ];
      } else {
          this.shoukaku.filters.equalizer = [];
      }
      return this;
  }

  setElectronic(value) {
      if (typeof value !== 'boolean') return;
      this.electronic = value;
      if (this.electronic) {
          this.filter = true;
          this.shoukaku.filters.equalizer = [
              { band: 0, gain: 0.375 },
              { band: 1, gain: 0.350 },
              { band: 2, gain: 0.125 },
              { band: 3, gain: 0 },
              { band: 4, gain: 0 },
              { band: 5, gain: -0.125 },
              { band: 6, gain: -0.125 },
              { band: 7, gain: 0 },
              { band: 8, gain: 0.25 },
              { band: 9, gain: 0.125 },
              { band: 10, gain: 0.15 },
              { band: 11, gain: 0.2 },
              { band: 12, gain: 0.250 },
              { band: 13, gain: 0.350 },
              { band: 14, gain: 0.400 },
          ];
      } else {
          this.shoukaku.filters.equalizer = [];
      }
      return this;
  }

  setRock(value) {
      if (typeof value !== 'boolean') return;
      this.rock = value;

      if (this.rock) {
          this.filter = true;
          this.shoukaku.filters.equalizer = [
              { band: 0, gain: 0.300 },
              { band: 1, gain: 0.250 },
              { band: 2, gain: 0.200 },
              { band: 3, gain: 0.100 },
              { band: 4, gain: 0.050 },
              { band: 5, gain: -0.050 },
              { band: 6, gain: -0.150 },
              { band: 7, gain: -0.200 },
              { band: 8, gain: -0.100 },
              { band: 9, gain: -0.050 },
              { band: 10, gain: 0.050 },
              { band: 11, gain: 0.100 },
              { band: 12, gain: 0.200 },
              { band: 13, gain: 0.250 },
              { band: 14, gain: 0.300 },
          ];
      } else {
          this.shoukaku.filters.equalizer = [];
      }

      return this;
  }

  setNightCore(value) {
      if (typeof value !== 'boolean') return;

      this.filter = true;
      this.nightcore = value;
      if (this.vaporwave) this.vaporwave = false;

      if (this.nightcore) {
          this.speedAmount = 1.3;
          this.pitchAmount = 1.3;
          this.shoukaku.filters.timescale = {
              speed: this.speedAmount,
              pitch: this.pitchAmount,
              rate: this.rateAmount,
          };
      } else {
          this.speedAmount = 1;
          this.pitchAmount = 1;
          this.shoukaku.filters.timescale = {
              speed: 1,
              pitch: 1,
              rate: 1,
          };
      }

      return this;
  }

  setlofi(value) {
      if (typeof value !== 'boolean') return;

      this.filter = true;
      this.lofi = value;
      if (this.vaporwave) this.vaporwave = false;

      if (this.lofi) {
        this.shoukaku.filters.timescale = { speed: 0.9, pitch: 0.9, rate: 1 };
      } else {
        this.shoukaku.filters.timescale = { speed: 1, pitch: 1, rate: 1 };
      }

      return this;
  }

  setSlow(value) {
      if (typeof value !== 'boolean') return;

      this.filter = true;
      this.slow = value;
      if (this.vaporwave) this.vaporwave = false;

      if (this.slow) {
        this.speedAmount = 0.8;
        this.pitchAmount = 0.8;
        this.shoukaku.filters.timescale = {
            speed: this.speedAmount,
            pitch: this.pitchAmount,
            rate: this.rateAmount,
        };
      } else {
        this.speedAmount = 1;
        this.pitchAmount = 1;
        this.shoukaku.filters.timescale = {
            speed: 1,
            pitch: 1,
            rate: 1,
        };
      }

      return this;
  }

  setDarth(value) {
    if (typeof value !== 'boolean') return;

    this.filter = true;
    this.darth = value;
    if (this.vaporwave) this.vaporwave = false;

    if (this.darth) {
      this.shoukaku.filters.timescale = {
          speed: 0.975,
          pitch: 0.5,
          rate: 0.8,
      };
    } else {
      this.shoukaku.filters.timescale = {
          speed: 1,
          pitch: 1,
          rate: 1,
      };
    }

    return this;
  }

  setDance(value) {
      if (typeof value !== 'boolean') return;

      this.filter = true;
      this.dance = value;
      if (this.vaporwave) this.vaporwave = false;

      if (this.dance) {
        this.shoukaku.filters.timescale = {
            speed: 1.25,
            pitch: 1.25,
            rate: 1.25,
        };
      } else {
        this.shoukaku.filters.timescale = {
            speed: 1,
            pitch: 1,
            rate: 1,
        };
      }

      return this;
  }
  
  setVaporwave(value) {
      if (typeof value !== 'boolean') return;

      this.filter = true;
      if (this.nightcore) this.nightcore = false;
      this.vaporwave = value;

      if (this.vaporwave) {
          this.speedAmount = 0.85;
          this.pitchAmount = 0.8;
          this.shoukaku.filters.timescale = {
              speed: this.speedAmount,
              pitch: this.pitchAmount,
              rate: this.rateAmount,
          };
      } else {
          this.speedAmount = 1;
          this.pitchAmount = 1;
          this.shoukaku.filters.timescale = {
              speed: 1,
              pitch: 1,
              rate: 1,
          };
      }

      return this;
  }

  set8D(value) {
      if (typeof value !== 'boolean') return;

      this.filter = true;
      this._8d = value;

      if (this._8d) {
          this.shoukaku.filters.rotation = { rotationHz: 0.2 };
      } else {
          this.shoukaku.filters.rotation = { rotationHz: 0.0 };
      }

      return this;
  }

  setKaraoke(value) {
      if (typeof value !== 'boolean') return;
      this.karaoke = value;
      if (this.karaoke) {
          this.filter = true;
          this.shoukaku.filters.karaoke = {
              level: 1.0,
              monoLevel: 1.0,
              filterBand: 220.0,
              filterWidth: 100.0
          };
      } else {
          this.shoukaku.filters.karaoke = null;
      }
      return this;
  }

  clearfilter() {
      this.shoukaku.filters.clear();
      this.speedAmount = 1;
      this.pitchAmount = 1;
      this.rateAmount = 1;
      this.bassboostLevel = '';
      this.nightcore = false;
      this.vaporwave = false;
      this.lofi = false;
      this.slow = false;
      this.darth = false;
      this.dance = false;
      this.pop = false;
      this._8d = false;
      this.filter = false;
      this.bass = false;
      this.party = false;
      this.radio = false;
      this.soft = false;
      this.electronic = false;
      this.rock = false;
      this.earrape = false;
      this.treblebass = false;
      this.karaoke = false;

      return this;
  }
}