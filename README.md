# d3-tree

Simple D3.js based tree example.

## Usage

Source is available in the `./src` directory. Just open the `index.html` in any browser to view the UI.

Nodes are connected in a d3 tree network, but with some hacking to allow cycles (so not a tree...).

Nodes are dynamic along vertical "depth" axes, but static in the x-direction.

Double click to toggle the fixing of node position.

Hovering over nodes highlights paths to (solid) and from (dashed) the node.

Hovering over arcs/links/paths (depending on nomenclature) highlights the start node (green) and the end node (red).