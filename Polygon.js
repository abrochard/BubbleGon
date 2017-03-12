var Polygon = function(vertices, color, width) {
  var self = this;

  self.vertices = vertices;
  self.sides = vertices.length;
  self.color = color;
  self.width = width;
  self.segments = [];
  self.coeffs = [];

  self.computeBoundaryEquations = function() {
    self.coeffs = [];

    var next = 0;
    var p1 = null;
    var p2 = null;
    var coeff = null;
    var index = '';

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

            var normal = normalVectorToLine(self.coeffs[i]);
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

  self.computeBoundaryEquations();
};
