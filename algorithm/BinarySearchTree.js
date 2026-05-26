class Node {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

class BinarySearchTree {
  constructor() {
    this.root = null;
  }

  insert(value) {
    const node = new Node(value);
    if (!this.root) {
      this.root = node;
      return;
    }
    let current = this.root;
    while (true) {
      if (value < current.value) {
        if (!current.left) { current.left = node; return; }
        current = current.left;
      } else {
        if (!current.right) { current.right = node; return; }
        current = current.right;
      }
    }
  }

  find(value) {
    let current = this.root;
    while (current) {
      if (value === current.value) return current;
      current = value < current.value ? current.left : current.right;
    }
    return null;
  }

  remove(value) {
    this.root = this._removeNode(this.root, value);
  }

  _removeNode(node, value) {
    if (!node) return null;
    if (value < node.value) {
      node.left = this._removeNode(node.left, value);
    } else if (value > node.value) {
      node.right = this._removeNode(node.right, value);
    } else {
      if (!node.left) return node.right;
      if (!node.right) return node.left;
      // 오른쪽 서브트리의 최솟값으로 대체
      let min = node.right;
      while (min.left) min = min.left;
      node.value = min.value;
      node.right = this._removeNode(node.right, min.value);
    }
    return node;
  }
}
