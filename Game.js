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

var ctx = null;
var raf = null;

var input = true;
var selected = null;

var bubbles = [];
var cannons = [];

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
};

function norm(a, b) {
  return Math.sqrt((a * a) + (b * b));
}

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
    render();
  }
}

function unselect() {
  if (selected) {
    selected.setSelected(false);
  }
}

function renderGon() {
  ctx.beginPath();
  ctx.moveTo(
    CENTER_X +  GON_CHORD * Math.cos(0),
    CENTER_Y +  GON_CHORD *  Math.sin(0)
  );

  for (var i = 1; i <= SIDES; i += 1) {
    ctx.lineTo(
      CENTER_X + GON_CHORD * Math.cos(i * 2 * Math.PI / SIDES),
      CENTER_Y + GON_CHORD * Math.sin(i * 2 * Math.PI / SIDES)
    );
  }

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.stroke();
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

function animateBubbles() {
  for (var i = 0; i < bubbles.length; i++) {
    bubbles.render();
  }

  raf = requestAnimationFrame(animateBubbles);
}

function render() {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  renderGon();

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
