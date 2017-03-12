// CONSTANTS
var GON_CHORD = 100;
var CHORD_SCALING = 1.2;
var CENTER_X = 250;
var CENTER_Y = 250;
var SIDES = 6;
var RADIUS = 10;
var RADIUS_SCALING = 23;
var MARGIN = 5;
var SPEED = 15;
var SELECTED_COLOR = 'white';

// GLOBAL VAR
var ctx = null;
var raf = null;

var input = true;
var selected = null;

var frame = 0;
var intersectFrame = -1;
var intersect = null;
var bounce = null;

var polygon = null;
var bubbles = [];
var cannons = [];

// CLASSES
var Bubble = function(x, y, color) {
  var self = this;

  self.x = x;
  self.y = y;
  self.color = color;

  self.vx = 0;
  self.vy = 0;

  self.selectable = false;
  self.selected = false;

  self.radius = RADIUS;

  self.setSelectable = function(s) {
    self.selectable = s;
  };

  self.setSelected = function(s) {
    self.selected = s;
  };

  self.render = function() {
    self.updatePosition();

    ctx.beginPath();
    ctx.arc(self.x, self.y, self.radius, 0, Math.PI * 2, true);
    ctx.fillStyle = self.color;
    ctx.fill();

    if (self.selected) {
      ctx.beginPath();
      ctx.arc(self.x, self.y, self.radius / 3, 0, Math.PI * 2, true);
      ctx.fillStyle = SELECTED_COLOR;
      ctx.fill();
    }
  };

  self.clicked = function(x, y) {
    var dist = norm(self.x - x, self.y - y);

    return dist <= self.radius;
  };

  self.setSpeed = function(vx, vy) {
    self.vx = vx;
    self.vy = vy;
  };

  self.stop = function() {
    self.setSpeed(0, 0);
  };

  self.setDirection = function(x, y) {
    var n = norm(x - self.x, y - self.y);
    self.setSpeed((x - self.x) / n * SPEED, (y - self.y) / n * SPEED);
  };

  self.updatePosition = function() {
    self.x += self.vx;
    self.y += self.vy;
  };

  self.bounce = function(vx, vy) {
    var v = reflectVector(
      {
        x: self.vx,
        y: self.vy
      },
      {
        x: vx,
        y: vy
      }
    );

    self.setDirection(v.x, v.y);
  };

  self.vertex = function() {
    return {
      x: self.x,
      y: self.y
    };
  };

  self.collisionFrame = function(p) {
    var d = dist(p, self.vertex());
    var vel = {
      x: self.vx,
      y: self.vy
    };
    var v = dist(self.vertex(), vel);

    var x = d / v;
    return Math.floor(x);
  };
};

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
      coeff = lineCoefficients(p1.x, p1.y, p2.x, p2.y);

      self.segments.push({
        p1: p1,
        p2: p2
      });
      self.coeffs.push(coeff);
    }
  };

  self.render = function() {
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

  self.collisionPoint = function(x, y, vx, vy) {
    var coeff = lineCoefficients(x, y, x + vx, y + vy);

    var points = [];
    var intersect = false;
    var current = null;
    var next = null;

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
          current = {x: x, y: y};
          next = {x: x + vx, y: y + vy};
          if (lieBetween(next, current, intersect)) {
            // will intersect

            var bounce = normalVectorToLine(self.coeffs[i]);
            return {
              intersect: intersect,
              bounce: bounce
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

// MATH LIB
function norm(a, b) {
  return Math.sqrt((a * a) + (b * b));
}

function dist(a, b) {
  return norm(a.x - b.x, a.y - b.y);
}

function lineCoefficients(x1, y1, x2, y2) {
  var slope = 0;
  if ((x2 - x1) !== 0) {
    slope = (y2 - y1) / (x2 - x1);
  }

  var intercept = y2 - (slope * x2);

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

function dot(v, w) {
  var d = (v.x * w.x) + (v.y * w.y);
  return d;
}

function lieBetween(t, p1, p2) {
  var v = {
    x: t.x - p1.x,
    y: t.y - p1.y
  };
  var w = {
    x: t.x - p2.x,
    y: t.y - p2.y
  };

  var d = dot(v, w);
  return d < 0;
}

function normalize(v) {
  var n = norm(v.x, v.y);
  return {
    x: v.x / n,
    y: v.y / n
  };
}

function rotateVector(v, angle) {
  var m = [];
  m[0] = [Math.cos(angle), -Math.sin(angle)];
  m[1] = [Math.sin(angle), Math.cos(angle)];

  return {
    x: (m[0][0] * v.x) + (m[0][1] * v.y),
    y: (m[1][0] * v.x) + (m[1][1] * v.y)
  };
}

function normalVectorToLine(coeff) {
  var p1 = {
    x: 0,
    y: coeff.b
  };
  var p2 = {
    x: 1,
    y: coeff.a + coeff.b
  };

  var v = {
    x: p2.x - p1.x,
    y: p2.y - p1.y
  };

  return rotateVector(v, Math.PI / 2);
}

function reflectVector(v, d) {
  var n = normalize(d);
  var f = 2 * dot(v, n);

  return {
    x: v.x - (f * n.x),
    y: v.y - (f * n.y)
  };
}

// CORE
function scale() {
  // scale canvas
  ctx.canvas.width  = window.innerWidth;
  ctx.canvas.height = window.innerHeight;

  // scaling everything based on canvas size
  CENTER_X = window.innerWidth / 2;
  CENTER_Y = window.innerHeight / 2;
  GON_CHORD = Math.min(CENTER_X, CENTER_Y) / CHORD_SCALING;
  RADIUS = GON_CHORD / RADIUS_SCALING;
}

function init() {
  var canvas = document.getElementById('board');
  if (canvas.getContext) {
    ctx = canvas.getContext('2d');

    scale();

    var center = {
      x: CENTER_X,
      y: CENTER_Y
    };
    polygon = new Polygon(registerVertices(), 'black', 3);

    registerVertices();
    setupCannons('blue');

    var b = new Bubble(CENTER_X, CENTER_Y, 'red');
    bubbles.push(b);

    canvas.addEventListener('click', onClick);
    render();
  }
}

function onClick(e) {
  if (!input) {
    return;
  }

  var s = cannons.find(function(b) {
    return b.clicked(e.x, e.y);
  });

  if (s) { // a cannon was clicked on
    unselect();
    s.setSelected(true);
    selected = s;
    render();
  } else if (selected) { // empty space was clicked
    input = false;
    selected.setDirection(e.x, e.y);

    detectCollision();

    bubbles.push(new Bubble(intersect.x, intersect.y, 'green'));
    bubbles.push(new Bubble(bounce.x, bounce.y, 'green'));

    render();
  }
}

function unselect() {
  if (selected) {
    selected.setSelected(false);
  }
}

function registerVertices() {
  var vertices = [];

  for (var i = 0; i < SIDES; i++) {
    vertices.push({
      x: CENTER_X + GON_CHORD * Math.cos(i * 2 * Math.PI / SIDES),
      y: CENTER_Y + GON_CHORD * Math.sin(i * 2 * Math.PI / SIDES)
    });
  }

  return vertices;
}

function setupCannons(color) {
  var dist = (GON_CHORD - RADIUS - MARGIN);

  for (var i = 0; i < SIDES; i++) {
    var b = new Bubble(
      CENTER_X + dist * Math.cos(i * 2 * Math.PI / SIDES),
      CENTER_Y + dist * Math.sin(i * 2 * Math.PI / SIDES),
      color
    );
    b.setSelectable(true);

    cannons.push(b);
  }
}

function clearCanvas() {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function render() {
  frame++;

  if (selected && !input) {
    if (dist(selected.vertex(), intersect) <= selected.radius) {
      selected.bounce(bounce.x, bounce.y);

      detectCollision();
    }
  }

  clearCanvas();

  polygon.render();

  cannons.forEach(function(b) {
    b.render();
  });

  bubbles.forEach(function(b) {
    b.render();
  });

  if (!input) {
    raf = requestAnimationFrame(render);
  } else if (raf) {
    cancelAnimationFrame(raf);
    raf = null;
    input = true;
  }
}

function detectCollision() {
  var coll = polygon.collisionPoint(
    selected.x,
    selected.y,
    selected.vx,
    selected.vy
  );

  intersect = coll.intersect;
  bounce = coll.bounce;

  intersectFrame = frame + selected.collisionFrame(intersect);
}
