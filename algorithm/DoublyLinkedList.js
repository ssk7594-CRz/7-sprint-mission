class Node {
  constructor(value) {
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

class DoublyLinkedList {
  constructor() {
    this.head = null;
    this.tail = null;
  }

  addToHead(value) {
    const node = new Node(value);
    if (!this.head) {
      this.head = node;
      this.tail = node;
      return;
    }
    node.next = this.head;
    this.head.prev = node;
    this.head = node;
  }

  addToTail(value) {
    const node = new Node(value);
    if (!this.tail) {
      this.head = node;
      this.tail = node;
      return;
    }
    node.prev = this.tail;
    this.tail.next = node;
    this.tail = node;
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
    node.prev = target;
    node.next = target.next;
    if (target.next) {
      target.next.prev = node;
    } else {
      this.tail = node;
    }
    target.next = node;
  }

  removeNode(value) {
    const target = this.findNode(value);
    if (!target) return;
    if (target.prev) {
      target.prev.next = target.next;
    } else {
      this.head = target.next;
    }
    if (target.next) {
      target.next.prev = target.prev;
    } else {
      this.tail = target.prev;
    }
  }
}
