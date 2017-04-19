'use strict';

// MATH LIB
function lineCoefficients(p1, p2) {
  var slope = 0;
  if ((p2.x - p1.x) !== 0) {
    slope = (p2.y - p1.y) / (p2.x - p1.x);
  }

  var intercept = p2.y - (slope * p2.x);

  return {
    a: slope,
    b: intercept
  };
}

function intersectionPoint(a1, b1, a2, b2) {
  if ((a1 - a2) === 0) {
    return false;
  }

  var x = (b2 - b1) / (a1 - a2);
  var y = ((a1 * b2) - (a2 * b1)) / (a1 - a2);

  return {
    x: x,
    y: y
  };
}

function lieBetween(t, p1, p2) {
  var v = new Vector(t.x - p1.x, t.y - p1.y);
  var w = new Vector(t.x - p2.x, t.y - p2.y);

  var d = v.dot(w);
  return d < 0;
}

function normalVectorToLine(coeff) {
  var p1 = new Vector(0, coeff.b);
  var p2 = new Vector(1, coeff.a + coeff.b);

  var v = new Vector(p2.x - p1.x, p2.y - p1.y);
  v.rotate(Math.PI / 2);
  return v;
}

var Polygon = function(center, vertices, color, width) {
  var self = this;

  self.center = center;
  self.vertices = vertices;
  self.sides = vertices.length;
  self.color = color;
  self.width = width;
  self.segments = [];
  self.coeffs = [];
  self.normalVectors = [];

  self.computeBoundaryEquations = function() {
    self.coeffs = [];

    var next = 0;
    var p1 = null;
    var p2 = null;
    var coeff = null;
    var index = '';
    var normal = null;
    var v = null;

    for (var i = 0; i < self.vertices.length; i++) {
      next = (i + 1) % self.vertices.length;
      p1 = self.vertices[i];
      p2 = self.vertices[next];
      coeff = lineCoefficients(p1, p2);

      self.segments.push({
        p1: p1,
        p2: p2
      });
      self.coeffs.push(coeff);

      normal = normalVectorToLine(coeff);
      // make sure that it's pointed inward
      v = new Vector(p1.x - self.center.x, p1.y - self.center.y);
      if (v.dot(normal) < 0) {
        normal.flip();
      }
      self.normalVectors.push(normal);
    }
  };

  self.render = function(ctx) {
    ctx.beginPath();
    ctx.moveTo(self.vertices[0].x, self.vertices[0].y);

    for (var i = 1; i < self.vertices.length; i += 1) {
      ctx.lineTo(self.vertices[i].x, self.vertices[i].y);
    }

    ctx.lineTo(self.vertices[0].x, self.vertices[0].y);

    ctx.strokeStyle = self.color;
    ctx.lineWidth = self.width;
    ctx.stroke();
  };

  self.collisionPoint = function(current, next) {
    var coeff = lineCoefficients(current, next);

    var points = [];
    var intersect = false;

    for (var i = 0; i < self.coeffs.length; i++) {
      intersect = intersectionPoint(
        coeff.a,
        coeff.b,
        self.coeffs[i].a,
        self.coeffs[i].b
      );

      if (intersect) {
        // is aligned
        var p1 = self.segments[i].p1;
        var p2 = self.segments[i].p2;
        if (lieBetween(intersect, p1, p2)) {
          // is on a bound
          if (lieBetween(next, current, intersect)) {
            // will intersect

            var normal = self.normalVectors[i];
            return {
              intersect: intersect,
              normal: normal
            };
          }
        }
      }
    }

    return {
      intersect: false,
      bounce: false
    };
  };

  self.isInBound = function(p) {
    var v = null;
    var e = null;
    var normal = null;
    for (var i = 0; i < self.segments.length; i++) {
      e = self.segments[i].p1;
      normal = self.normalVectors[i];

      // test on which side of the segment lies p
      v = new Vector(p.x - e.x, p.y - e.y);
      if (v.dot(normal) > 0) {
        return false;
      }
    }

    return true;
  };

  self.computeBoundaryEquations();
};
