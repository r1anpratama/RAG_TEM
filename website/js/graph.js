/**
 * Vis.js Network Visualizer for Geo-GraphRAG Topology (TEM PSHA2025 Table 2).
 */

let network = null;

async function initKnowledgeGraph() {
  try {
    const resp = await fetch('/api/v1/graph');
    const graphData = await resp.json();

    const container = document.getElementById('network-graph');
    const data = {
      nodes: new vis.DataSet(graphData.nodes.map(n => ({
        id: n.id,
        label: n.label,
        color: n.color,
        font: { color: '#ffffff', size: 11 },
        shape: n.type === 'FACILITY' ? 'box' : (n.type === 'MULTI_RUPTURE_PAIR' ? 'diamond' : 'dot'),
        size: n.type === 'FAULT' ? 18 : 14
      }))),
      edges: new vis.DataSet(graphData.edges.map(e => ({
        from: e.from,
        to: e.to,
        label: e.relation,
        color: { color: '#475569', highlight: '#06b6d4' },
        font: { color: '#94a3b8', size: 9, align: 'middle' },
        arrows: 'to'
      })))
    };

    const options = {
      physics: {
        solver: 'forceAtlas2Based',
        forceAtlas2Based: { gravitationalConstant: -35, centralGravity: 0.01, springLength: 60 }
      },
      interaction: { hover: true, tooltipDelay: 100 }
    };

    network = new vis.Network(container, data, options);
  } catch (err) {
    console.error("Failed to load Knowledge Graph:", err);
  }
}
