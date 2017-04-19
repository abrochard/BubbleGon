'use strict';
var Grid = function(x, y, distance, limit) {
  var self = this;

  self.x = x;
  self.y = y;
  self.sides = 6;
  self.distance = distance;
  self.limit = limit;
  self.nodes = [];
  self.nodesHashIndex = {};
  self.nonEmptyNodesIndex = {};

  self.colors = [];

  self.init = function(colors, maxColors) {
    var v = new Vector(self.x, self.y);
    var center = new Vector(self.x, self.y);
    var n = new Node(self.x, self.y, null);
    self.addNode(n);

    var queue = self.registerNeighbors(n);
    var i = 0;
    var l = queue.length;

    while (i < l && i < 4000) {
      n = queue[i];
      if (n.vertex().distanceTo(center) < self.limit) {
        queue = queue.concat(self.registerNeighbors(n));
        l = queue.length;
      }
      i++;
    }

    return self.generate(colors, maxColors);
  };

  self.generate = function(colors, maxColors) {
    var pool = getNRandom(maxColors, colors);
    var color = pool[Math.floor(Math.random() * pool.length)];
    var bubble = new Bubble(self.x, self.y, color, self.distance / 2, 0);
    self.setBubble(0, bubble);
    self.colors.push(bubble.color);

    var hash = '';
    var n = null;
    for (var i = 0; i < self.nodes[0].neighbors.length; i++) {
      hash = self.nodes[0].neighbors[i].hash;
      n = self.nodes[self.nodesHashIndex[hash]];
      color = pool[Math.floor(Math.random() * pool.length)];
      bubble = new Bubble(n.x, n.y, color, self.distance / 2, 0);
      self.setBubble(self.nodesHashIndex[hash], bubble);
    }

    return pool;
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

  self.addNode = function(node) {
    self.nodesHashIndex[node.hash] = self.nodes.length;
    if (node.isEmpty() === false) {
      self.nonEmptyNodesIndex[node.hash] = self.nodes.length;
    }
    self.nodes.push(node);
  };

  self.setBubble = function(index, bubble) {
    self.nodes[index].setBubble(bubble);
    self.nonEmptyNodesIndex[self.nodes[index].hash] = index;
  };

  self.registerNeighbors = function(node) {
    var x = 0;
    var y = 0;
    var hash = '';
    var n = null;
    var created = [];

    for (var i = 0; i < self.sides; i++) {
      x = node.x + self.distance * Math.cos(i * 2 * Math.PI / self.sides);
      y = node.y + self.distance * Math.sin(i * 2 * Math.PI / self.sides);
      hash = JSON.stringify({x: x, y: y});

      if (typeof self.nodesHashIndex[hash] !== 'undefined') {
        // node already exists
        n = self.nodes[self.nodesHashIndex[hash]];
      } else {
        // create a new one
        n = new Node(x, y, null);
        self.addNode(n);
        created.push(n);
      }
      node.addNeighbor(i, n);
    }

    return created;
  };

  self.render = function(ctx) {
    if (DEBUG) {
      self.nodes.forEach(function(n) {
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
    var index = 0;
    var n = null;

    for (var hash in self.nonEmptyNodesIndex) {
      index = self.nonEmptyNodesIndex[hash];
      n = self.nodes[index];
      if (n.bubble.collide(bubble)) {
        coll.push(n);
      }
    }

    if (coll.length === 0) {
      return false;
    } else {
      n = coll[0].findClosestNeighbor(bubble.vertex(), true);
      n.setBubble(bubble);
      self.nonEmptyNodesIndex[n.hash] = self.nodesHashIndex[n.hash];
      self.propagate(n);
      self.refreshActiveColors();
      return true;
    }
  };

  self.propagate = function(node) {
    var color = node.bubble.color;
    var size = 1;
    var hashesToEmtpy = [];
    hashesToEmtpy.push(node.hash);
    var nodesToCheck = node.nonEmptyNeighbors();
    var visited = {};
    visited[node.hash] = true;

    var i = 0;
    var l = nodesToCheck.length;
    var toCheck = null;

    while (i < l) {
      toCheck = nodesToCheck[i];
      if (typeof visited[toCheck.hash] === 'undefined') {
        // never visited node
        visited[toCheck.hash] = true;
        if (toCheck.bubble.color == color) {
          hashesToEmtpy.push(toCheck.hash);
          nodesToCheck = nodesToCheck.concat(toCheck.nonEmptyNeighbors());
          size++;
          l = nodesToCheck.length;
        }
      }
      i++;
    }

    if (size >= 3) {
      self.emptyNodes(hashesToEmtpy);
    }
  };

  self.emptyNodes = function(hashes) {
    var n = null;
    for (var i = 0; i < hashes.length; i++) {
      n = self.nodes[self.nodesHashIndex[hashes[i]]];
      n.bubble = null;
      delete self.nonEmptyNodesIndex[hashes[i]];
    }
  };

  self.activeColors = function() {
    return self.colors;
  };

  self.refreshActiveColors = function() {
    self.colors = [];
    var found = {};
    var b = null;
    for (var key in self.nonEmptyNodesIndex) {
      b = self.nodes[self.nonEmptyNodesIndex[key]].bubble;
      if (typeof found[b.color] === 'undefined') {
        self.colors.push(b.color);
        found[b.color] = true;
      }
    }
  };

  self.isEmpty = function() {
	return Object.keys(self.nonEmptyNodesIndex).length === 0 && self.nonEmptyNodesIndex.constructor === Object;
  };
};
