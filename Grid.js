var Grid = function(x, y, sides, distance, limit) {
  var self = this;

  self.x = x;
  self.y = y;
  self.sides = sides;
  self.distance = distance;
  self.limit = limit;
  self.nodes = [];
  self.nodesHashIndex = {};
  self.nonEmptyNodesIndex = {};

  self.init = function(bubble) {
    var v = new Vector(self.x, self.y);
    var center = new Vector(self.x, self.y);
    var n = new Node(self.x, self.y, bubble);
    self.addNode(n);

    var queue = self.registerNeighbors(n);
    var i = 0;
    var l = queue.length;

    while (i < l) {
      n = queue[i];
      if (n.vertex().distanceTo(center) < self.limit) {
        queue = queue.concat(self.registerNeighbors(n));
        l = queue.length;
      }
      i++;
    }
  };

  self.addNode = function(node) {
    self.nodesHashIndex[node.hash] = self.nodes.length;
    if (node.isEmpty() === false) {
      self.nonEmptyNodesIndex[node.hash] = self.nodes.length;
    }
    self.nodes.push(node);
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
};
