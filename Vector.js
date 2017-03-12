var Vector = function(x, y) {
  var self = this;
  self.x = x;
  self.y = y;

  self.norm = function() {
    return Math.sqrt((self.x * self.x) + (self.y * self.y));
  };

  self.distanceTo = function(v) {
    return (new Vector(self.x - v.x, self.y - v.y)).norm();
  };

  self.lineCoefficientsTo = function(v) {
    var slope = 0;
    if ((v.x - self.x) !== 0) {
      slope = (v.y - self.y) / (v.x - self.x);
    }

    var intercept = v.y - (slope * v.x);

    return {
      a: slope,
      b: intercept
    };
  };

  self.dot = function(v) {
    return (self.x * v.x) + (self.y * v.y);
  };

  self.normalize = function() {
    var n = self.norm();
    self.x /= n;
    self.y /= n;

    return self;
  };

  self.normal = function() {
    var x = 1;
    var y = -self.x / self.y;

    self.x = x;
    self.y = y;

    return self;
  };

  self.rotate = function(angle) {
    var m = [];
    m[0] = [Math.cos(angle), -Math.sin(angle)];
    m[1] = [Math.sin(angle), Math.cos(angle)];

    var x = (m[0][0] * self.x) + (m[0][1] * self.y);
    var y = (m[1][0] * self.x) + (m[1][1] * self.y);

    self.x = x;
    self.y = y;

    return self;
  };

  self.reflect = function(v) {
    v.normal().normalize();
    var f = 2 * self.dot(v);

    var x = self.x - (f * v.x);
    var y = self.y - (f * v.y);

    self.x = x;
    self.y = y;

    return self;
  };

  self.flip = function() {
    return self.rotate(Math.PI);
  };
};
