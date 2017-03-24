var Node = function(sides, object) {
  var self = this;

  self.neighbors = [];
  self.sides = sides;
  self.object = object;

  self.registerNeighbors = function() {
    self.neighbors = [];
    var v = null;
    var x = self.object.x;
    var y = self.object.y;
    var r = self.object.radius * 2;

    for (var i = 0; i < self.sides; i++) {
      v = new Vector(
        x + r * Math.cos(i * 2 * Math.PI / self.sides),
        y + r * Math.sin(i * 2 * Math.PI / self.sides)
      );
      self.neighbors.push({
        v: v,
        empty: true
      });
    }
  };

  self.render = function(ctx) {
    if (self.object) {
      self.object.render(ctx);
    }
  };

  self.findClosestNeighbor = function(x) {
    var min = -1;
    var index = -1;

    for (var i = 0; i < self.neighbors.length; i++) {
      var n = self.neighbors[i];
      if (n.empty) {
        var d = n.v.distanceTo(x);
        if (min < 0 || d < min) {
          index = i;
          min = d;
        }
      }
    }

    return self.neighbors[index].v;
  };

  self.snap = function(neighbor) {
    var v = neighbor.findClosestNeighbor(self.object);
    self.object.setPosition(v);
  };

  self.registerNeighbors();
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

  self.add = function(node, bubble) {
    var n = new Node(self.sides, bubble);
    n.snap(node);
    self.nodes.push(n);
  };

  self.collide = function(bubble) {
    var coll = self.nodes.filter(function(n) {
      return n.object.collide(bubble);
    });

    if (coll.length === 0) {
      return false;
    } else {
      self.add(coll[0], bubble);
      return true;
    }
  };
};
