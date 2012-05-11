// r = radius of broadcast range
// rv = radius of node, visually
//
// set random paoints on canvas, removing if any overlap, e.g. with rv*2
// for each node get other nodes within radius r
// pass this to a new Network()

// VISUALS:
// --------
// draw active nodes in blue (maybe)
// draw light gray lines connecting nodes in a graph
// nodes "bounce" red (then fade to lighter red on broadcast), 
//    turn red and glow when in MIS
//    broadcast sends out a fuzzy ring that fades as it expands
// inactive nodes fade to gray



function distance(xy1,xy2){
    return Math.sqrt(Math.pow(xy2[0] - xy1[0] ,2) + Math.pow(xy2[1] - xy1[1], 2));
}

// constants. might want to vary based on paper size:
var nodeRadius = 10,
    broadcastRange = 100;


// TODO: why aren't namespaces working here??

// our nodes and edges:
Raphael.fn.node = function(xy){
    return this.circle(xy[0] , xy[1] , nodeRadius);
}
Raphael.fn.edge = function(xy1,xy2){
    return this.path("M"+xy1[0]+","+xy1[1]+"L"+xy2[0]+","+xy2[1]);
}

// do everything that happens in that canvas here:
Raphael.fn.simulateMIS = function(n){

    var p = this,
        h = p.height,
        w = p.width;

    // get n random coordinates
    var coords = [];
    while(coords.length < n){
        var x = Math.round(Math.random() * w),
            y = Math.round(Math.random() * h);
        // keep nodes away from edges:
        if (x < nodeRadius || (x+nodeRadius) > w || (y+nodeRadius) > h || y < nodeRadius) continue;
        
        // make sure nothing overlaps, and add some breathing room
        var overlaps = $.grep(coords, function(xy1){
            return (distance(xy1, [x,y]) < (nodeRadius * 2 + 5));
        });
        if(overlaps.length === 0) coords.push([x,y]);
    }

    // Build an adjacency list from our coordinates. 
    // TODO later: improve dumb O(n^2) implementation w/ a kd-tree here
    var adjList = [];
    $.each(coords , function(nd_id, xy){
        var adj = [];
        $.each(coords , function(ndN_id, xyN){ 
            if(nd_id != ndN_id && distance(xy,xyN) <= broadcastRange) adj.push(ndN_id);
        });
        adjList.push(adj);
    });

    // add 'n' nodes to paper, w/ edges between:
    var nodeEls = [], // in index order corresponding to adjList/coords
        edgeEls = [];
    $.each(adjList, function(nd_id, nbrs){
        var xy = coords[nd_id];
        nodeEls.push( p.node(xy) );
        $.each(nbrs, function(i,n_nd_id){
            if (nd_id < n_nd_id){ // only one path between nodes
                var xy2 = coords[n_nd_id];
                edgeEls.push( p.edge(xy, xy2) );
            }
        });
    });

    // initialize the Network!
    var netwk = new Network(adjList);

    // install Network event handlers that should control visuals within paper:
    $.each(nodeEls, function(nd_id, nd){
        eve.on(nd_id+".exits.IN_MIS", function(){
            nd.attr("fill","red");
        });
        eve.on(nd_id+".exits.NOT_IN_MIS", function(){
            nd.attr("fill","gray");
        });
    });

    return netwk;
};


$(function(){
    paper = Raphael("paper", $("#paper").width(), $("#paper").height());

    // bind all the stuff that happens outside the canvas here:
});
