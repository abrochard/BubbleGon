'use strict';
var Node = function(i, j, x, y, bubble) {
  var self = this;

  self.i = i;
  self.j = j;
  self.x = x;
  self.y = y;
  self.bubble = bubble;
  self.neighbors = [];
  self.hash = JSON.stringify({x: self.x, y: self.y});

  self.setBubble = function(bubble) {
    self.bubble = bubble;
    bubble.setPosition(self.vertex());
    bubble.stop();
  };

  self.vertex = function() {
    return new Vector(self.x, self.y);
  };

  self.addNeighbor = function(node) {
    self.neighbors.push(node);
  };

  self.render = function(ctx) {
    if (self.bubble) {
      self.bubble.render(ctx);
    }

    if (DEBUG) {
      (new Bubble(self.x, self.y, 'green', 5, 0)).render(ctx);
    }
  };

  self.isEmpty = function() {
    return self.bubble === null;
  };

  self.nonEmptyNeighbors = function() {
    return self.neighbors.map(function(n, i) {
      return n.isEmpty() === false ? i: null;
    }).filter(function(n) {
      return n !== null;
    });
  };

  self.findClosestNeighbor = function(v, empty) {
    var min = -1;
    var node = null;

    for (var i = 0; i < self.neighbors.length; i++) {
      var n = self.neighbors[i];
      if (n.isEmpty() == empty) {
        var d = n.vertex().distanceTo(v);
        if (min < 0 || d < min) {
          node = n;
          min = d;
        }
      }
    }

    if (node == null) {
      return false;
    }
    return {x: node.i, y: node.j};
  };
};
