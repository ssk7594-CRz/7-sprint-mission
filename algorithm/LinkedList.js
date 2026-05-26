class Node {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

class LinkedList {
  constructor() {
    this.head = null;
  }

  addNode(value) {
    const node = new Node(value);
    if (!this.head) {
      this.head = node;
      return;
    }
    let current = this.head;
    while (current.next) {
      current = current.next;
    }
    current.next = node;
  }

  findNode(value) {
    let current = this.head;
    while (current) {
      if (current.value === value) return current;
      current = current.next;
    }
    return null;
  }

  insertAfter(targetValue, newValue) {
    const target = this.findNode(targetValue);
    if (!target) return;
    const node = new Node(newValue);
    node.next = target.next;
    target.next = node;
  }

  removeAfter(targetValue) {
    const target = this.findNode(targetValue);
    if (!target || !target.next) return;
    target.next = target.next.next;
  }
}
