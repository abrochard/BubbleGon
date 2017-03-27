var Node = function(x, y, bubble) {
  var self = this;

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

  self.addNeighbor = function(index, node) {
    self.neighbors[index] = node;
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
    return self.neighbors.filter(function(n) {
      return n.isEmpty() === false;
    });
  };

  self.findClosestNeighbor = function(v, empty) {
    var min = -1;
    var index = -1;

    for (var i = 0; i < self.neighbors.length; i++) {
      var n = self.neighbors[i];
      if (n.isEmpty() == empty) {
        var d = n.vertex().distanceTo(v);
        if (min < 0 || d < min) {
          index = i;
          min = d;
        }
      }
    }

    if (index < 0) {
      return false;
    }
    return self.neighbors[index];
  };
};
