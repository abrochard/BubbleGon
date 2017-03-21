var Node = function(sides, object) {
  var self = this;

  self.neighbors = Array.apply(null, Array(sides))
    .map(Number.prototype.valueOf, 0); // init array with 0
  self.object = object;

  self.setObject = function(o) {
    self.object = o;
  };

  self.render = function(ctx) {
    if (self.object) {
      self.object.render(ctx);
    }
  };
};

var Grid = function(sides) {
  var self = this;

  self.nodes = [];
  self.sides = sides;

  self.init = function(bubble) {
    var n = new Node(self.sides, bubble);
    self.nodes.push(n);
  };

  self.render = function(ctx) {
    self.nodes.forEach(function(n) {
      n.render(ctx);
    });
  };

  self.add = function(bubble) {
    var n = new Node(self.sides, bubble);
    self.nodes.push(n);
  };

  self.collide = function(bubble) {
    var coll = self.nodes.filter(function(n) {
      return n.object.collide(bubble);
    });

    if (coll.length === 0) {
      return false;
    } else {
      self.add(bubble);
      return true;
    }
  };
};
