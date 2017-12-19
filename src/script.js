const treeData = {
    id: 'stage 1',
    children: [{
            id: 'stage 2a',
            children: [{
                id: 'stage 6',
            }]
        },
        {
            id: 'stage 2b',
            children: [{
                id: 'stage 3a',
                children: [{
                        id: 'stage 4a',
                        children: [{
                            id: 'stage 6',
                        }]
                    },
                    {
                        id: 'stage 4b',
                        children: [{
                                id: 'stage 5a',
                                children: [{
                                        id: 'stage 2b',
                                    },
                                    {
                                        forceDepth: 6,
                                        id: 'stage 6',
                                    }
                                ]
                            },
                            {
                                id: 'stage 1',
                            }
                        ]
                    },
                    {
                        id: 'stage 4c',
                        children: [{
                            id: 'stage 6',
                        }]
                    },
                    {
                        id: 'stage 4d',
                        children: [{
                            id: 'stage 6',
                        }]
                    }
                ]
            }]
        },
        {
            id: 'stage 2c',
            children: [{
                id: 'stage 6',
            }]
        },
        {
            id: 'stage 2d',
            children: [
                {
                    id: 'stage 6',
                }
            ]
        }
    ]
};

const frame = {
    padding: {
        top: 20,
        right: 60,
        bottom: 20,
        left: 60
    },
    width: 1200,
    height: 600,
    radius: 10,
    duration: 500,
    depth: 200,
    linkDistance: 200,
    nodeCharge: -2000,
};

const byId = (el, ref) => {
    return el.id === ref;
};

function byDepth(a, b) {
    if (a.forceDepth && !b.forceDepth) {
        return -1;
    } else if (!a.forceDepth && b.forceDepth) {
        return 1;
    } else {
        return a.depth - b.depth;
    }
}

function uuid() {
    return 'uuid-xxxx-xxxx-xxxx-xxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function unique(arr) {
    let result = [];
    let store = [];

    for (let el of arr) {
        if (store.indexOf(el.id) === -1) {
            result.push(el);
            store.push(el.id);
        }
    }
    return result;
}

function createSVG(opts) {
    const svg = d3.select('body')
        .append('svg')
        .attr('width', opts.width)
        .attr('height', opts.height)
        .attr('class', 'svg')
        .append('g')
        .attr('transform', `translate(${opts.padding.left}, ${opts.padding.top})`);

    svg.append('defs')
        .selectAll('marker')
        .data(['forwardArrow', 'backwardArrow'])
        .enter()
        .append('marker')
        .attr('id', d => d)
        .attr('viewBox', '-6 -6 12 12')
        .attr('refX', 11)
        .attr('refY', 0)
        .attr('markerWidth', 12)
        .attr('markerHeight', 12)
        .attr('markerUnits', 'userSpaceOnUse')
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M 0, 0  m -5, 0  a 5,5 0 1,0 10,0  a 5,5 0 1,0 -10,0')
        .style('stroke', d => (d === 'forwardArrow') ? '#aaa' : 'rgb(154, 81, 250)')
        .style('fill', d => (d === 'forwardArrow') ? '#aaa' : 'rgb(154, 81, 250)')
        .style('opacity', '1');

    return svg;
}

function initRoot(data, opts) {
    const obj = Object.assign({}, data);
    obj.x0 = opts.height / 2;
    obj.y0 = 0;
    return obj;
}

function generateTree(root, opts) {
    const tree = d3.layout.tree()
        .size([opts.height, opts.width]);

    let nodes = tree.nodes(root)
        .sort(byDepth);

    // Set ids for the nodes
    nodes.forEach((v) => {
        v.id = v.id || uuid();
    });

    // Grab the links
    let links = tree.links(nodes);

    // Now we flatten the node list to contain be unique
    nodes = unique(nodes);

    // Now we set the node position and an separate internal uuid
    nodes.forEach((d, index, arr) => {
        d.y = d.depth * opts.depth;
        d.x0 = d.x;
        d.y0 = d.y;
        d.__id = uuid();
    });

    // Now we create a new array of links, similar to the original,
    // but now referring to only the nodes in the flattened node array
    const linksClone = [];
    for (let link of links) {
        let s = link.source;
        let t = link.target;
        let sn;
        let tn;
        for (let node of nodes) {
            if (!sn && s.id === node.id) {
                sn = node;
            }
            if (!tn && t.id === node.id) {
                tn = node;
            }
            if (tn && sn) {
                break;
            }
        }
        linksClone.push({
            source: sn,
            target: tn,
        });
    }
    links = linksClone;

    return {
        nodes,
        links
    };
}

window.onload = (e) => {
    const svg = createSVG(frame);
    const root = initRoot(treeData, frame);
    const tree = generateTree(root, frame);
    const nodes = tree.nodes;
    const links = tree.links;

    function tick(e) {
        const node = svg.selectAll('g.node')
            .data(nodes, d => d.id);

        const link = svg.selectAll('path.link')
            .data(links, d => `${d.source.id}-${d.target.id}`);

        node.attr('transform', d => `translate(${d.y0}, ${d.x})`);
        link.attr('d', d => {
            return diagonal({
                source: {
                    x: d.source.x,
                    y: d.source.y0
                },
                target: {
                    x: d.target.x,
                    y: d.target.y0
                }
            });
        });
    }

    const force = d3.layout.force();
    const drag = d3.behavior.drag()
        .on('dragstart', (d, i) => {
            d3.event.sourceEvent.stopPropagation();
            force.stop();
            d.dscy = d3.event.sourceEvent.clientY;
        })
        .on('drag', (d, i) => {
            d3.event.sourceEvent.stopPropagation();
            d.x += d3.event.sourceEvent.clientY - d.dscy;
            d.px += d3.event.sourceEvent.clientY - d.dscy;
            d.dscy = d3.event.sourceEvent.clientY;
            tick();
        })
        .on('dragend', (d, i) => {
            force.start();
        });

    const diagonal = d3.svg.diagonal()
        .projection((d) => {
            return [d.y, d.x];
        });

    /**
     * Nodes
     */
    const node = svg.selectAll('g.node')
        .data(nodes, d => d.id);

    /**
     * Nodes: Enter
     */
    const nodeEnter = node.enter()
        .append('g')
        .attr('id', d => d.__id)
        .attr('class', 'node')
        .attr('transform', `translate(${root.y0}, ${root.x0})`)
        .on('mouseover', function (d, i) {
            d3.select(this)
                .select('circle')
                .attr('r', frame.radius * 1.2)
                .style('stroke', '#000');

            d3.selectAll('.link')
                .filter(link => (link.source.__id === d.__id) || (link.target.__id === d.__id))
                .style('stroke-width', '10px')
                .filter(link => (link.source.__id === d.__id))
                .style('stroke-dasharray', ('3, 3'));
        })
        .on('mouseout', function (d, i) {
            d3.select(this)
                .select('circle')
                .attr('r', frame.radius)
                .style('stroke', 'steelblue');

            d3.selectAll('.link')
                .filter(link => (link.source.__id === d.__id) || (link.target.__id === d.__id))
                .style('stroke-width', '2px')
                .filter(link => (link.source.__id === d.__id))
                .style('stroke-dasharray', '');
        })
        .on('dblclick', function (d, i) {
            d.fixed = !d.fixed;
            d3.select(this)
                .select('circle')
                .style('fill', d => (d.fixed) ? 'lightsteelblue' : '#fff');
        });

    nodeEnter.append('circle')
        .attr('r', 0)
        .style('fill', '#fff')
        .call(drag);

    nodeEnter.append('text')
        .attr('y', -15)
        .attr('text-anchor', 'middle')
        .text(d => d.text || d.name || d.id || d.uuid)
        .style('fill-opacity', 0);

    /**
     * Nodes: Update
     */
    const nodeUpdate = node.transition()
        .duration(frame.duration)
        .attr('transform', d => `translate(${d.y}, ${d.x})`);

    nodeUpdate.select('circle')
        .attr('r', frame.radius)
        .style('fill', '#fff');

    nodeUpdate.select('text')
        .style('fill-opacity', 1);

    /**
     * Nodes: Exit
     */
    const nodeExit = node.exit()
        .transition()
        .duration(frame.duration)
        .attr('transform', d => `translate(${root.y}, ${root.x})`)
        .remove();

    nodeExit.select('circle')
        .attr('r', 0);

    nodeExit.select('text')
        .style('fill-opacity', 0);

    /**
     * Links
     */
    const link = svg.selectAll('path.link')
        .data(links, d => `${d.source.id}-${d.target.id}`);

    /**
     * Links: Enter
     */
    link.enter()
        .insert('path', 'g')
        .attr('class', d => (d.source.depth > d.target.depth) ? 'link backward' : 'link')
        .attr('marker-end', d => (d.source.depth < d.target.depth) ? 'url(#forwardArrow)' : 'url(#backwardArrow)')
        .on('mouseover', function (d, i) {
            d3.select(this)
                .style('stroke-width', '10px');

            d3.select(`#${d.source.__id}`)
                .select('circle')
                .attr('r', frame.radius * 1.2)
                .style('stroke', 'green');

            d3.select(`#${d.target.__id}`)
                .select('circle')
                .attr('r', frame.radius * 1.2)
                .style('stroke', 'red');

        }).on('mouseout', function (d, i) {
            d3.select(this)
                .style('stroke-width', '2px');

            d3.select(`#${d.source.__id}`)
                .select('circle')
                .attr('r', frame.radius)
                .style('stroke', 'steelblue');

            d3.select(`#${d.target.__id}`)
                .select('circle')
                .attr('r', frame.radius)
                .style('stroke', 'steelblue');
        });

    /**
     * Links: Update
     */
    link.transition()
        .duration(frame.duration)
        .attr('d', diagonal);

    /**
     * Links: Exit
     */
    link.exit().transition()
        .duration(frame.duration)
        .remove();

    /**
     * Force
     */
    force.linkDistance(frame.linkDistance)
        .size([frame.height, frame.width])
        .nodes(nodes)
        .links(links)
        .charge(frame.nodeCharge)
        .on('start', e => {
            console.log('network optimisation started');
        })
        .on('tick', tick)
        .on('end', e => {
            console.log('network optimisation ended');
        });

    force.start();
};