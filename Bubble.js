var Bubble = function(x, y, color, radius, speed) {
  var self = this;

  self.x = x;
  self.y = y;
  self.color = color;

  self.vx = 0;
  self.vy = 0;

  self.selectable = false;
  self.selected = false;

  self.radius = radius;
  self.speed = speed;

  self.setSelectable = function(s) {
    self.selectable = s;
  };

  self.setSelected = function(s) {
    self.selected = s;
  };

  self.render = function(ctx) {
    self.updatePosition();

    ctx.beginPath();
    ctx.arc(self.x, self.y, self.radius, 0, Math.PI * 2, true);
    ctx.fillStyle = self.color;
    ctx.fill();

    if (self.selected) {
      ctx.beginPath();
      ctx.arc(self.x, self.y, self.radius / 3, 0, Math.PI * 2, true);
      ctx.fillStyle = 'white';
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

  self.setDirection = function(v) {
    var x = v.x;
    var y = v.y;
    var n = norm(x - self.x, y - self.y);
    self.setSpeed((x - self.x) / n * self.speed, (y - self.y) / n * self.speed);
  };

  self.updatePosition = function() {
    self.x += self.vx;
    self.y += self.vy;
  };

  self.bounce = function(n) {
    var v = self.velocity().reflect(n);

    self.setDirection(v);
  };

  self.vertex = function() {
    return new Vector(self.x, self.y);
  };

  self.velocity = function() {
    return new Vector(self.vx, self.vy);
  };

  self.next = function() {
    return new Vector(
      self.x + self.vx,
      self.y + self.vy
    );
  };
};
