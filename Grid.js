'use strict';
var Grid = function(x, y, distance) {
  var self = this;

  self.x = x;
  self.y = y;
  self.sides = 6;
  self.distance = distance;
  self.nodes = {};
  self.rings = [];
  self.hexToPixel = {};
  self.pixelToHex = {};
  self.nonEmptyNodesIndex = {};

  self.colors = {};

  self.max = 11;
  self.initialRadius = 4;

  self.q = (new Vector(1, 0)).times(self.distance);
  self.r = (new Vector(Math.cos(Math.PI / 3), Math.sin(Math.PI / 3)))
    .times(self.distance);

  self.init = function(colors, maxColors) {
    self.nodes[0] = {};
    self.nodes[0][0] = new Node(0, 0, self.x, self.y, null);
    self.rings[0] = [{x: 0, y: 0}];

    for (var r = 1; r <= self.max; r++) {
      var ring = self.getRing(r);
      ring.forEach((n) => {
        var i = n.x;
        var j = n.y;
        var v = self.q.times(i).plus(self.r.times(j));
        var x = self.x + v.x;
        var y = self.y + v.y;
        var node = new Node(i, j, x, y, null);

        if (typeof self.nodes[i] === 'undefined') {
          self.nodes[i] = {};
        }
        self.nodes[i][j] = node;
      });
      self.rings[r] = ring;
    }

    self.sweep((n, x, y) => {
      self.getNeighbors(x, y).forEach((val, i) => {
        n.addNeighbor(self.nodes[val.x][val.y]);
      });
    });

    return self.generate(colors, maxColors);
  };

  function hexHash(x, y) {
    return x + ':' + y;
  }

  self.generate = function(colors, maxColors) {
    var pool = getNRandom(maxColors, colors);
    var color = pool[Math.floor(Math.random() * pool.length)];
    var bubble = new Bubble(self.x, self.y, color, self.distance / 2, 0);
    self.setBubble(0, 0, bubble);

    for (var i = 1; i < self.initialRadius; i++) {
      var ring = self.getRing(i);
      ring.forEach((v) => {
        color = pool[Math.floor(Math.random() * pool.length)];
        bubble = new Bubble(0, 0, color, self.distance / 2, 0); // coordinates don't matter
        self.setBubble(v.x, v.y, bubble);
      });
    }

    return self.activeColors();
  };

  var getNRandom = function(n, arr) {
    if (n >= arr.length) {
      return arr;
    }

    var output = [];
    var x = 0;
    for (var i = 0; i < n; i++) {
      x = Math.floor(Math.random() * arr.length);
      output = output.concat(arr.splice(x, 1));
    }

    return output;
  };

  self.setBubble = function(x, y, bubble) {
    self.nodes[x][y].setBubble(bubble);
    self.nonEmptyNodesIndex[hexHash(x, y)] = {x: x, y: y};
    self.colors[bubble.color] = true;
  };

  self.nodeExists = function(n) {
    if (typeof self.nodes[n.x] === 'undefined') {
      return false;
    }

    if (typeof self.nodes[n.x][n.y] === 'undefined') {
      return false;
    }

    return true;
  };

  self.getNeighbors = function(x, y) {
    return [
      {x: x + 1, y: y - 1}, // top right
      {x: x + 1, y: y}, // middle right
      {x: x, y: y + 1}, // bottom right
      {x: x - 1, y: y + 1}, // bottom left
      {x: x - 1, y: y}, // middlge left
      {x: x, y: y - 1} // top left
    ].filter(self.nodeExists);
  };

  self.getRing = function(radius) {
    if (radius > self.max) {
      return [];
    }

    var ring = [];

    // top line
    for (var i = 1; i < radius; i++) {
      ring.push({x: radius - i, y: -radius});
    }
    ring.push({x: radius, y: -radius});
    // right up
    for (var i = 1; i < radius; i++) {
      ring.push({x: radius, y: -i});
    }
    ring.push({x: radius, y: 0});
    // right bottom
    for (var i = 1; i < radius; i++) {
      ring.push({x: i, y: radius - i});
    }
    ring.push({x: 0, y: radius});
    // bottom
    for (var i = 1; i < radius; i++) {
      ring.push({x: -radius + i, y: radius});
    }
    // left bottom
    ring.push({x: -radius, y: radius});
    for (var i = 1; i < radius; i++) {
      ring.push({x: -radius, y: i});
    }
    // left up
    ring.push({x: -radius, y: 0});
    for (var i = 1; i < radius; i++) {
      ring.push({x: -radius + i, y: -i});
    }
    ring.push({x: 0, y: -radius});

    return ring;
  };

  self.sweep = function(fn) {
    for (var i in self.nodes) {
      for (var j in self.nodes[i]) {
        fn(self.nodes[i][j], parseInt(i), parseInt(j));
      }
    }
  };

  self.render = function(ctx) {
    if (DEBUG) {
      self.sweep((n) => {
        n.render(ctx);
      });
    } else {
      var index = 0;
      for (var hash in self.nonEmptyNodesIndex) {
        index = self.nonEmptyNodesIndex[hash];
        self.nodes[index].render(ctx);
      }
    }
  };

  self.collide = function(bubble) {
    var coll = [];
    for (var hash in self.nonEmptyNodesIndex) {
      var index = self.nonEmptyNodesIndex[hash];
      var n = self.nodes[index.x][index.y];
      if (n.bubble.collide(bubble)) {
        coll.push({x: index.x, y: index.y});
      }
    }

    if (coll.length === 0) {
      return false;
    } else {
      var index = coll[0];
      var node = self.nodes[index.x][index.y];
      var target = node.findClosestNeighbor(bubble.vertex(), true);
      self.setBubble(target.x, target.y, bubble);
      self.propagate(target.x, target.y);
      self.refreshActiveColors();
      return true;
    }
  };

  self.nonEmptyNeighbors = function(x, y) {
    var neighbors = self.getNeighbors(x, y);
    return neighbors.filter((n) => {
      return self.nodes[n.x][n.y].isEmpty() === false;
    });
  };

  self.propagate = function(x, y) {
    var node = self.nodes[x][y];
    var color = node.bubble.color;
    var size = 1;
    var toEmtpy = [];
    toEmtpy.push({x: x, y: y});
    var nodesToCheck = self.nonEmptyNeighbors(x, y);
    var visited = {};
    visited[node.hash] = true;

    var i = 0;
    var l = nodesToCheck.length;
    var toCheck = null;

    while (i < l) {
      toCheck = nodesToCheck[i];
      node = self.nodes[toCheck.x][toCheck.y];
      if (typeof visited[node.hash] === 'undefined') {
        // never visited node
        visited[node.hash] = true;
        if (node.bubble.color == color) {
          toEmtpy.push({x: toCheck.x, y: toCheck.y});
          nodesToCheck = nodesToCheck.concat(
            self.nonEmptyNeighbors(toCheck.x, toCheck.y)
          );
          size++;
          l = nodesToCheck.length;
        }
      }
      i++;
    }

    if (size >= 3) {
      self.emptyNodes(toEmtpy);

      var distached = self.findDistachedNodes();
      self.emptyNodes(distached);
    }
  };

  self.emptyNodes = function(coordinates) {
    coordinates.forEach(function(index) {
      var n = self.nodes[index.x][index.y];
      n.bubble = null;
      delete self.nonEmptyNodesIndex[hexHash(index.x, index.y)];
    });
  };

  self.findDistachedNodes = function() {
    var center = self.nodes[0][0];
    if (center.isEmpty()) {
      // Game over, clean all
      return Object.keys(self.nonEmptyNodesIndex).map((key) => {
        return self.nonEmptyNodesIndex[key];
      });
    }

    var visited = {};
    visited[hexHash(0, 0)] = true;
    var i = 0;
    var nodesToCheck = self.nonEmptyNeighbors(0, 0);
    var l = nodesToCheck.length;

    while (i < l) {
      var n = nodesToCheck[i];
      var hash = hexHash(n.x, n.y);
      if (typeof visited[hash] === 'undefined') {
        // never visited node
        visited[hash] = true;
        nodesToCheck = nodesToCheck.concat(
          self.nonEmptyNeighbors(n.x, n.y)
        );
        l = nodesToCheck.length;
      }
      i++;
    }

    return Object.keys(self.nonEmptyNodesIndex).filter((e) => {
      return Object.keys(visited).indexOf(e) < 0;
    }).map((h) => {
      return self.nonEmptyNodesIndex[h];
    });
  };

  self.activeColors = function() {
    var output = [];
    for (var key in self.colors) {
      output.push(key);
    }
    return output;
  };

  self.getRandomActiveColor = function() {
    var colors = self.activeColors();
    return colors[Math.floor(Math.random() * colors.length)];
  };

  self.refreshActiveColors = function() {
    self.colors = {};
    var b = null;
    for (var key in self.nonEmptyNodesIndex) {
      var i = self.nonEmptyNodesIndex[key];
      b = self.nodes[i.x][i.y].bubble;
      self.colors[b.color] = true;
    }
  };

  self.isEmpty = function() {
    return (Object.keys(self.nonEmptyNodesIndex).length === 0) &&
      (self.nonEmptyNodesIndex.constructor === Object);
  };

  self.grow = function() {
    var n = self.nodes[0];
    var color = null;
    var bubble = null;

    for (var i = 0; i < self.sides; i++) {
      self.push(n, i);
      color = self.getRandomActiveColor();
      bubble = new Bubble(n.x, n.y, color, self.distance / 2, 0);
      self.setBubble(0, bubble);
    }
  };

  self.mod = function(i, n) {
    var temp = i % n;
    if (temp < 0) {
      return temp + n;
    }

    return temp;
  };

  self.push = function(node, to) {
    if (node.neighbors.length === 0) {
      return;
    }
    if (node.isEmpty()) {
      return;
    }

    var directions = [];
    directions.push(to);
    directions.push(self.mod(to + 1, self.sides));
    directions.push(self.mod(to - 1, self.sides));

    for (var i = 0; i < directions.length; i++) {
      var direction = directions[i];
      var neighbor = node.neighbors[direction];
      if (neighbor.isEmpty() === false && direction == to) {
        self.push(neighbor, direction);
      }

      var clone = new Bubble(
        node.bubble.x,
        node.bubble.y,
        node.bubble.color,
        node.bubble.radius,
        0
      );
      var index = self.nodesHashIndex[neighbor.hash];
      self.setBubble(index, clone);
    }

    self.emptyNodes([node.hash]);
  };
};
