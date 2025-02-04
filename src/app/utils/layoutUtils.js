import dagre from '@dagrejs/dagre';
import { hierarchy, tree } from 'd3-hierarchy';
import ELK from 'elkjs/lib/elk.bundled.js';

const elk = new ELK();

export const layouts = {
  // Hierarchical layout using dagre
  dagre: (nodes, edges) => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'LR', nodesep: 200, ranksep: 200 });
    g.setDefaultEdgeLabel(() => ({}));

    nodes.forEach(node => {
      g.setNode(node.id, { width: 150, height: 50 });
    });

    edges.forEach(edge => {
      g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

    return nodes.map(node => {
      const nodeWithPosition = g.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x,
          y: nodeWithPosition.y,
        },
      };
    });
  },

  // Tree layout using d3-hierarchy
  tree: (nodes, edges) => {
    const root = hierarchy(nodes[0]);
    const treeLayout = tree().nodeSize([200, 200]);
    const layoutedTree = treeLayout(root);

    return layoutedTree.descendants().map(node => ({
      ...node.data,
      position: { x: node.x, y: node.y },
    }));
  },
};
