// VISUALS:
// --------
// draw active nodes in blue (maybe)
// draw light gray lines connecting nodes in a graph
// nodes "bounce" red (then fade to lighter red on broadcast), 
//    turn red and glow when in MIS
//    broadcast sends out a fuzzy ring that fades as it expands
// inactive nodes fade to gray
//
// TODO:
// -----
// Expose for tweaking in UI
//     - (M) 
//     - number of nodes (n)
//     - broadcast range of nodes
//     - netwk.delay



function distance(xy1,xy2){
    return Math.sqrt(Math.pow(xy2[0] - xy1[0] ,2) + Math.pow(xy2[1] - xy1[1], 2));
}

// constants. might want to vary based on paper size:
var nodeRadius = 10,
    broadcastRange = 100;


// TODO: why aren't namespaces working here?
// our nodes and edges:
Raphael.fn.node = function(xy){
    return this.circle(xy[0] , xy[1] , nodeRadius);
}
Raphael.fn.edges = function(edges){
    var edgeString = "";
    $.each(edges, function(i,e){
        edgeString+="M"+e[0][0]+","+e[0][1]+"L"+e[1][0]+","+e[1][1];
    });
    return this.path(edgeString);
}

// Node exit visuals:
Raphael.el.exits = function(inMIS){
    if (inMIS){
        this.attr("fill","red");
    } else{
        this.attr("fill","gray");
    }
}

// Node broadcast visuals:
// TODO: we need 'broadcast' and 'received' events to alter different
//       properties (i.e. not just fill color) , since they happen
//       simultaneously
Raphael.el.broadcasts = function(){
    this.attr("fill","yellow");
}
Raphael.el.received = function(){
    this.attr("fill","white");
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
        edges = [];
    $.each(adjList, function(nd_id, nbrs){
        var xy = coords[nd_id];
        nodeEls.push( p.node(xy) );
        $.each(nbrs, function(i,n_nd_id){
            if (nd_id < n_nd_id){ // only one path between nodes
                var xy2 = coords[n_nd_id];
                edges.push( [xy, xy2] );
            }
        });
    });
    // add adges as a single path element for speed:
    p.edges(edges);

    // initialize the Network!
    var netwk = new Network(adjList);

    // visuals for nodes' exits:
    eve.on("*.exits.*", function(){
        var m = eve.nt().split("."),
            nd = nodeEls[ m[0] ];
        if (m[2] === "IN_MIS"){
            nd.exits(true);
        } else{
            nd.exits(false);
        }
    });

    // visuals for broadcasts:
    eve.on("*.broadcasts", function(){
        var id = eve.nt().split(".")[0];
        nodeEls[id].broadcasts();
    });
    eve.on("*.received", function(){
        var id = eve.nt().split(".")[0];
        nodeEls[id].received();
    });

    return netwk;
};

// keep track of steps, and listen for phases in the exch step events, updating
// visuals. This could be improved.
var step,
    phase;
eve.on("announce.exch1", function(ph){
    if (ph !== phase) { // started new phase
        step = 0; 
        phase = ph;
        // adjust visuals for broadcast probability:
        //console.log("probability changed/set to: "+this.broadcastProb());
    }
    // do stuff:
    //console.log(phase,step);
});
eve.on("announce.exch2", function(){
    // do stuff:
    //console.log(phase,step);
    step++;
});


$(function(){
    paper = Raphael("paper", $("#paper").width(), $("#paper").height());

    // bind all the stuff that happens outside the canvas here:
});
