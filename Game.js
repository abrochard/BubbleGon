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

var DEBUG = false;

// GLOBAL VAR
var ctx = null;
var raf = null;
var center = null;

var input = true;
var selected = null;

var frame = 0;
var intersect = null;
var normal = null;

var polygon = null;
var cannons = [];
var grid = null;

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

function reset() {
  raf = null;
  center = null;

  input = true;
  selected = null;

  frame = 0;
  intersect = null;
  normal = null;

  polygon = null;
  cannons = [];
  grid = null;
}

function init() {
  var canvas = document.getElementById('board');
  if (canvas.getContext) {
    ctx = canvas.getContext('2d');

    scale();

    clearCanvas();
    reset();

    center = new Vector(CENTER_X, CENTER_Y);
    polygon = new Polygon(registerVertices(), 'black', 3);

    setupCannons('blue');
    setupGrid('red');

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
    removeFromCannons(selected);
    selected.setSelected(false);
    selected.setDirection(e);

    detectBoundaryCollision();

    render();
  }
}

function unselect() {
  if (selected) {
    selected.setSelected(false);
  }
}

function removeFromCannons(c) {
  var index = cannons.indexOf(c);
  if (index >= 0) {
    cannons.splice(index, 1);
  }
}

function registerVertices() {
  var vertices = [];

  for (var i = 0; i < SIDES; i++) {
    vertices.push(new Vector(
      CENTER_X + GON_CHORD * Math.cos(i * 2 * Math.PI / SIDES),
      CENTER_Y + GON_CHORD * Math.sin(i * 2 * Math.PI / SIDES)
    ));
  }

  return vertices;
}

function setupCannons(color) {
  var dist = (GON_CHORD - RADIUS - MARGIN);

  for (var i = 0; i < SIDES; i++) {
    var b = new Bubble(
      CENTER_X + dist * Math.cos(i * 2 * Math.PI / SIDES),
      CENTER_Y + dist * Math.sin(i * 2 * Math.PI / SIDES),
      color,
      RADIUS,
      SPEED
    );
    b.setSelectable(true);

    cannons.push(b);
  }
}

function setupGrid(color) {
  var center = new Bubble(CENTER_X, CENTER_Y, color, RADIUS, SPEED);
  grid = new Grid(CENTER_X, CENTER_Y, SIDES, 2 * RADIUS, GON_CHORD);
  grid.init(center);
}

function clearCanvas() {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function render() {
  frame++;

  detectCollision();

  clearCanvas();

  polygon.render(ctx);

  if (selected) {
    selected.render(ctx);
  }

  cannons.forEach(function(b) {
    b.render(ctx);
  });

  grid.render(ctx);

  animateNext();
}

function animateNext() {
  if (!input) {
    raf = requestAnimationFrame(render);
  } else if (raf) {
    cancelAnimationFrame(raf);
    raf = null;
    input = true;
  }
}

function detectCollision() {
  if (selected && !input) {
    if (selected.vertex().distanceTo(intersect) <= selected.radius) {
      selected.bounce(normal);
      detectBoundaryCollision();
    }

    detectGridCollision();
  }
}

function detectBoundaryCollision() {
  var coll = polygon.collisionPoint(
    selected.vertex(),
    selected.next()
  );

  intersect = coll.intersect;
  normal = coll.normal;

  if (normal) {
    var b = new Vector(center.x - intersect.x, center.y - intersect.y);
    if (b.dot(normal) > 0) {
      // make sure than the normal vector is pointed inward
      normal.flip();
    }
  }
}

function detectGridCollision() {
  var snap = grid.collide(selected);

  if (snap) {
    selected.stop();
    selected = null;
    input = true;
  }
}
